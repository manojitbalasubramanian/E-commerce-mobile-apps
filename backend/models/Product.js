const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Applied offers: array of offers currently applied to this product (snapshots)
  appliedOffers: [{
    offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
    name: { type: String },
    discountPercent: { type: Number, min: 0, max: 100 },
    startDate: { type: Date },
    endDate: { type: Date },
    active: { type: Boolean, default: true }
  }],
  description: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  image: {
    type: String
  },
  images: [{
    type: String
  }],
  productId: {
    type: String,
    unique: true,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Include virtuals when converting to JSON
productSchema.set('toJSON', { virtuals: true })

// Virtual to compute discounted price if offer is active and dates valid
productSchema.virtual('discountedPrice').get(function () {
  const offers = Array.isArray(this.appliedOffers) ? this.appliedOffers : []
  const now = new Date()
  // Filter only active offers that are valid by date and have a discountPercent
  const valid = offers.filter(o => o && o.active && typeof o.discountPercent === 'number' && o.discountPercent > 0 &&
    (!(o.startDate) || now >= new Date(o.startDate)) &&
    (!(o.endDate) || now <= new Date(o.endDate))
  )
  if (!valid.length) return null

  // Apply multiplicative stacking: price * Π(1 - d/100)
  let multiplier = 1
  valid.forEach(o => {
    multiplier *= (1 - (o.discountPercent / 100))
  })

  // Cap total discount to 90% (i.e., final price not less than 10% of original)
  const minMultiplier = 0.1
  if (multiplier < minMultiplier) multiplier = minMultiplier

  const discounted = this.price * multiplier
  return Math.round((discounted + Number.EPSILON) * 100) / 100
})

module.exports = mongoose.model('Product', productSchema);
