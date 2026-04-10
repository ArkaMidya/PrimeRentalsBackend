const express = require('express');
const router = express.Router();
const { getRentals, getRentalById, createRental, updateRental } = require('../controllers/rentalController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, getRentals)
  .post(protect, createRental);

router.route('/:id')
  .get(protect, getRentalById)
  .put(protect, admin, updateRental);

module.exports = router;
