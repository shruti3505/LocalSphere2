const Product = require('../models/Product');

exports.negotiate = async (req, res) => {
  try {
    const { productId, offeredPrice } = req.body;
    const product = await Product.findById(productId);

    if (!product || !product.negotiable)
      return res.status(400).json({ msg: 'Product not negotiable' });

    const minAllowed = product.price - (product.price * product.discountMax / 100);
    // const _maxAllowed = product.price - (product.price * product.discountMin / 100);

    if (offeredPrice >= minAllowed && offeredPrice <= product.price) {
      return res.json({
        status: 'accepted',
        finalPrice: offeredPrice,
        msg: `Deal accepted at ₹${offeredPrice}!`
      });
    } else if (offeredPrice < minAllowed) {
      return res.json({
        status: 'counter',
        finalPrice: minAllowed,
        msg: `Best price offered: ₹${minAllowed.toFixed(2)}`
      });
    } else {
      return res.json({
        status: 'rejected',
        msg: 'Offer too high. Just buy at listed price.'
      });
    }
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};