// models/refreshToken.model.js
const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  expiryDate: { type: Date, required: true }
});

// Hàm kiểm tra xem token đã hết hạn chưa
RefreshTokenSchema.statics.verifyExpiration = (token) => {
  return token.expiryDate.getTime() < new Date().getTime();
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);