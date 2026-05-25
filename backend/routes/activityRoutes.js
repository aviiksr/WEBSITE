const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Activity = require('../models/Activity');

router.get('/', protect, async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
