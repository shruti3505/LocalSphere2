const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

// ✅ ADD PRODUCT
exports.addProduct = async (req, res) => {
  try {
    // ✅ FIX: Log exactly what we receive so you can debug
    console.log('ADD PRODUCT - req.user:', req.user);
    console.log('ADD PRODUCT - req.body keys:', Object.keys(req.body));

    if (!req.user || !req.user.id) {
      console.log('ADD PRODUCT - No user id in token');
      return res.status(401).json({ msg: 'Unauthorized - no user id' });
    }

    // ✅ FIX: Use string directly, no ObjectId wrapping
    const vendor = await Vendor.findOne({ user: req.user.id });
    console.log('ADD PRODUCT - vendor found:', vendor ? vendor._id : 'NULL');

    if (!vendor) {
      return res.status(403).json({ msg: 'Register as vendor first' });
    }

    const product = new Product({
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price),
      stock: parseInt(req.body.stock),
      category: req.body.category || 'Other',
      images: req.body.images || [],
      negotiable: req.body.negotiable || false,
      discountMin: req.body.discountMin || 0,
      discountMax: req.body.discountMax || 0,
      sustainabilityScore: req.body.sustainabilityScore || 0,
      vendor: vendor._id,
      isActive: true
    });

    await product.save();
    console.log('ADD PRODUCT - saved:', product._id);
    res.status(201).json(product);

  } catch (err) {
    console.error('ADD PRODUCT ERROR:', err.message);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
};

// ✅ GET ALL PRODUCTS (public)
exports.getProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search, sort } = req.query;
    let query = { isActive: true };

    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) query.name = { $regex: search, $options: 'i' };

    let sortObj = {};
    if (sort === 'price_asc') sortObj.price = 1;
    if (sort === 'price_desc') sortObj.price = -1;
    if (sort === 'sustainability') sortObj.sustainabilityScore = -1;

    const products = await Product.find(query).sort(sortObj).populate('vendor');
    res.json(products);

  } catch (err) {
    console.error('GET PRODUCTS ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ GET THIS VENDOR'S PRODUCTS ONLY (dashboard)
exports.getMyProducts = async (req, res) => {
  try {
    console.log('GET MY PRODUCTS - req.user:', req.user);

    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ user: req.user.id });
    console.log('GET MY PRODUCTS - vendor:', vendor ? vendor._id : 'NULL');

    if (!vendor) {
      return res.json([]); // no vendor yet, return empty list
    }

    const products = await Product.find({
      vendor: vendor._id,
      isActive: true
    }).sort({ createdAt: -1 });

    console.log('GET MY PRODUCTS - count:', products.length);
    res.json(products);

  } catch (err) {
    console.error('GET MY PRODUCTS ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return res.status(403).json({ msg: 'Vendor not found' });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: vendor._id },
      { $set: req.body },
      { new: true }
    );

    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json(product);

  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ✅ DELETE PRODUCT (soft delete)
exports.deleteProduct = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const vendor = await Vendor.findOne({ user: req.user.id });
    if (!vendor) return res.status(403).json({ msg: 'Vendor not found' });

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: vendor._id },
      { isActive: false },
      { new: true }
    );

    if (!product) return res.status(404).json({ msg: 'Product not found' });
    res.json({ msg: 'Product removed' });

  } catch (err) {
    console.error('DELETE PRODUCT ERROR:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};