const Payment = require('../models/Payment');
const Rental = require('../models/Rental');

// @desc    Get all payments (Admin) or user payments (Customer)
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    if (req.user.role === 'Admin') {
      const payments = await Payment.find({}).populate({
        path: 'rentalId',
        populate: { path: 'userId', select: 'name email' }
      });
      res.json(payments);
    } else {
      // Find rentals for this user, then pull payments
      const rentals = await Rental.find({ userId: req.user._id });
      const rentalIds = rentals.map(r => r._id);
      
      const payments = await Payment.find({ rentalId: { $in: rentalIds } }).populate('rentalId');
      res.json(payments);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a payment
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res) => {
  const { rentalId, amount, paymentMode, status } = req.body;

  try {
    const rental = await Rental.findById(rentalId);

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (req.user.role !== 'Admin' && rental.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized for this rental payment' });
    }

    const payment = new Payment({
      rentalId,
      amount,
      paymentMode,
      status: status || 'Completed'
    });

    const createdPayment = await payment.save();
    res.status(201).json(createdPayment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getPayments,
  createPayment
};
