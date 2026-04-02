// models/loan.model.js
const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema({
  book: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Book', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  borrowDate: { 
    type: Date, 
    default: Date.now 
  },
  dueDate: { 
    type: Date, 
    required: true // Ngày dự kiến phải trả (thường là +14 ngày từ ngày mượn)
  },
  returnDate: { 
    type: Date // Ngày thực tế sinh viên mang sách đến trả
  },
  status: { 
    type: String, 
    enum: ['borrowed', 'returned', 'overdue'], 
    default: 'borrowed' 
  },
  fine: { 
    type: Number, 
    default: 0 // Tiền phạt nếu trả muộn
  },
  note: { type: String }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Loan', LoanSchema);