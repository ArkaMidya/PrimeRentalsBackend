const express = require('express');
const router = express.Router();
const { getServices, createService, updateService } = require('../controllers/serviceController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(protect, admin, getServices)
  .post(protect, admin, createService);

router.route('/:id')
  .put(protect, admin, updateService);

module.exports = router;
