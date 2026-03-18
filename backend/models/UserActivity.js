const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  actionType: {
    type: String,
    enum: ['view', 'cart_add', 'purchase', 'wishlist'],
    required: true
  },
  // Weight for recommendation scoring (view=1, cart_add=3, purchase=5)
  weight: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for efficient queries
userActivitySchema.index({ userId: 1, actionType: 1, createdAt: -1 });
userActivitySchema.index({ productId: 1, actionType: 1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);
