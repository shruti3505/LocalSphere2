const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI is not defined in .env file!');
      process.exit(1);
    }
    console.log('🔗 Connecting to MongoDB:', uri);
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected to:', mongoose.connection.db.databaseName);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;