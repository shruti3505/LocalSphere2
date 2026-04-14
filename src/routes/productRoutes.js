const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addProduct,
  getProducts,
  getMyProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// ✅ /my MUST be before /:id — otherwise Express reads "my" as an :id param
router.get('/my', auth, getMyProducts);

router.post('/', auth, addProduct);
router.get('/', getProducts);
router.put('/:id', auth, updateProduct);
router.delete('/:id', auth, deleteProduct);

module.exports = router;