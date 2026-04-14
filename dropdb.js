const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await mongoose.connection.collection('users').drop();
  console.log('Users collection dropped');
  process.exit(0);
}).catch(err => {
  console.log('Error:', err.message);
  process.exit(1);
});