const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const ExpenseTracker = require('../models/ExpenseTracker');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id) && !String(id).startsWith('default') && !String(id).startsWith('groupbuy');

exports.placeOrder = async (req, res) => {
  try {
    const { vendor, vendorName, items, paymentMethod, totalAmount } = req.body;
 

    let calculatedTotal = 0;
    const processedItems = [];

    for (let item of items) {
      const isDefault = !isValidObjectId(item.product);
      if (isDefault) {
        calculatedTotal += item.price * item.quantity;
        processedItems.push({
          productName: item.productName || 'Product',
          quantity: item.quantity,
          price: item.price
        });
      } else {
        const product = await Product.findById(item.product);
        if (!product) return res.status(400).json({ msg: 'Product not found' });
        if (product.stock < item.quantity) return res.status(400).json({ msg: `Insufficient stock for ${product.name}` });
        calculatedTotal += product.price * item.quantity;
        product.stock -= item.quantity;
        await product.save();
        processedItems.push({
          product: product._id,
          productName: product.name,
          quantity: item.quantity,
          price: product.price
        });
      }
    }

    const orderData = {
      buyer: req.user.id,
      items: processedItems,
      totalAmount: totalAmount || calculatedTotal,
      paymentMethod: paymentMethod || 'cod',
      vendorName: vendorName || 'Local Vendor',
      statusHistory: [{ status: 'pending', timestamp: new Date(), note: 'Order placed successfully' }]
    };

    if (isValidObjectId(vendor)) orderData.vendor = vendor;

    const order = new Order(orderData);
    await order.save();

    try {
      let tracker = await ExpenseTracker.findOne({ user: req.user.id });
      if (!tracker) tracker = new ExpenseTracker({ user: req.user.id });
      tracker.totalSpent = (tracker.totalSpent || 0) + (totalAmount || calculatedTotal);
      tracker.expenses = tracker.expenses || [];
      tracker.expenses.push({ orderId: order._id, amount: totalAmount || calculatedTotal });
      await tracker.save();
    } catch (e) { console.error('Expense tracker error:', e.message); }

    res.status(201).json({ order, totalAmount: totalAmount || calculatedTotal });
  } catch (err) {
    console.error('PLACE ORDER ERROR:', err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id })
      .populate('vendor')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('GET ORDERS ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ NEW: Get orders for vendor — finds all orders that contain this vendor's products
exports.getVendorOrders = async (req, res) => {
  try {
    // Step 1: find the vendor profile for this logged-in user
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return res.status(404).json({ msg: 'Vendor profile not found. Register your shop first.' });

    // Step 2: try fetching by vendor field first (fast path)
    let orders = await Order.find({ vendor: vendor._id })
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name images price category')
      .sort({ createdAt: -1 });

    // Step 3: if empty, fallback — find by product ownership
    // (handles orders placed before vendor field was saved properly)
    if (orders.length === 0) {
      const myProductIds = await Product.find({ vendor: vendor._id }).distinct('_id');
      if (myProductIds.length > 0) {
        orders = await Order.find({ 'items.product': { $in: myProductIds } })
          .populate('buyer', 'name email phone')
          .populate('items.product', 'name images price category')
          .sort({ createdAt: -1 });
      }
    }

    res.json(orders);
  } catch (err) {
    console.error('GET VENDOR ORDERS ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    // Verify this vendor owns this order
    const vendor = await Vendor.findOne({ user: req.user.id });
    if (vendor) {
      const myProductIds = await Product.find({ vendor: vendor._id }).distinct('_id');
      const isVendorOrder = order.vendor?.toString() === vendor._id.toString()
        || order.items.some(i => i.product && myProductIds.map(String).includes(String(i.product)));
      if (!isVendorOrder && order.buyer?.toString() !== req.user.id) {
        return res.status(403).json({ msg: 'Not authorized to update this order' });
      }
    }

    order.status = status;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status, timestamp: new Date(), note: note || '' });
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Cancel order — only buyer, only if pending
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });

    if (order.buyer.toString() !== req.user.id.toString()) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ msg: `Cannot cancel — order is already ${order.status}` });
    }

    order.status = 'cancelled';
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: 'Cancelled by buyer' });
    await order.save();

    res.json({ msg: 'Order cancelled successfully', order });
  } catch (err) {
    console.error('CANCEL ORDER ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};