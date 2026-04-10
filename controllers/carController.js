const Car = require('../models/Car');

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
const getCars = async (req, res) => {
  try {
    const cars = await Car.find({});
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
      if (car.status === 'Rented') {
        return res.status(403).json({ message: 'Cannot update a car that is currently rented.' });
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
      if (car.status === 'Rented') {
        return res.status(403).json({ message: 'Cannot delete a car that is currently rented.' });
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

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  addServiceRecord,
  updateServiceRecord,
  deleteServiceRecord
};
