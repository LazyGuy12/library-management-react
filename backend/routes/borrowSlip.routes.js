// routes/borrowSlip.routes.js
const express = require('express');
const router = express.Router();
const borrowSlipController = require('../controllers/borrowSlip.controller');
const authJwt = require('../middlewares/authJwt');

// User: Lấy phiếu mượn của mình
router.get('/my', authJwt.verifyToken, borrowSlipController.getUserSlips);

// Admin: Lấy tất cả phiếu mượn
router.get('/all', authJwt.verifyToken, authJwt.isAdmin, borrowSlipController.getAllSlips);

// User: Tạo phiếu mượn từ giỏ sách
router.post('/', authJwt.verifyToken, borrowSlipController.createSlip);

// Admin: Xác nhận lấy sách
router.put('/:id/pickup', authJwt.verifyToken, authJwt.isAdmin, borrowSlipController.pickupSlip);

// Trả sách
router.put('/:id/return', authJwt.verifyToken, borrowSlipController.returnSlip);

// Chi tiết phiếu mượn
router.get('/:id', authJwt.verifyToken, borrowSlipController.getSlipById);

module.exports = router;
