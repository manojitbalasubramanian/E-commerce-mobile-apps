const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  discountPercent: { type: Number, required: true, min: 0, max: 100 },
  startDate: { type: Date },
  endDate: { type: Date },
  active: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Offer', offerSchema);
