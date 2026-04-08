// controllers/book.controller.js
const Book = require('../models/book.model');
const CloudinaryService = require('../services/cloudinary.service');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// 1. Lấy danh sách tất cả sách với pagination + search
exports.findAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    
    // Search by title or author (case-insensitive)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex }
      ];
    }

    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const total = await Book.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Thêm sách mới (Chỉ Admin dùng)
exports.create = async (req, res) => {
  try {
    const { title, author, category, isbn, quantity, description, image, location } = req.body;
    
    // Validate input
    if (!title || !author || !category || quantity === undefined) {
      return res.status(400).json({ 
        success: false,
        message: "Vui lòng nhập đầy đủ: title, author, category, quantity!" 
      });
    }
    
    if (quantity < 1) {
      return res.status(400).json({ 
        success: false,
        message: "Số lượng phải lớn hơn 0!" 
      });
    }
    
    const newBook = new Book({
      title,
      author,
      category,
      isbn,
      quantity,
      available: quantity,
      description,
      image,
      location
    });
    
    const savedBook = await newBook.save();
    res.status(201).json({ 
      success: true,
      message: "✅ Thêm sách thành công!",
      book: savedBook 
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "ISBN này đã tồn tại!" 
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3. Tìm sách theo ID
exports.findOne = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy sách!" 
      });
    }
    res.status(200).json({ success: true, book });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: "Lỗi tìm kiếm sách: " + err.message 
    });
  }
};

// 4. Cập nhật sách
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate quantity nếu có update
    if (updates.quantity !== undefined && updates.quantity < 0) {
      return res.status(400).json({ 
        success: false,
        message: "Số lượng không được âm!" 
      });
    }

    const book = await Book.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    });

    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy sách để cập nhật!" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "✅ Cập nhật sách thành công!",
      book 
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: "ISBN này đã tồn tại!" 
      });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// 5. Xóa sách
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra: Có phiếu mượn chưa trả không?
    const Loan = require('../models/loan.model');
    const activeLoans = await Loan.countDocuments({ 
      book: id, 
      status: { $in: ['borrowed', 'overdue'] }
    });

    if (activeLoans > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Không thể xóa! Có ${activeLoans} phiếu mượn chưa trả.` 
      });
    }

    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy sách để xóa!" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "✅ Xóa sách thành công!",
      book 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};