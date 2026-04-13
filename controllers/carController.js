const Car = require('../models/Car');
const Rental = require('../models/Rental');

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
const getCars = async (req, res) => {
  const { search, mileageRange, maintenance, usage, rentRange } = req.query;
  let conditions = [];

  // Search Filter (Make/Model Keyword Search)
  if (search) {
    conditions.push({
      $or: [
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ]
    });
  }

  // Mileage Range Filter
  if (mileageRange) {
    if (mileageRange === 'high') conditions.push({ mileage: { $gte: 24 } });
    else if (mileageRange === 'medium') conditions.push({ mileage: { $gte: 18, $lt: 24 } });
    else if (mileageRange === 'low') conditions.push({ mileage: { $lt: 18 } });
    else if (mileageRange === 'na') conditions.push({ mileage: { $in: [0, null] } });
  }

  // Maintenance Status Filter
  if (maintenance) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    if (maintenance === 'recent') {
      // Car is recent if root date is recent OR any history entry is recent
      conditions.push({
        $or: [
          { lastServiceDate: { $gte: oneMonthAgo } },
          { "serviceHistory.serviceDate": { $gte: oneMonthAgo } }
        ]
      });
    } else if (maintenance === 'old') {
      // Car is old if root date is old/missing AND there are no recent history entries
      conditions.push({
        $or: [
          { lastServiceDate: { $lt: oneMonthAgo } },
          { lastServiceDate: { $exists: false } }
        ],
        "serviceHistory.serviceDate": { $not: { $gte: oneMonthAgo } }
      });
    }
  }

  // Usage Frequency / Frequency Filter
  if (usage) {
    if (usage === 'low') conditions.push({ rentalCount: { $gte: 0, $lte: 5 } });
    else if (usage === 'medium') conditions.push({ rentalCount: { $gt: 5, $lte: 15 } });
    else if (usage === 'high') conditions.push({ rentalCount: { $gt: 15 } });
  }

  // Rent Range Filter
  if (rentRange) {
    if (rentRange === 'low') conditions.push({ rentPerDay: { $lt: 2000 } });
    else if (rentRange === 'medium') conditions.push({ rentPerDay: { $gte: 2000, $lte: 3000 } });
    else if (rentRange === 'high') conditions.push({ rentPerDay: { $gt: 3000 } });
  }

  const query = conditions.length > 0 ? { $and: conditions } : {};

  try {
    const cars = await Car.find(query);
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (car) {
      res.json(car);
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a car
// @route   POST /api/cars
// @access  Private/Admin
const createCar = async (req, res) => {
  try {
    const car = new Car(req.body);
    const createdCar = await car.save();
    res.status(201).json(createdCar);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a car
// @route   PUT /api/cars/:id
// @access  Private/Admin
const updateCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (car) {
      const activeRentals = await Rental.find({ carId: car._id, rentalStatus: 'Active' });
      if (activeRentals.length > 0) {
        return res.status(403).json({ message: 'Cannot update a car that has active rentals.' });
      }
      Object.assign(car, req.body);
      const updatedCar = await car.save();
      res.json(updatedCar);
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
const deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);

    if (car) {
      const activeRentals = await Rental.find({ carId: car._id, rentalStatus: 'Active' });
      if (activeRentals.length > 0) {
        return res.status(403).json({ message: 'Cannot delete a car that has active rentals.' });
      }
      await car.deleteOne();
      res.json({ message: 'Car removed' });
    } else {
      res.status(404).json({ message: 'Car not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a service record
// @route   POST /api/cars/:id/services
// @access  Private/Admin
const addServiceRecord = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    car.serviceHistory.push(req.body);
    car.lastServiceDate = req.body.serviceDate;
    await car.save();
    res.status(201).json(car.serviceHistory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a service record
// @route   PUT /api/cars/:id/services/:serviceId
// @access  Private/Admin
const updateServiceRecord = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const serviceRecord = car.serviceHistory.id(req.params.serviceId);
    if (!serviceRecord) return res.status(404).json({ message: 'Service record not found' });

    Object.assign(serviceRecord, req.body);
    await car.save();
    res.json(car.serviceHistory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a service record
// @route   DELETE /api/cars/:id/services/:serviceId
// @access  Private/Admin
const deleteServiceRecord = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    car.serviceHistory.pull(req.params.serviceId);
    await car.save();
    res.json(car.serviceHistory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get booked dates for a car
// @route   GET /api/cars/:id/booked-dates
// @access  Public
const getCarBookedDates = async (req, res) => {
  try {
    const activeRentals = await Rental.find({
      carId: req.params.id,
      rentalStatus: 'Active'
    });

    const bookedDates = activeRentals.map(rental => ({
      checkOutDate: rental.checkOutDate,
      checkInDate: rental.checkInDate
    }));

    res.json(bookedDates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all booked dates for all cars
// @route   GET /api/cars/booked-dates/all
// @access  Public
const getAllCarsBookedDates = async (req, res) => {
  try {
    const activeRentals = await Rental.find({ rentalStatus: 'Active' });
    const bookedDatesByCar = {};
    activeRentals.forEach(rental => {
      if (!bookedDatesByCar[rental.carId]) {
        bookedDatesByCar[rental.carId] = [];
      }
      bookedDatesByCar[rental.carId].push({
        checkOutDate: rental.checkOutDate,
        checkInDate: rental.checkInDate
      });
    });
    res.json(bookedDatesByCar);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  addServiceRecord,
  updateServiceRecord,
  deleteServiceRecord,
  getCarBookedDates,
  getAllCarsBookedDates
};
// removing duplicate block
