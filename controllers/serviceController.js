const Service = require('../models/Service');
const Car = require('../models/Car');

// @desc    Get all services
// @route   GET /api/services
// @access  Private/Admin
const getServices = async (req, res) => {
  try {
    const services = await Service.find({}).populate('carId');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private/Admin
const createService = async (req, res) => {
  const { carId, serviceDate, description, cost, status } = req.body;

  try {
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const service = new Service({
      carId,
      serviceDate,
      description,
      cost,
      status
    });

    const createdService = await service.save();

    // Optionally set car status to Servicing
    if (status !== 'Completed') {
      car.status = 'Servicing';
      await car.save();
    }

    res.status(201).json(createdService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private/Admin
const updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (service) {
      Object.assign(service, req.body);
      const updatedService = await service.save();

      // If service completed, mark car Available
      if (req.body.status === 'Completed') {
        const car = await Car.findById(service.carId);
        if (car) {
          car.status = 'Available';
          await car.save();
        }
      }

      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getServices,
  createService,
  updateService
};
