// models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  mssv: {
    type: String,
    required: [true, 'Vui lòng nhập mã số sinh viên'],
    unique: true,
    trim: true,
    match: [/^[0-9]{8,10}$/, 'MSSV phải là 8-10 chữ số']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: 6,
    select: false // Không tự động trả về mật khẩu khi query dữ liệu
  },
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Email không hợp lệ']
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware: Tự động mã hóa mật khẩu trước khi lưu vào DB
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method: Kiểm tra mật khẩu khi đăng nhập
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model('User', userSchema);
module.exports = User;