const mongoose = require('mongoose');

const groupBuySchema = new mongoose.Schema({
  // ✅ FIX: product is optional — seed-demo deals don't have real DB products
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: false },

  // ✅ FIX: store display info directly for virtual/default deals
  productName:     { type: String },
  productPrice:    { type: Number },
  productImage:    { type: String },
  productCategory: { type: String },
  vendorName:      { type: String },

  minUsers:        { type: Number, default: 5 },
  discountPercent: { type: Number, default: 10 },
  participants:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status:          { type: String, enum: ['open', 'successful', 'failed'], default: 'open' },
  expiresAt:       { type: Date },
  createdAt:       { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupBuy', groupBuySchema);