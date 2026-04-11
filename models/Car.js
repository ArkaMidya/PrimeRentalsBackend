const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  description: { type: String },
  mileage: { type: Number, default: 0 },
  engineDetails: {
    type: { type: String },
    capacity: { type: String },
    hp: { type: Number }
  },
  partsDetails: [{
    partName: String,
    condition: String
  }],
  servicingDetails: { type: String },
  insurance: {
    registrationNumber: { type: String },
    expirationDate: { type: Date },
    provider: { type: String }
  },
  status: {
    type: String,
    enum: ['Available', 'Rented', 'Servicing'],
    default: 'Available'
  },
  serviceHistory: [{
    serviceDate: { type: Date, required: true },
    description: { type: String, required: true },
    cost: { type: Number, required: true },
    serviceCenter: { type: String, required: true }
  }],
  rentalCount: { type: Number, default: 0 },
  lastServiceDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
