const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { negotiate } = require('../controllers/negotiateController');

router.post('/', auth, negotiate);

module.exports = router;