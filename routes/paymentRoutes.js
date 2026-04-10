const express = require('express');
const router = express.Router();
const { getPayments, createPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getPayments)
  .post(protect, createPayment);

module.exports = router;
