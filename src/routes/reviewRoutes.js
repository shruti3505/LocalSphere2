const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Vendor = require('../models/Vendor');

router.post('/', auth, async (req, res) => {
  try {
    const { vendor, rating, comment } = req.body;
    const existing = await Review.findOne({ vendor, buyer: req.user.id });
    if (existing) return res.status(400).json({ msg: 'Already reviewed this vendor' });
    const review = new Review({ vendor, buyer: req.user.id, rating, comment });
    await review.save();
    const reviews = await Review.find({ vendor });
    const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    await Vendor.findByIdAndUpdate(vendor, { trustScore: parseFloat(avg.toFixed(1)) });
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.get('/:vendorId', async (req, res) => {
  try {
    const reviews = await Review.find({ vendor: req.params.vendorId })
      .populate('buyer', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;