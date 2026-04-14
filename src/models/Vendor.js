const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopName: { type: String, required: true },
  description: String,
  category: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
    address: String
  },
  whatsapp: { type: String },
  trustScore: { type: Number, default: 0 },
  sustainabilityScore: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

vendorSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Vendor', vendorSchema);