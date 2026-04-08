// models/borrowSlip.model.js
const mongoose = require('mongoose');

const BorrowSlipSchema = new mongoose.Schema({
  slipCode: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true },
  returnDate: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'borrowed', 'returned', 'overdue'], 
    default: 'pending'
  },
  fine: { type: Number, default: 0 },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('BorrowSlip', BorrowSlipSchema);
