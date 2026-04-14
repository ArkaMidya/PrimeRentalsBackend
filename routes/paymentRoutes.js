const express = require('express');
const router = express.Router();
const { getPayments, createPayment, createRazorpayOrder, verifyRazorpayPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getPayments)
  .post(protect, createPayment);

router.post('/razorpay-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyRazorpayPayment);

module.exports = router;
