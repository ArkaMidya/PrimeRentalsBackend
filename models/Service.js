const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  serviceDate: { type: Date, required: true },
  description: { type: String, required: true },
  cost: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed'],
    default: 'Scheduled'
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
