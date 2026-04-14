const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  rentalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental', required: true },
  amount: { type: Number, required: true },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Online', 'Net Banking', 'UPI', 'Wallet', 'EMI', 'Pay Later'],
    required: true
  },
  transactionDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
