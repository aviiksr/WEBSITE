const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets } = require('../controllers/supportController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createTicket)
  .get(protect, getMyTickets);

module.exports = router;
