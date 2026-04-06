// models/libraryCard.model.js
const mongoose = require('mongoose');

const LibraryCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cardNumber: {
    type: String,
    unique: true,
    required: true
    // Format: LIB-YYYY-XXXX (VD: LIB-2026-ABC1)
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    required: true
    // Mặc định: 1 năm từ ngày cấp
  },
  renewalCount: {
    type: Number,
    default: 0
    // Số lần đã gia hạn
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Pre-save hook để tạo cardNumber nếu chưa có
LibraryCardSchema.pre('save', async function(next) {
  if (!this.cardNumber) {
    const year = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.cardNumber = `LIB-${year}-${randomStr}`;
  }
  next();
});

module.exports = mongoose.model('LibraryCard', LibraryCardSchema);
