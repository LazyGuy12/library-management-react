// routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authJwt = require('../middlewares/authJwt');

// ⚠️ Specific routes MUST be before parameterized routes

// Lấy thông tin user hiện tại
router.get('/profile/me', authJwt.verifyToken, userController.getProfile);

// Cập nhật thông tin user hiện tại
router.put('/profile/update', authJwt.verifyToken, userController.updateProfile);

// Lấy lịch sử mượn sách của user hiện tại
router.get('/borrow-history', authJwt.verifyToken, userController.getBorrowHistory);

// === ADMIN ENDPOINTS ===

// Lấy danh sách tất cả user (Admin only)
router.get('/all', authJwt.verifyToken, authJwt.isAdmin, userController.findAll);

// Lấy lịch sử mượn sách của một user cụ thể (Admin)
router.get('/:id/borrow-history', authJwt.verifyToken, authJwt.isAdmin, userController.getBorrowHistory);

// Lấy thông tin chi tiết một user (Admin)
router.get('/:id', authJwt.verifyToken, authJwt.isAdmin, userController.findOne);

module.exports = router;
