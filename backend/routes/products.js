const express = require('express');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().populate('createdBy', 'name email');
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('createdBy', 'name email');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add new product (Admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can add products' });
    }

    const { name, brand, price, description, stock, image, offer } = req.body;

    if (!name || !brand || price === undefined) {
      return res.status(400).json({ error: 'Name, brand, and price are required' });
    }

    // Validate offer if provided
    if (offer) {
      if (offer.discountPercent !== undefined) {
        const dp = Number(offer.discountPercent)
        if (isNaN(dp) || dp < 0 || dp > 100) return res.status(400).json({ error: 'Invalid offer discountPercent' })
      }
    }

    // Generate sequential productId
    const counter = await Counter.findOneAndUpdate(
      { _id: 'productId' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const seq = counter.seq || 1;
    const productId = String(seq).padStart(13, '0');

    const product = new Product({
      name,
      brand,
      price,
      offer: offer || undefined,
      description,
      stock: stock || 0,
      image,
      productId,
      createdBy: req.userId
    });

    await product.save();
    res.status(201).json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update product (Admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update products' });
    }

    const { name, brand, price, description, stock, image, offer } = req.body;

    // Validate offer if provided
    if (offer) {
      if (offer.discountPercent !== undefined) {
        const dp = Number(offer.discountPercent)
        if (isNaN(dp) || dp < 0 || dp > 100) return res.status(400).json({ error: 'Invalid offer discountPercent' })
      }
    }

    const updateObj = { name, brand, price, description, stock, image, updatedAt: new Date() }
    if (offer !== undefined) updateObj.offer = offer

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true }
    );

    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete products' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    res.json({ message: 'Product deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
