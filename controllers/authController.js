const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Send OTP for registration
// @route   POST /api/auth/send-register-otp
// @access  Public
const sendRegisterOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Clear any previous OTPs for this email to avoid duplicates
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    await sendEmail({
      email,
      subject: 'Car Rental - Registration OTP',
      message: `Your OTP for registration is ${otp}. It is valid for 5 minutes.`,
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user after OTP validation
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role, otp } = req.body;

  try {
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Customer',
    });

    if (user) {
      // Clean up OTP after use
      await OTP.deleteMany({ email });
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send OTP for forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const sendForgotPasswordOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (!userExists) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    await sendEmail({
      email,
      subject: 'Car Rental - Reset Password OTP',
      message: `Your OTP to reset your password is ${otp}. It is valid for 5 minutes.`,
    });

    res.status(200).json({ message: 'Password reset OTP sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  
  try {
    if (!otp) return res.status(400).json({ message: 'OTP is required' });

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // Mongoose 'pre' save hook will hash it
    await user.save();

    await OTP.deleteMany({ email });

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendRegisterOtp,
  registerUser,
  authUser,
  sendForgotPasswordOtp,
  resetPassword,
};
