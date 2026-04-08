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
    const { title, author, category, isbn, quantity, description, location } = req.body;
    
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
    
    // Handle image upload to Cloudinary
    let imageUrl = null;
    if (req.file) {
      try {
        // Save buffer to temporary file
        const tempDir = os.tmpdir();
        const tempPath = path.join(tempDir, `${Date.now()}_${req.file.originalname}`);
        await fs.writeFile(tempPath, req.file.buffer);
        
        // Upload to Cloudinary
        const uploadResult = await CloudinaryService.uploadFile(tempPath, 'library-books');
        imageUrl = uploadResult.url;
      } catch (uploadErr) {
        return res.status(400).json({ 
          success: false,
          message: "Upload hình ảnh thất bại: " + uploadErr.message 
        });
      }
    }
    
    const newBook = new Book({
      title,
      author,
      category,
      isbn,
      quantity,
      available: quantity,
      description,
      image: imageUrl,
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

    // Get current book to handle old image
    const currentBook = await Book.findById(id);
    if (!currentBook) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy sách để cập nhật!" 
      });
    }

    // Handle new image upload to Cloudinary
    if (req.file) {
      try {
        // Delete old image from Cloudinary if exists
        if (currentBook.image) {
          const publicId = currentBook.image.split('/').pop().split('.')[0];
          await CloudinaryService.deleteFile(`library-books/${publicId}`).catch(() => {});
        }
        
        // Save buffer to temporary file
        const tempDir = os.tmpdir();
        const tempPath = path.join(tempDir, `${Date.now()}_${req.file.originalname}`);
        await fs.writeFile(tempPath, req.file.buffer);
        
        // Upload new image to Cloudinary
        const uploadResult = await CloudinaryService.uploadFile(tempPath, 'library-books');
        updates.image = uploadResult.url;
      } catch (uploadErr) {
        return res.status(400).json({ 
          success: false,
          message: "Upload hình ảnh thất bại: " + uploadErr.message 
        });
      }
    }

    const book = await Book.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    });

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

    // Delete image from Cloudinary if exists
    if (book.image) {
      try {
        const publicId = book.image.split('/').pop().split('.')[0];
        await CloudinaryService.deleteFile(`library-books/${publicId}`).catch(() => {});
      } catch (err) {
        console.error('Error deleting image from Cloudinary:', err);
        // Continue with deletion even if image delete fails
      }
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

// 6. Đánh giá sách (chỉ user đã mượn và trả)
// Lấy danh sách sách mà user đã đánh giá
exports.getMyRatings = async (req, res) => {
  try {
    const userId = req.userId;
    const books = await Book.find({ 'ratings.user': userId }, '_id');
    const ratedBookIds = books.map(b => b._id.toString());
    res.status(200).json({ success: true, ratedBookIds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.rateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { score } = req.body;
    const userId = req.userId;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ success: false, message: "Điểm đánh giá phải từ 1 đến 5!" });
    }

    // Kiểm tra xem user đã từng mượn và trả sách này chưa
    const Loan = require('../models/loan.model');
    const BorrowSlip = require('../models/borrowSlip.model');
    const returnedLoan = await Loan.findOne({ 
      book: id, 
      user: userId, 
      status: 'returned' 
    });
    const returnedSlip = await BorrowSlip.findOne({
      books: id,
      user: userId,
      status: 'returned'
    });

    if (!returnedLoan && !returnedSlip) {
      return res.status(403).json({ 
        success: false, 
        message: "Bạn phải mượn và trả sách này trước khi đánh giá!" 
      });
    }

    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sách!" });
    }

    // Cập nhật hoặc thêm đánh giá của user
    const existingIdx = book.ratings.findIndex(r => r.user.toString() === userId.toString());
    if (existingIdx >= 0) {
      book.ratings[existingIdx].score = score;
    } else {
      book.ratings.push({ user: userId, score });
    }

    // Tính lại điểm trung bình
    const total = book.ratings.reduce((sum, r) => sum + r.score, 0);
    book.avgRating = Math.round((total / book.ratings.length) * 10) / 10;
    book.totalRatings = book.ratings.length;
    
    await book.save();

    res.status(200).json({ 
      success: true,
      message: "✅ Cảm ơn bạn đã đánh giá sách!",
      avgRating: book.avgRating,
      totalRatings: book.totalRatings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};