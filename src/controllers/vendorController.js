const Vendor = require('../models/Vendor');

exports.registerVendor = async (req, res) => {
  try {
    const { shopName, description, category, coordinates, address, whatsapp } = req.body;
    
    // Check if vendor already exists for this user
    let vendor = await Vendor.findOne({ user: req.user.id });
    
    if (vendor) {
      // UPDATE existing vendor instead of creating new
      vendor.shopName = shopName || vendor.shopName;
      vendor.description = description || vendor.description;
      vendor.category = category || vendor.category;
      vendor.whatsapp = whatsapp || vendor.whatsapp;
      if (coordinates) vendor.location = { type: 'Point', coordinates, address };
      await vendor.save();
      return res.status(200).json(vendor);
    }

    // Create new vendor
    vendor = new Vendor({
      user: req.user.id,
      shopName, description, category, whatsapp,
      location: { type: 'Point', coordinates: coordinates || [0, 0], address }
    });
    await vendor.save();
    res.status(201).json(vendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getNearbyVendors = async (req, res) => {
  try {
    const { lng, lat, radius = 5000 } = req.query;
    const vendors = await Vendor.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius)
        }
      },
      isActive: true
    }).populate('user', 'name email');
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findOneAndUpdate(
      { user: req.user.id },
      { $set: req.body },
      { new: true }
    );
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('user', 'name email');
    if (!vendor) return res.status(404).json({ msg: 'Vendor not found' });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};