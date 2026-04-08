// controllers/card.controller.js
const LibraryCard = require('../models/libraryCard.model');
const Fine = require('../models/fine.model');
const User = require('../models/user.model');

// 1. Lấy danh sách tất cả thẻ độc giả (Admin)
exports.findAll = async (req, res) => {
  try {
    const cards = await LibraryCard.find()
      .populate('user', 'mssv fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: cards.length,
      cards
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Lấy chi tiết thẻ và danh sách phạt của một user
exports.findByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy thẻ độc giả
    const card = await LibraryCard.findOne({ user: userId })
      .populate('user', 'mssv fullName email');

    if (!card) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy thẻ độc giả!" 
      });
    }

    // Lấy danh sách phiếu phạt chưa thanh toán
    const fines = await Fine.find({ 
      user: userId, 
      status: 'PENDING' 
    }).sort({ createdDate: -1 });

    // Tính tổng phạt chưa thanh toán
    const totalFine = fines.reduce((sum, fine) => sum + fine.amount, 0);

    res.status(200).json({
      success: true,
      card,
      fines,
      totalFine
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Gia hạn thẻ độc giả (Admin)
exports.renewCard = async (req, res) => {
  try {
    const { userId } = req.params;

    const card = await LibraryCard.findOne({ user: userId });
    if (!card) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy thẻ độc giả!" 
      });
    }

    // Cập nhật ngày hết hạn (+1 năm)
    const newExpiryDate = new Date(card.expiryDate);
    newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

    card.expiryDate = newExpiryDate;
    card.status = 'ACTIVE';
    card.renewalCount += 1;

    const updatedCard = await card.save();

    res.status(200).json({
      success: true,
      message: "✅ Gia hạn thẻ thành công! Thẻ có hiệu lực đến: " + newExpiryDate.toLocaleDateString('vi-VN'),
      card: updatedCard
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Kiểm tra trạng thái thẻ
exports.checkCardStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const card = await LibraryCard.findOne({ user: userId });
    if (!card) {
      return res.status(404).json({ 
        success: false,
        message: "Không tìm thấy thẻ độc giả!" 
      });
    }

    // Kiểm tra hết hạn
    const now = new Date();
    let status = card.status;
    
    if (card.status !== 'SUSPENDED' && card.expiryDate < now) {
      status = 'EXPIRED';
    }

    // Lấy phiếu phạt chưa thanh toán
    const pendingFines = await Fine.countDocuments({ 
      user: userId, 
      status: 'PENDING' 
    });

    res.status(200).json({
      success: true,
      card,
      currentStatus: status,
      hasPendingFines: pendingFines > 0,
      pendingFineCount: pendingFines
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Khóa thẻ độc giả (Admin)
exports.lockCard = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập lý do khóa thẻ!"
      });
    }

    const card = await LibraryCard.findOne({ user: userId });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thẻ độc giả!"
      });
    }

    // Cập nhật trạng thái thẻ
    card.status = 'SUSPENDED';
    const updatedCard = await card.save();

    // Tạo thông báo cho user
    const Notification = require('../models/notification.model');
    const notification = new Notification({
      user: userId,
      title: '⚠️ Thẻ của bạn đã bị khóa',
      message: `Lý do: ${reason}`,
      type: 'CARD_LOCKED',
      relatedId: card._id
    });
    await notification.save();

    res.status(200).json({
      success: true,
      message: "✅ Khóa thẻ thành công! Thông báo được gửi cho user.",
      card: updatedCard
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Mở khóa thẻ độc giả (Admin)
exports.unlockCard = async (req, res) => {
  try {
    const { userId } = req.params;

    const card = await LibraryCard.findOne({ user: userId });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thẻ độc giả!"
      });
    }

    // Cập nhật trạng thái thẻ
    card.status = 'ACTIVE';
    const updatedCard = await card.save();

    // Tạo thông báo cho user
    const Notification = require('../models/notification.model');
    const notification = new Notification({
      user: userId,
      title: '✅ Thẻ của bạn đã được mở khóa',
      message: "Admin đã mở khóa thẻ cho bạn, giờ đây bạn có thể mượn sách",
      type: 'CARD_LOCKED',
      relatedId: card._id
    });
    await notification.save();

    res.status(200).json({
      success: true,
      message: "✅ Mở khóa thẻ thành công! Thông báo được gửi cho user.",
      card: updatedCard
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
