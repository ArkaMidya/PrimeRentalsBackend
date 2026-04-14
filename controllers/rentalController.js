const Rental = require('../models/Rental');
const Car = require('../models/Car');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Get all rentals (Admin) or user rentals (Customer)
// @route   GET /api/rentals
// @access  Private
const getRentals = async (req, res) => {
  try {
    const query = req.user.role === 'Admin' ? {} : { userId: req.user._id };
    const rentals = await Rental.find(query).populate('carId').populate('userId', 'name email');
    res.json(rentals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rental by ID
// @route   GET /api/rentals/:id
// @access  Private
const getRentalById = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id).populate('carId').populate('userId', 'name email');
    
    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }
    
    if (req.user.role !== 'Admin' && rental.userId._id.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this rental' });
    }
    
    res.json(rental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new rental
// @route   POST /api/rentals
// @access  Private
const createRental = async (req, res) => {
  const { carId, checkOutDate, checkInDate, sourceLocation, destinationLocation, totalCost, paymentMethod, pickupTime, phone } = req.body;

  try {
    const car = await Car.findById(carId);

    if (!car || car.status === 'Servicing') {
      return res.status(400).json({ message: 'Car is under servicing and not available for rent' });
    }

    const requestedCheckOut = new Date(checkOutDate);
    if (pickupTime) {
      const [hours, minutes] = pickupTime.split(':').map(Number);
      requestedCheckOut.setHours(hours, minutes, 0, 0);
    }
    const requestedCheckIn = new Date(checkInDate);
    // For return date, we can set it to the end of the day or just keep midnight
    // since we only care about day-level return for now.
    
    const now = new Date();
    // Allow a 10-minute grace period (buffer) to account for network latency
    const gracePeriod = 10 * 60 * 1000;

    if (requestedCheckOut < (now - gracePeriod)) {
      return res.status(400).json({ message: 'Check-out date/time cannot be in the past.' });
    }

    if (requestedCheckIn < requestedCheckOut) {
      return res.status(400).json({ message: 'Check-in date/time must be after or equal to the check-out date/time.' });
    }

    const activeRentals = await Rental.find({ carId, rentalStatus: 'Active' });
    const hasOverlap = activeRentals.some(rental => {
      const existingCheckOut = new Date(rental.checkOutDate);
      const existingCheckIn = new Date(rental.checkInDate);
      return requestedCheckOut < existingCheckIn && requestedCheckIn > existingCheckOut;
    });

    if (hasOverlap) {
      return res.status(400).json({ message: 'Car is already booked for the requested dates.' });
    }

    // Generate a random bookingId
    const bookingId = `ORD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const rental = new Rental({
      carId,
      carName: `${car.make} ${car.model}`,
      userId: req.user._id,
      checkOutDate,
      checkInDate,
      sourceLocation,
      destinationLocation,
      totalCost,
      paymentMethod,
      pickupTime,
      pickupLocation: sourceLocation,
      phone,
      bookingId
    });

    const createdRental = await rental.save();
    
    // Increment rentalCount on the car
    car.rentalCount = (car.rentalCount || 0) + 1;
    await car.save();

    // Send confirmation email
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        const emailMessage = `Dear ${user.name},

Thank you for choosing our car rental service!

🎉 Your booking has been successfully confirmed.

📌 Order Details:
Order ID: ${bookingId}
Booking Date: ${new Date().toLocaleDateString()}
Payment Status: Paid (${paymentMethod})
Contact Phone: ${phone || 'N/A'}

🚗 Car Details:
Car: ${car.make} ${car.model}
Type: ${car.engineDetails?.type || 'N/A'}

📅 Rental Details:
Pickup Point: ${sourceLocation}
Drop-off: ${new Date(checkInDate).toLocaleDateString()} at 10:00 AM (Estimated)
Routing: ${sourceLocation} to ${destinationLocation}

💳 Payment Summary:
Total Amount Paid: ₹${totalCost}
`;
        await sendEmail({
          email: user.email,
          subject: `Booking Confirmed – Order #${bookingId}`,
          message: emailMessage,
        });
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError.message);
      // We don't want to fail the rental creation if email fails
    }

    res.status(201).json(createdRental);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update rental / Check-In
// @route   PUT /api/rentals/:id
// @access  Private/Admin
const updateRental = async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    Object.assign(rental, req.body);
    const updatedRental = await rental.save();

    // If marked completed, update mileage if provided
    if (req.body.rentalStatus === 'Completed') {
      const car = await Car.findById(rental.carId);
      if (car) {
        // Optionally update mileage if provided
        if (req.body.totalMileage) {
          car.mileage += req.body.totalMileage;
          await car.save();
        }
      }
    }

    res.json(updatedRental);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   POST /api/rentals/cancel-booking/:bookingId
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const rental = await Rental.findOne({ bookingId: req.params.bookingId });

    if (!rental) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to cancel this booking
    if (req.user.role !== 'Admin' && rental.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to cancel this booking' });
    }

    if (rental.rentalStatus !== 'Active') {
      return res.status(400).json({ message: `Cannot cancel a booking that is ${rental.rentalStatus}` });
    }

    // Combine checkOutDate and pickupTime for accuracy
    const pickupDate = new Date(rental.checkOutDate);
    if (rental.pickupTime) {
      const [hours, minutes] = rental.pickupTime.split(':').map(Number);
      pickupDate.setHours(hours, minutes, 0, 0);
    }

    const now = new Date();
    const timeDiffMs = pickupDate - now;
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    if (timeDiffHours < 0) {
      return res.status(400).json({ message: 'Cannot cancel a booking that has already passed its pickup time.' });
    }

    let refundAmount = 0;
    let status = '';
    let message = '';

    if (timeDiffHours >= 24) {
      refundAmount = Number((rental.totalCost * 0.85).toFixed(2));
      status = 'CANCELLED_WITH_REFUND';
      message = 'Booking cancelled. 85% refund applicable (15% deduction).';
    } else {
      refundAmount = 0;
      status = 'CANCELLED_NO_REFUND';
      message = 'Booking cancelled. No refund applicable as cancellation is within 24 hours of pickup.';
    }

    rental.rentalStatus = status;
    rental.refundAmount = refundAmount;
    rental.cancellationTime = now;
    await rental.save();

    res.json({
      status,
      refundAmount,
      message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get rental by Booking ID
// @route   GET /api/rentals/booking/:bookingId
// @access  Private/Admin
const getRentalByBookingId = async (req, res) => {
  try {
    const rental = await Rental.findOne({ bookingId: req.params.bookingId }).populate('carId').populate('userId', 'name email');
    
    if (!rental) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(rental);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process refund
// @route   POST /api/rentals/refund/:bookingId
// @access  Private/Admin
const processRefund = async (req, res) => {
  try {
    const rental = await Rental.findOne({ bookingId: req.params.bookingId });

    if (!rental) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (rental.rentalStatus !== 'CANCELLED_WITH_REFUND') {
      return res.status(400).json({ message: `Cannot refund a booking with status ${rental.rentalStatus}` });
    }

    rental.rentalStatus = 'Refunded';
    await rental.save();

    res.json({ message: 'Refund processed successfully', rentalStatus: 'Refunded' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRentals,
  getRentalById,
  getRentalByBookingId,
  createRental,
  updateRental,
  cancelBooking,
  processRefund
};
