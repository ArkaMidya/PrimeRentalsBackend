const express = require('express');
const router = express.Router();
const { getRentals, getRentalById, getRentalByBookingId, createRental, updateRental, cancelBooking, processRefund, cancelPendingRental } = require('../controllers/rentalController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, getRentals)
  .post(protect, createRental);

router.post('/cancel-pending/:id', protect, cancelPendingRental);

router.post('/cancel-booking/:bookingId', protect, cancelBooking);
router.get('/booking/:bookingId', protect, admin, getRentalByBookingId);
router.post('/refund/:bookingId', protect, admin, processRefund);

router.route('/:id')
  .get(protect, getRentalById)
  .put(protect, admin, updateRental);

module.exports = router;
