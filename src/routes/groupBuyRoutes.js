const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const GroupBuy = require('../models/GroupBuy');

// ✅ Get all active group buys (open AND successful so users can see completed ones too)
router.get('/', async (req, res) => {
  try {
    const groups = await GroupBuy.find({ status: { $in: ['open', 'successful'] } })
      .populate('product')
      .populate('vendor')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    console.error('GET GROUPBUYS ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Create group buy (for real DB products)
router.post('/', auth, async (req, res) => {
  try {
    const { product, vendor, minUsers, discountPercent, hoursValid } = req.body;
    const expiresAt = new Date(Date.now() + (hoursValid || 24) * 3600000);
    const group = new GroupBuy({ product, vendor, minUsers, discountPercent, expiresAt });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    console.error('CREATE GROUPBUY ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// ✅ FIXED: Join group buy — works for both real and virtual/default deals
router.post('/join/:id', auth, async (req, res) => {
  try {
    const group = await GroupBuy.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ msg: 'Group buy not found' });
    }
    if (group.status === 'failed') {
      return res.status(400).json({ msg: 'Group buy has ended' });
    }
    if (group.status === 'successful') {
      // Already successful — still let them join to track
      return res.json({ group, unlocked: true });
    }
    if (new Date() > group.expiresAt) {
      return res.status(400).json({ msg: 'Group buy has expired' });
    }

    // ✅ FIX: compare as strings to handle both ObjectId and plain strings
    const alreadyJoined = group.participants.some(
      p => p.toString() === req.user.id.toString()
    );
    if (alreadyJoined) {
      return res.status(400).json({ msg: 'Already joined this group buy' });
    }

    group.participants.push(req.user.id);

    // Unlock if target reached
    if (group.participants.length >= group.minUsers) {
      group.status = 'successful';
    }

    await group.save();

    // Fetch populated version to return
    const populated = await GroupBuy.findById(group._id)
      .populate('product')
      .populate('vendor');

    res.json({ group: populated, unlocked: group.status === 'successful' });

  } catch (err) {
    console.error('JOIN GROUPBUY ERROR:', err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// ✅ Seed demo group buys with virtual product data (no real DB products needed)
router.post('/seed-demo', async (req, res) => {
  try {
    await GroupBuy.deleteMany({});

    const defaultDeals = [
      { name: 'Fresh Tomatoes',    price: 40,  category: 'Vegetables',  discount: 15, minUsers: 3, img: 'https://images.unsplash.com/photo-1546470427-1f7b8b1f4f5a?w=400&q=80' },
      { name: 'Organic Apples',    price: 120, category: 'Fruits',      discount: 20, minUsers: 4, img: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a?w=400&q=80' },
      { name: 'Pure Cow Milk 1L',  price: 60,  category: 'Dairy',       discount: 10, minUsers: 5, img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80' },
      { name: 'Basmati Rice 5kg',  price: 280, category: 'Food',        discount: 12, minUsers: 4, img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80' },
      { name: 'Fresh Spinach',     price: 25,  category: 'Vegetables',  discount: 18, minUsers: 3, img: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80' },
      { name: 'Banana Bunch',      price: 35,  category: 'Fruits',      discount: 10, minUsers: 5, img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80' },
      { name: 'Handmade Pottery',  price: 350, category: 'Handicrafts', discount: 25, minUsers: 3, img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80' },
      { name: 'Cotton Kurta',      price: 450, category: 'Clothing',    discount: 20, minUsers: 4, img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80' },
      { name: 'Paneer 500g',       price: 110, category: 'Dairy',       discount: 15, minUsers: 5, img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80' },
      { name: 'Mixed Dal 2kg',     price: 160, category: 'Food',        discount: 12, minUsers: 4, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80' },
      { name: 'Fresh Carrots',     price: 30,  category: 'Vegetables',  discount: 10, minUsers: 3, img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80' },
      { name: 'Wooden Toys Set',   price: 550, category: 'Handicrafts', discount: 22, minUsers: 3, img: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=400&q=80' },
    ];

    const docs = defaultDeals.map((deal, i) => ({
      productName:     deal.name,
      productPrice:    deal.price,
      productImage:    deal.img,
      productCategory: deal.category,
      vendorName:      'Local Vendor',
      minUsers:        deal.minUsers,
      discountPercent: deal.discount,
      participants:    [],
      status:          'open',
      expiresAt:       new Date(Date.now() + (20 + i) * 3600000)
    }));

    await GroupBuy.insertMany(docs);

    const all = await GroupBuy.find({ status: 'open' });
    res.json({ msg: `${all.length} group deals created!`, data: all });

  } catch (err) {
    console.error('SEED DEMO ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;