const Payment = require('../models/Payment');
const Rental = require('../models/Rental');
const Car = require('../models/Car');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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
      const rentals = await Rental.find({ userId: req.user._id });
      const rentalIds = rentals.map(r => r._id);
      
      const payments = await Payment.find({ rentalId: { $in: rentalIds } }).populate('rentalId');
      res.json(payments);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a payment (Manual/Admin)
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

// @desc    Create Razorpay Order
// @route   POST /api/payments/razorpay-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  const { rentalId } = req.body;

  try {
    const rental = await Rental.findById(rentalId);
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    const options = {
      amount: Math.round(rental.totalCost * 100), // Amount in paise
      currency: "INR",
      receipt: rental.bookingId,
    };

    const order = await razorpay.orders.create(options);

    // Update rental with order ID
    rental.razorpayOrderId = order.id;
    await rental.save();

    res.status(201).json(order);
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    res.status(500).json({ message: 'Error creating Razorpay order' });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, rentalId } = req.body;

  try {
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      // Mark rental as failed
      await Rental.findByIdAndUpdate(rentalId, { 
        rentalStatus: 'Failed',
        paymentStatus: 'Failed'
      });
      return res.status(400).json({ message: "Transaction is not legitimate!" });
    }

    // Update rental status
    const rental = await Rental.findById(rentalId).populate('carId');
    
    // Fetch payment details from Razorpay to get the actual method used
    let paymentMethod = 'Online';
    try {
      const rzpPayment = await razorpay.payments.fetch(razorpay_payment_id);
      const methodMap = {
        'card': 'Credit / Debit Card',
        'netbanking': 'Net Banking',
        'wallet': 'Wallet',
        'upi': 'UPI',
        'emi': 'EMI',
        'paylater': 'Pay Later'
      };
      paymentMethod = methodMap[rzpPayment.method] || rzpPayment.method || 'Online';
    } catch (fetchError) {
      console.error('Error fetching Razorpay payment details:', fetchError);
    }

    rental.rentalStatus = 'Confirmed';
    rental.paymentStatus = 'Paid';
    rental.paymentMethod = paymentMethod;
    rental.razorpayPaymentId = razorpay_payment_id;
    rental.razorpaySignature = razorpay_signature;
    await rental.save();

    // Create a payment record
    const payment = new Payment({
      rentalId,
      amount: rental.totalCost,
      paymentMode: paymentMethod, // Store specific method instead of generic 'Online'
      status: 'Completed'
    });
    await payment.save();

    // Send confirmation email
    try {
      const user = await User.findById(rental.userId);
      const car = await Car.findById(rental.carId);
      if (user && car) {
        const emailMessage = `Dear ${user.name},

Thank you for choosing our car rental service!

🎉 Your booking has been successfully confirmed.

📌 Order Details:
Order ID: ${rental.bookingId}
Booking Date: ${new Date().toLocaleDateString()}
Payment Status: Paid (${paymentMethod})
Contact Phone: ${rental.phone || 'N/A'}

🚗 Car Details:
Car: ${car.make} ${car.model}
Type: ${car.engineDetails?.type || 'N/A'}

📅 Rental Details:
Pickup Point: ${rental.sourceLocation}
Drop-off: ${new Date(rental.checkInDate).toLocaleDateString()} at 10:00 AM (Estimated)
Routing: ${rental.sourceLocation} to ${rental.destinationLocation}

💳 Payment Summary:
Total Amount Paid: ₹${rental.totalCost}
Razorpay Payment ID: ${razorpay_payment_id}
`;
        await sendEmail({
          email: user.email,
          subject: `Booking Confirmed – Order #${rental.bookingId}`,
          message: emailMessage,
        });
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError.message);
    }

    res.json({ message: "Payment verified successfully", rental });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: 'Error verifying payment' });
  }
};

module.exports = {
  getPayments,
  createPayment,
  createRazorpayOrder,
  verifyRazorpayPayment
};
