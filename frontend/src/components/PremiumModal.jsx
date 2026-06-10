import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PremiumModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    const res = await loadRazorpay();

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // 1. Create Order on Backend
      const { data: order } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/payment/order`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Open Razorpay Checkout
      const options = {
        key: 'rzp_test_SxRg6NOV08lm3h', // Used test key provided by user
        amount: order.amount,
        currency: order.currency,
        name: 'CloudPro',
        description: 'Premium Subscription',
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            const token = localStorage.getItem('token');
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/payment/verify`,
              {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.isPremium) {
              alert('Payment Successful! You are now a Premium user.');
              setUser({ ...user, isPremium: true });
              onClose();
            }
          } catch (err) {
            alert('Payment verification failed.');
            console.error(err);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
        },
        theme: {
          color: '#f97316', // Orange matching design
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Error in payment flow:', error);
      alert('Could not initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/80 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative w-full max-w-[450px] transform rounded-3xl bg-gradient-to-b from-[#212635] to-[#151722] p-6 sm:p-8 text-left align-middle shadow-2xl border border-white/5 overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-orange-500/20 blur-[80px] pointer-events-none rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-64 h-32 bg-blue-500/10 blur-[80px] pointer-events-none rounded-full"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Crown Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 shadow-inner border border-white/10 mb-6">
          <span className="text-2xl drop-shadow-md">👑</span>
        </div>

        {/* Header */}
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500 mb-2 drop-shadow-sm">
            CloudPro Premium
          </h2>
          <p className="text-gray-400 text-sm">
            Unlock massive storage and high performance features
          </p>
        </div>

        {/* Pricing Card */}
        <div className="rounded-2xl bg-[#1c2233] border border-[#2a3248] p-6 mb-6 shadow-inner relative z-10">
          <div className="flex items-center justify-between mb-4 border-b border-[#2a3248] pb-4">
            <span className="text-lg font-bold text-white">Premium Tier</span>
            <div className="text-right">
              <span className="text-2xl font-black text-yellow-400">₹100</span>
              <span className="text-gray-400 text-sm font-medium">/mo</span>
            </div>
          </div>

          <ul className="space-y-4 text-sm text-gray-200">
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 text-orange-500 flex-shrink-0" size={18} strokeWidth={3} />
              <span><strong className="text-white">100 GB</strong> High-speed Cloud Storage</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 text-orange-500 flex-shrink-0" size={18} strokeWidth={3} />
              <span><strong className="text-white">Uncapped</strong> download & upload speeds</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 text-orange-500 flex-shrink-0" size={18} strokeWidth={3} />
              <span><strong className="text-white">True AI</strong> semantic categorization</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="mt-0.5 text-orange-500 flex-shrink-0" size={18} strokeWidth={3} />
              <span><strong className="text-white">Priority 24/7</strong> dedicated customer support</span>
            </li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 font-bold text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] transition-all active:scale-[0.98] relative z-10 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Buy Premium Subscription'}
        </button>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-4 relative z-10">
          Cancel anytime. 7-day money-back guarantee.
        </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PremiumModal;
