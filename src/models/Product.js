const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  discountMin: { type: Number, default: 0 },
  discountMax: { type: Number, default: 0 },
  negotiable: { type: Boolean, default: false },
  stock: { type: Number, default: 0 },
  category: String,
  images: [String],
  sustainabilityScore: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);