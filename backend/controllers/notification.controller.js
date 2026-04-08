// controllers/notification.controller.js
const Notification = require('../models/notification.model');

// 1. Lấy danh sách thông báo của user
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ user: userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments({ user: userId });
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
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

// 2. Lấy chi tiết một thông báo
exports.getNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOne({ 
      _id: id, 
      user: userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông báo!" 
      });
    }

    // Đánh dấu là đã đọc
    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      notification
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Xóa một thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndDelete({ 
      _id: id, 
      user: userId 
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông báo!" 
      });
    }

    res.status(200).json({
      success: true,
      message: "✅ Xóa thông báo thành công!"
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Xóa tất cả thông báo
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await Notification.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "✅ Xóa tất cả thông báo thành công!",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Đánh dấu thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Không tìm thấy thông báo!" 
      });
    }

    res.status(200).json({
      success: true,
      notification
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Tạo thông báo (Admin/System use)
exports.createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, relatedId } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "userId, title, message là bắt buộc!" 
      });
    }

    const notification = new Notification({
      user: userId,
      title,
      message,
      type: type || 'SYSTEM',
      relatedId
    });

    await notification.save();

    res.status(201).json({
      success: true,
      notification
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Lấy số lượng thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
