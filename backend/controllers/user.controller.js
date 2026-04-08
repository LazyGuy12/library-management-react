// controllers/user.controller.js
const User = require('../models/user.model');
const LibraryCard = require('../models/libraryCard.model');
const Fine = require('../models/fine.model');
const Loan = require('../models/loan.model');

// 1. Lấy thông tin user hiện tại (đã authenticated)
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User không tồn tại!" 
      });
    }

    // Lấy thông tin thẻ độc giả
    const card = await LibraryCard.findOne({ user: req.userId });

    // Lấy phiếu phạt chưa thanh toán
    const pendingFines = await Fine.find({ 
      user: req.userId, 
      status: 'PENDING' 
    });

    // Lấy số phiếu mượn đang hoạt động
    const activeLoans = await Loan.countDocuments({ 
      user: req.userId, 
      status: { $in: ['borrowed', 'overdue'] }
    });

    res.status(200).json({
      success: true,
      user,
      card: card ? {
        cardNumber: card.cardNumber,
        status: card.status,
        expiryDate: card.expiryDate,
        renewalCount: card.renewalCount
      } : null,
      stats: {
        activeLoans,
        pendingFines: pendingFines.length,
        totalFineAmount: pendingFines.reduce((sum, f) => sum + f.amount, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Cập nhật thông tin user
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email } = req.body;
    
    // Không cho phép thay đổi MSSV và role
    const update = {};
    if (fullName) update.fullName = fullName;
    if (email) {
      // Kiểm tra email có bị trùng không
      const existingEmail = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existingEmail) {
        return res.status(400).json({ 
          success: false,
          message: "Email này đã được sử dụng!" 
        });
      }
      update.email = email;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId, 
      update, 
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: "✅ Cập nhật thông tin thành công!",
      user: updatedUser
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 3. Tìm user theo ID (Admin)
exports.findOne = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User không tồn tại!" 
      });
    }

    const card = await LibraryCard.findOne({ user: req.params.id });

    res.status(200).json({
      success: true,
      user,
      card
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Lấy danh sách tất cả user (Admin)
exports.findAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Populate card data for each user
    const usersWithCards = await Promise.all(
      users.map(async (user) => {
        let card = await LibraryCard.findOne({ user: user._id });
        
        // Auto-create card if it doesn't exist and user is not admin
        if (!card && user.role !== 'ADMIN') {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          const year = new Date().getFullYear();
          const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
          const cardNumber = `LIB-${year}-${randomStr}`;
          
          card = new LibraryCard({
            user: user._id,
            cardNumber: cardNumber,
            status: 'ACTIVE',
            expiryDate: expiryDate
          });
          
          try {
            await card.save();
          } catch (err) {
            console.error('Error creating card:', err);
            card = null;
          }
        }
        
        return {
          ...user.toObject(),
          card: card ? {
            cardNumber: card.cardNumber,
            status: card.status,
            issuedDate: card.issuedDate,
            expiryDate: card.expiryDate,
            renewalCount: card.renewalCount
          } : null
        };
      })
    );

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      users: usersWithCards,
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

// 5. Xem lịch sử mượn sách của user
exports.getBorrowHistory = async (req, res) => {
  try {
    const userId = req.params.id || req.userId;
    const status = req.query.status; // borrowed, returned, overdue

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const loans = await Loan.find(filter)
      .populate('book', 'title author isbn')
      .sort({ borrowDate: -1 });

    res.status(200).json({
      success: true,
      count: loans.length,
      loans
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
