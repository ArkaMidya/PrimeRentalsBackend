const Rental = require('../models/Rental');
const Car = require('../models/Car');

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
  const { carId, checkOutDate, checkInDate, sourceLocation, destinationLocation, totalCost, paymentMethod, pickupTime } = req.body;

  try {
    const car = await Car.findById(carId);

    if (!car || car.status !== 'Available') {
      return res.status(400).json({ message: 'Car is not available for rent' });
    }

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
      pickupTime
    });

    const createdRental = await rental.save();
    
    // Update car status
    car.status = 'Rented';
    await car.save();

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

    // If marked completed, update car status to Available
    if (req.body.rentalStatus === 'Completed') {
      const car = await Car.findById(rental.carId);
      if (car) {
        car.status = 'Available';
        // Optionally update mileage if provided
        if (req.body.totalMileage) {
          car.mileage += req.body.totalMileage;
        }
        await car.save();
      }
    }

    res.json(updatedRental);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getRentals,
  getRentalById,
  createRental,
  updateRental
};
