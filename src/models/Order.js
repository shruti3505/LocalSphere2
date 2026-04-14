const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: false },
  vendorName: { type: String },

  items: [{
    product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
    productName: { type: String },
    quantity:    Number,
    price:       Number
  }],

  totalAmount:   Number,
  paymentMethod: { type: String, enum: ['cod', 'upi', 'whatsapp'], default: 'cod' },
  status:        { type: String, enum: ['pending', 'confirmed', 'delivered', 'cancelled'], default: 'pending' },

  // ✅ NEW: track every status change with timestamp + note
  statusHistory: [{
    status:    { type: String },
    timestamp: { type: Date, default: Date.now },
    note:      { type: String }
  }],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);