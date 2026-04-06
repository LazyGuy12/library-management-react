// models/fine.model.js
const mongoose = require('mongoose');

const FineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
    // Có thể null nếu phạt không liên quan phiếu mượn (VD: phạt hỏng sách, mất sách)
  },
  fineType: {
    type: String,
    enum: ['LATE_FEE', 'DAMAGE', 'LOST'],
    default: 'LATE_FEE'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true
    // VD: "Trả sách quá hạn 5 ngày", "Sách bị rách", "Mất sách"
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID'],
    default: 'PENDING'
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  paidDate: {
    type: Date
    // Ngày thanh toán (null nếu chưa thanh toán)
  },
  confirmedBy: {
    type: String
    // Username của admin xác nhận thanh toán
  },
  confirmedAt: {
    type: Date
    // Thời gian xác nhận thanh toán
  }
}, { timestamps: true });

module.exports = mongoose.model('Fine', FineSchema);
