// routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authJwt = require('../middlewares/authJwt');

// Lấy danh sách thông báo của user hiện tại
router.get('/', authJwt.verifyToken, notificationController.getMyNotifications);

// Lấy số lượng thông báo chưa đọc
router.get('/unread-count', authJwt.verifyToken, notificationController.getUnreadCount);

// Lấy chi tiết một thông báo
router.get('/:id', authJwt.verifyToken, notificationController.getNotificationDetail);

// Đánh dấu đã đọc
router.put('/:id/read', authJwt.verifyToken, notificationController.markAsRead);

// Xóa một thông báo
router.delete('/:id', authJwt.verifyToken, notificationController.deleteNotification);

// Xóa tất cả thông báo
router.delete('/', authJwt.verifyToken, notificationController.deleteAllNotifications);

// === ADMIN ROUTES ===

// Tạo thông báo (Admin)
router.post('/', authJwt.verifyToken, authJwt.isAdmin, notificationController.createNotification);

module.exports = router;
