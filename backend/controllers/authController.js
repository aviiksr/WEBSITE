const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { sendWelcomeEmail, sendOtpEmail } = require('../services/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ name, email, password });
    if (user) {
      await Activity.create({ user: user._id, actionType: 'REGISTER', description: 'Registered a new account' });
      await sendWelcomeEmail(user.email, user.name);
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        usedStorage: user.usedStorage,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      // Generate a highly secure 6-digit numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP with 5 minutes validity
      user.loginOtp = otp;
      user.loginOtpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      // Dispatch OTP email
      console.log(`\n🔑 [SECURITY OTP] GENERATED FOR ${user.email} -> [ ${otp} ]\n`);
      await sendOtpEmail(user.email, user.name, otp);

      res.status(200).json({
        otpRequired: true,
        email: user.email,
        message: 'A 6-digit verification code has been sent to your registered email address.'
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.loginOtp || user.loginOtp !== otp) {
      return res.status(401).json({ message: 'Invalid verification code' });
    }

    if (new Date() > user.loginOtpExpiresAt) {
      return res.status(401).json({ message: 'Verification code has expired' });
    }

    // Clear OTP fields upon successful verification
    user.loginOtp = undefined;
    user.loginOtpExpiresAt = undefined;
    await user.save();

    // Log the successful MFA login
    await Activity.create({ user: user._id, actionType: 'LOGIN', description: 'Logged into the system (verified via OTP)' });

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      usedStorage: user.usedStorage,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, verifyOtp, getProfile };
