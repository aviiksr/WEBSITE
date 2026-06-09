// checkUsers.js - script to list users in MongoDB
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');
    const users = await User.find();
    console.log('User count:', users.length);
    console.log(users.map(u => ({ email: u.email, name: u.name })));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
})();
