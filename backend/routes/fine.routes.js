// routes/fine.routes.js
const express = require('express');
const router = express.Router();
const fineController = require('../controllers/fine.controller');
const authJwt = require('../middlewares/authJwt');

// ⚠️ Specific routes MUST be before parameterized routes

// Lấy danh sách tất cả phiếu phạt (Admin only)
router.get('/all', authJwt.verifyToken, authJwt.isAdmin, fineController.findAll);

// Lấy danh sách phiếu phạt của một user
router.get('/user/:userId', authJwt.verifyToken, fineController.findByUserId);

// Thêm phiếu phạt mới (Admin only)
router.post('/', authJwt.verifyToken, authJwt.isAdmin, fineController.create);

// Xác nhận thanh toán phiếu phạt (Admin only)
router.put('/:fineId/confirm-payment', authJwt.verifyToken, authJwt.isAdmin, fineController.confirmPayment);

// Lấy chi tiết một phiếu phạt
router.get('/:fineId', authJwt.verifyToken, fineController.findOne);

module.exports = router;
