const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { placeOrder, getMyOrders, getVendorOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');

router.post('/', auth, placeOrder);
router.get('/my', auth, getMyOrders);
router.get('/vendor', auth, getVendorOrders);       // ✅ NEW: vendor sees their orders
router.put('/:id/status', auth, updateOrderStatus);
router.put('/:id/cancel', auth, cancelOrder);

module.exports = router;