const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const UserActivity = require('../models/UserActivity');
const Invoice = require('../models/Invoice');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── Action weights for recommendation scoring ───
const ACTION_WEIGHTS = { view: 1, cart_add: 3, purchase: 5, wishlist: 2 };

// ─── Helper: score products by weighted user activity ───
async function getUserProductScores(userId, limit = 50) {
  const activities = await UserActivity.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$productId',
        totalWeight: { $sum: '$weight' },
        actions: { $push: '$actionType' },
        lastInteraction: { $max: '$createdAt' }
      }
    },
    { $sort: { totalWeight: -1 } },
    { $limit: limit }
  ]);
  return activities;
}

// ═══════════════════════════════════════════════════
//  1. TRACK USER ACTIVITY
// ═══════════════════════════════════════════════════
router.post('/track', verifyToken, async (req, res) => {
  try {
    const { productId, actionType } = req.body;
    if (!productId || !actionType) {
      return res.status(400).json({ error: 'productId and actionType are required' });
    }
    if (!['view', 'cart_add', 'purchase', 'wishlist'].includes(actionType)) {
      return res.status(400).json({ error: 'Invalid actionType' });
    }

    const weight = ACTION_WEIGHTS[actionType] || 1;

    // Save the activity
    await UserActivity.create({
      userId: req.userId,
      productId,
      actionType,
      weight
    });

    // Increment viewCount on product for popularity tracking
    if (actionType === 'view') {
      await Product.findByIdAndUpdate(productId, { $inc: { viewCount: 1 } });
    }
    if (actionType === 'purchase') {
      await Product.findByIdAndUpdate(productId, { $inc: { purchaseCount: 1 } });
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  2. PERSONALIZED RECOMMENDATIONS (for logged-in users)
//     Uses content-based + collaborative filtering
// ═══════════════════════════════════════════════════
router.get('/personalized', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 30);

    // Get user's interaction history
    const userScores = await getUserProductScores(req.userId, 20);

    if (userScores.length === 0) {
      // Fallback to trending if no history
      const trending = await Product.find({ stock: { $gt: 0 } })
        .sort({ viewCount: -1, purchaseCount: -1, createdAt: -1 })
        .limit(limit);
      return res.json({ strategy: 'trending_fallback', products: trending });
    }

    // Get the products the user interacted with
    const interactedProductIds = userScores.map(s => s._id);
    const interactedProducts = await Product.find({ _id: { $in: interactedProductIds } });

    // Extract preference profile
    const preferredBrands = {};
    const preferredCategories = {};
    const preferredTags = {};
    let totalPrice = 0;
    let priceCount = 0;

    interactedProducts.forEach(p => {
      // Weight by interaction score
      const score = userScores.find(s => s._id.toString() === p._id.toString());
      const w = score ? score.totalWeight : 1;

      preferredBrands[p.brand] = (preferredBrands[p.brand] || 0) + w;
      preferredCategories[p.category || 'mobile'] = (preferredCategories[p.category || 'mobile'] || 0) + w;

      if (p.tags && p.tags.length > 0) {
        p.tags.forEach(tag => {
          preferredTags[tag] = (preferredTags[tag] || 0) + w;
        });
      }

      totalPrice += p.price * w;
      priceCount += w;
    });

    const avgPrice = priceCount > 0 ? totalPrice / priceCount : 20000;
    const priceRange = { min: avgPrice * 0.5, max: avgPrice * 2.0 };

    // Find similar products the user hasn't interacted with
    const topBrands = Object.entries(preferredBrands)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);

    const topCategories = Object.entries(preferredCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(e => e[0]);

    const topTags = Object.entries(preferredTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(e => e[0]);

    // Build query: products NOT already interacted with, matching preferences
    const query = {
      _id: { $nin: interactedProductIds },
      stock: { $gt: 0 },
      $or: [
        { brand: { $in: topBrands } },
        { category: { $in: topCategories } },
        { tags: { $in: topTags } },
        { price: { $gte: priceRange.min, $lte: priceRange.max } }
      ]
    };

    let recommendations = await Product.find(query)
      .sort({ viewCount: -1, purchaseCount: -1, createdAt: -1 })
      .limit(limit * 2); // Get more to score them

    // Score each recommendation
    const scored = recommendations.map(p => {
      let score = 0;
      if (topBrands.includes(p.brand)) score += 3;
      if (topCategories.includes(p.category)) score += 2;
      if (p.tags) {
        p.tags.forEach(t => {
          if (topTags.includes(t)) score += 1;
        });
      }
      if (p.price >= priceRange.min && p.price <= priceRange.max) score += 1;
      // Boost popular items
      score += (p.viewCount || 0) * 0.01;
      score += (p.purchaseCount || 0) * 0.05;

      return { product: p, score };
    });

    // Sort by score and take top N
    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, limit).map(s => s.product);

    res.json({
      strategy: 'personalized',
      preferences: { topBrands, topCategories, avgPrice: Math.round(avgPrice) },
      products: results
    });
  } catch (e) {
    console.error('Personalized recommendation error:', e);
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  3. SIMILAR PRODUCTS (content-based for a given product)
// ═══════════════════════════════════════════════════
router.get('/similar/:productId', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Build similarity query
    const conditions = [
      { brand: product.brand, _id: { $ne: product._id }, stock: { $gt: 0 } },
      { category: product.category || 'mobile', _id: { $ne: product._id }, stock: { $gt: 0 } },
    ];

    // Price range: ±40% of the product price
    const priceLow = product.price * 0.6;
    const priceHigh = product.price * 1.4;
    conditions.push({
      price: { $gte: priceLow, $lte: priceHigh },
      _id: { $ne: product._id },
      stock: { $gt: 0 }
    });

    // Tags matching
    if (product.tags && product.tags.length > 0) {
      conditions.push({
        tags: { $in: product.tags },
        _id: { $ne: product._id },
        stock: { $gt: 0 }
      });
    }

    const similar = await Product.find({ $or: conditions })
      .sort({ purchaseCount: -1, viewCount: -1 })
      .limit(limit * 2);

    // Score by similarity
    const scored = similar.map(p => {
      let score = 0;
      if (p.brand === product.brand) score += 4;
      if (p.category === product.category) score += 3;
      if (p.price >= priceLow && p.price <= priceHigh) score += 2;
      if (product.tags && p.tags) {
        const common = p.tags.filter(t => product.tags.includes(t));
        score += common.length;
      }
      score += (p.purchaseCount || 0) * 0.02;
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    // Deduplicate
    const seen = new Set();
    const unique = scored.filter(s => {
      const id = s.product._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    res.json({
      strategy: 'similar',
      baseProduct: { name: product.name, brand: product.brand, category: product.category },
      products: unique.slice(0, limit).map(s => s.product)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  4. TRENDING / POPULAR PRODUCTS
// ═══════════════════════════════════════════════════
router.get('/trending', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const category = req.query.category; // optional filter

    const query = { stock: { $gt: 0 } };
    if (category && ['mobile', 'tablet', 'accessory'].includes(category)) {
      query.category = category;
    }

    const trending = await Product.find(query)
      .sort({ purchaseCount: -1, viewCount: -1, createdAt: -1 })
      .limit(limit);

    res.json({ strategy: 'trending', products: trending });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  5. FREQUENTLY BOUGHT TOGETHER
//     Analyzes invoice data to find co-purchased products
// ═══════════════════════════════════════════════════
router.get('/bought-together/:productId', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 15);

    // Find invoices containing this product
    const invoicesWithProduct = await Invoice.find({
      'items.productId': new mongoose.Types.ObjectId(req.params.productId)
    }).limit(50);

    if (invoicesWithProduct.length === 0) {
      // Fallback: return accessory recommendations if the product is a mobile/tablet
      const product = await Product.findById(req.params.productId);
      if (product && (product.category === 'mobile' || product.category === 'tablet')) {
        const accessories = await Product.find({
          category: 'accessory',
          stock: { $gt: 0 }
        }).sort({ purchaseCount: -1 }).limit(limit);
        return res.json({ strategy: 'cross_category_fallback', products: accessories });
      }
      return res.json({ strategy: 'none', products: [] });
    }

    // Count co-purchased products
    const coPurchaseCounts = {};
    invoicesWithProduct.forEach(invoice => {
      invoice.items.forEach(item => {
        const itemId = item.productId.toString();
        if (itemId !== req.params.productId) {
          coPurchaseCounts[itemId] = (coPurchaseCounts[itemId] || 0) + 1;
        }
      });
    });

    // Sort by frequency
    const sortedIds = Object.entries(coPurchaseCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(e => e[0]);

    const products = await Product.find({
      _id: { $in: sortedIds },
      stock: { $gt: 0 }
    });

    // Maintain order
    const ordered = sortedIds
      .map(id => products.find(p => p._id.toString() === id))
      .filter(Boolean);

    res.json({ strategy: 'bought_together', products: ordered });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  6. CATEGORY-BASED RECOMMENDATIONS
//     Returns products by category with smart sorting
// ═══════════════════════════════════════════════════
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 12, 30);

    if (!['mobile', 'tablet', 'accessory'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Use: mobile, tablet, accessory' });
    }

    const products = await Product.find({ category, stock: { $gt: 0 } })
      .sort({ purchaseCount: -1, viewCount: -1, createdAt: -1 })
      .limit(limit);

    res.json({ strategy: 'category', category, products });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  7. DEALS & DISCOUNTED PRODUCTS
//     Products with active offers, great for homepage
// ═══════════════════════════════════════════════════
router.get('/deals', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const now = new Date();

    const products = await Product.find({
      stock: { $gt: 0 },
      'appliedOffers.active': true,
      'appliedOffers.discountPercent': { $gt: 0 }
    })
      .sort({ 'appliedOffers.discountPercent': -1, purchaseCount: -1 })
      .limit(limit);

    // Filter only products where an offer is currently valid
    const validDeals = products.filter(p => {
      return p.appliedOffers.some(o =>
        o.active &&
        o.discountPercent > 0 &&
        (!o.startDate || now >= new Date(o.startDate)) &&
        (!o.endDate || now <= new Date(o.endDate))
      );
    });

    res.json({ strategy: 'deals', products: validDeals });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  8. NEW ARRIVALS
//     Latest products added to the store
// ═══════════════════════════════════════════════════
router.get('/new-arrivals', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const category = req.query.category;

    const query = { stock: { $gt: 0 } };
    if (category && ['mobile', 'tablet', 'accessory'].includes(category)) {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ strategy: 'new_arrivals', products });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ═══════════════════════════════════════════════════
//  9. BUDGET-BASED RECOMMENDATIONS
//     Find products within a price range
// ═══════════════════════════════════════════════════
router.get('/budget', async (req, res) => {
  try {
    const minPrice = parseInt(req.query.min) || 0;
    const maxPrice = parseInt(req.query.max) || 100000;
    const limit = Math.min(parseInt(req.query.limit) || 12, 30);
    const category = req.query.category;

    const query = {
      stock: { $gt: 0 },
      price: { $gte: minPrice, $lte: maxPrice }
    };
    if (category && ['mobile', 'tablet', 'accessory'].includes(category)) {
      query.category = category;
    }

    const products = await Product.find(query)
      .sort({ purchaseCount: -1, viewCount: -1 })
      .limit(limit);

    res.json({ strategy: 'budget', priceRange: { min: minPrice, max: maxPrice }, products });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
