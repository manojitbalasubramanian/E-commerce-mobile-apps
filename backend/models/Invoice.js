const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: String,
      price: Number,
      originalPrice: Number,
      appliedOffers: [
        {
          offerId: mongoose.Schema.Types.ObjectId,
          name: String,
          discountPercent: Number,
          startDate: Date,
          endDate: Date,
          active: Boolean
        }
      ],
      quantity: Number
    }
  ],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  customerName: String,
  customerEmail: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
