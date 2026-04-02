// controllers/book.controller.js
const Book = require('../models/book.model');

// 1. Lấy danh sách tất cả sách với pagination
exports.findAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const books = await Book.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Book.countDocuments();
    
    res.status(200).json({
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2. Thêm sách mới (Chỉ Admin/Thủ thư dùng)
exports.create = async (req, res) => {
  try {
    const { title, author, category, isbn, quantity } = req.body;
    
    // Validate input
    if (!title || !author || !category || !quantity) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin sách!" });
    }
    
    if (quantity < 1) {
      return res.status(400).json({ message: "Số lượng phải lớn hơn 0!" });
    }
    
    const newBook = new Book(req.body);
    newBook.available = quantity;
    
    const savedBook = await newBook.save();
    res.status(201).json(savedBook);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "ISBN này đã tồn tại!" });
    }
    res.status(400).json({ message: err.message });
  }
};

// 3. Tìm kiếm sách theo ID
exports.findOne = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Không tìm thấy sách!" });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Lỗi tìm kiếm sách." });
  }
};