const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

exports.createOrder = async (req, res) => {
  try {
    const options = {
      amount: 100 * 100, // ₹100 in paise
      currency: "INR",
      receipt: `receipt_order_${req.user._id}`,
    };
    
    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: "Error creating order" });
    }
    
    res.json(order);
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ message: "Error creating order", error });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
      .update(body.toString())
      .digest('hex');
      
    const isAuthentic = expectedSignature === razorpaySignature;
    
    if (isAuthentic) {
      // Update user in DB
      await User.findByIdAndUpdate(req.user._id, {
        isPremium: true,
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId,
      });
      
      res.json({ message: "Payment verified successfully", isPremium: true });
    } else {
      res.status(400).json({ message: "Invalid Signature" });
    }
  } catch (error) {
    console.error("Razorpay Verify Payment Error:", error);
    res.status(500).json({ message: "Error verifying payment", error });
  }
};
