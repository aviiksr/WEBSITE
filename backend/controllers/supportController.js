const SupportTicket = require('../models/SupportTicket');
const { sendSupportTicketEmail } = require('../services/emailService');

const createTicket = async (req, res) => {
  try {
    const { name, email, type, subject, description } = req.body;
    
    if (!name || !email || !type || !subject || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const ticket = await SupportTicket.create({
      user: req.user ? req.user._id : null,
      name,
      email,
      type,
      subject,
      description
    });

    // Send confirmation email
    await sendSupportTicketEmail(ticket);

    res.status(201).json({ message: 'Support ticket submitted successfully', ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTicket, getMyTickets };
