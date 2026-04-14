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
    enum: ['Active', 'Completed', 'Cancelled', 'CANCELLED_WITH_REFUND', 'CANCELLED_NO_REFUND', 'Refunded'],
    default: 'Active'
  },
  totalMileage: { type: Number, default: 0 },
  carName: { type: String },
  paymentMethod: { type: String },
  pickupTime: { type: String },
  pickupLocation: { type: String },
  phone: { type: String },
  bookingId: { type: String, unique: true },
  refundAmount: { type: Number, default: 0 },
  cancellationTime: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Rental', rentalSchema);
