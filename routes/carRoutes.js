const express = require('express');
const router = express.Router();
const { 
  getCars, getCarById, createCar, updateCar, deleteCar,
  addServiceRecord, updateServiceRecord, deleteServiceRecord
} = require('../controllers/carController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(getCars)
  .post(protect, admin, createCar);

router.route('/:id')
  .get(getCarById)
  .put(protect, admin, updateCar)
  .delete(protect, admin, deleteCar);

router.route('/:id/services')
  .post(protect, admin, addServiceRecord);

router.route('/:id/services/:serviceId')
  .put(protect, admin, updateServiceRecord)
  .delete(protect, admin, deleteServiceRecord);

module.exports = router;
