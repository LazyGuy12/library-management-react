// routes/loan.routes.js
const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loan.controller');
const authJwt = require('../middlewares/authJwt');

// ⚠️ Specific routes MUST be before parameterized routes (/:id)

// Lấy lịch sử mượn sách của user hiện tại
router.get('/user/history', authJwt.verifyToken, loanController.getUserLoans);

// Lấy danh sách tất cả phiếu mượn (Admin only)
router.get('/all', authJwt.verifyToken, authJwt.isAdmin, loanController.findAll);

// Admin xác nhận lấy sách - chuyển từ pending → borrowed (Admin only)
router.put('/:id/pickup', authJwt.verifyToken, authJwt.isAdmin, loanController.pickupLoan);

// Admin mượn sách cho user khác (Quick Borrow)
router.post('/admin/borrow', authJwt.verifyToken, authJwt.isAdmin, loanController.adminCreateLoan);

// Tạo phiếu mượn sách mới (Authenticated user)
router.post('/', authJwt.verifyToken, loanController.createLoan);

// Trả sách (Authenticated user hoặc Admin)
router.put('/return/:id', authJwt.verifyToken, loanController.returnBook);

// Lấy chi tiết một phiếu mượn
router.get('/:id', authJwt.verifyToken, loanController.findOne);

module.exports = router;