const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { registerVendor, getNearbyVendors, updateVendor, getVendorProfile } = require('../controllers/vendorController');

router.post('/register', auth, registerVendor);
router.get('/nearby', getNearbyVendors);
router.put('/update', auth, updateVendor);
router.get('/:id', getVendorProfile);

module.exports = router;
