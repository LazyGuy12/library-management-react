// models/book.model.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  category: { type: String, required: true }, // VD: CNTT, Kinh tế, Văn học
  isbn: { type: String, unique: true },      // Mã định danh sách quốc tế
  description: { type: String },
  image: { type: String },                   // URL ảnh bìa sách
  quantity: { type: Number, default: 1 },    // Tổng số lượng nhập về
  available: { type: Number, default: 1 },   // Số lượng thực tế còn trên kệ để cho mượn
  location: { type: String }                 // Vị trí kệ (VD: Khu A - Kệ 1)
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Book', BookSchema);