// ✅ MUST be first line — loads .env before anything else
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Debug: confirm env vars are loaded
console.log('🔍 ENV CHECK:');
console.log('   PORT:', process.env.PORT);
console.log('   MONGO_URI:', process.env.MONGO_URI);
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? '✅ loaded' : '❌ MISSING');

connectDB();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/groupbuy', require('./routes/groupBuyRoutes'));
app.use('/api/negotiate', require('./routes/negotiateRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

app.get('/', (req, res) => res.send('LocalSphere API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));