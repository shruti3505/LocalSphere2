const GroupBuy = require('../models/GroupBuy');

exports.createGroupBuy = async (req, res) => {
  try {
    const { product, vendor, minUsers, discountPercent, hoursValid } = req.body;
    const expiresAt = new Date(Date.now() + (hoursValid || 24) * 3600000);
    const group = new GroupBuy({ product, vendor, minUsers, discountPercent, expiresAt });
    await group.save();
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.joinGroupBuy = async (req, res) => {
  try {
    const group = await GroupBuy.findById(req.params.id);
    if (!group || group.status !== 'open')
      return res.status(400).json({ msg: 'Group buy not available' });
    if (new Date() > group.expiresAt)
      return res.status(400).json({ msg: 'Group buy expired' });
    if (group.participants.includes(req.user.id))
      return res.status(400).json({ msg: 'Already joined' });

    group.participants.push(req.user.id);
    if (group.participants.length >= group.minUsers) group.status = 'successful';
    await group.save();
    res.json({ group, unlocked: group.status === 'successful' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getGroupBuys = async (req, res) => {
  try {
    const groups = await GroupBuy.find({ status: 'open' }).populate('product vendor');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};