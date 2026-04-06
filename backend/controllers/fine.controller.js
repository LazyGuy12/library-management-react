// controllers/fine.controller.js
const Fine = require('../models/fine.model');
const LibraryCard = require('../models/libraryCard.model');
const Loan = require('../models/loan.model');

// 1. Lấy danh sách phiếu phạt của một user
exports.findByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const status = req.query.status; // PENDING hoặc PAID

    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const fines = await Fine.find(filter)
      .populate('user', 'mssv fullName email')
      .populate('loan', 'bookTitle borrowDate dueDate returnDate')
      .sort({ createdDate: -1 });

    res.status(200).json({
      success: true,
      count: fines.length,
      fines
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Lấy chi tiết một phiếu phạt
exports.findOne = async (req, res) => {
  try {
    const { fineId } = req.params;

    const fine = await Fine.findById(fineId)
      .populate('user', 'mssv fullName email')
      .populate('loan');

    if (!fine) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phiếu phạt!" 
      });
    }

    res.status(200).json({ success: true, fine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Xác nhận thanh toán phiếu phạt (Admin)
exports.confirmPayment = async (req, res) => {
  try {
    const { fineId } = req.params;

    const fine = await Fine.findById(fineId);
    if (!fine) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy phiếu phạt!" 
      });
    }

    if (fine.status === 'PAID') {
      return res.status(400).json({ 
        success: false,
        message: "Phiếu phạt này đã được thanh toán rồi!" 
      });
    }

    // Lấy thông tin admin từ JWT token
    const User = require('../models/user.model');
    const admin = await User.findById(req.userId);

    // Cập nhật phiếu phạt
    fine.status = 'PAID';
    fine.paidDate = new Date();
    fine.confirmedBy = admin ? admin.mssv : 'admin';
    fine.confirmedAt = new Date();

    const updatedFine = await fine.save();

    // Kiểm tra: Nếu không còn phiếu phạt PENDING, mở khóa thẻ
    const pendingFines = await Fine.countDocuments({ 
      user: fine.user, 
      status: 'PENDING' 
    });

    let cardMessage = '';
    if (pendingFines === 0) {
      const card = await LibraryCard.findOne({ user: fine.user });
      if (card && card.status === 'SUSPENDED') {
        card.status = 'ACTIVE';
        await card.save();
        cardMessage = '\n✅ Thẻ độc giả đã được mở khóa!';
      }
    }

    res.status(200).json({
      success: true,
      message: "✅ Xác nhận thanh toán thành công!" + cardMessage,
      fine: updatedFine
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Thêm phiếu phạt manual (Admin - cho case hỏng sách, mất sách)
exports.create = async (req, res) => {
  try {
    const { userId, fineType, amount, reason } = req.body;

    if (!userId || !fineType || !amount || !reason) {
      return res.status(400).json({ 
        success: false,
        message: "Vui lòng nhập đầy đủ: userId, fineType, amount, reason!" 
      });
    }

    const newFine = new Fine({
      user: userId,
      fineType,
      amount,
      reason,
      status: 'PENDING'
    });

    const savedFine = await newFine.save();

    // Khóa thẻ nếu cần
    const card = await LibraryCard.findOne({ user: userId });
    if (card && card.status === 'ACTIVE') {
      card.status = 'SUSPENDED';
      await card.save();
    }

    res.status(201).json({
      success: true,
      message: "✅ Thêm phiếu phạt thành công!",
      fine: savedFine
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Lấy danh sách tất cả phiếu phạt (Admin)
exports.findAll = async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : {};

    const fines = await Fine.find(filter)
      .populate('user', 'mssv fullName email')
      .populate('loan')
      .sort({ createdDate: -1 });

    const totalAmount = fines.reduce((sum, fine) => sum + fine.amount, 0);

    res.status(200).json({
      success: true,
      count: fines.length,
      totalAmount,
      fines
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
