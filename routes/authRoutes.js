const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  authUser, 
  sendRegisterOtp, 
  sendForgotPasswordOtp, 
  resetPassword 
} = require('../controllers/authController');

router.post('/send-register-otp', sendRegisterOtp);
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/forgot-password', sendForgotPasswordOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
