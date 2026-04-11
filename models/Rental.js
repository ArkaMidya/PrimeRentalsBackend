const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  checkOutDate: { type: Date, required: true },
  checkInDate: { type: Date, required: true },
  sourceLocation: { type: String, required: true },
  destinationLocation: { type: String, required: true },
  totalCost: { type: Number },
  actualReturnDate: { type: Date },
  rentalStatus: {
    type: String,
    enum: ['Active', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  totalMileage: { type: Number, default: 0 },
  carName: { type: String },
  paymentMethod: { type: String },
  pickupTime: { type: String },
  bookingId: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Rental', rentalSchema);
