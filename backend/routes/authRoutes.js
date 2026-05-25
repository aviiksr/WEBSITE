const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOtp, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.get('/profile', protect, getProfile);

module.exports = router;
