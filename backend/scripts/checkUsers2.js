// checkUsers2.js - script to list users in MongoDB without unsupported options
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to DB');
    const users = await User.find();
    console.log('📊 User count:', users.length);
    console.log('Users:', users.map(u => ({ email: u.email, name: u.name })));
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();
