// routes/card.routes.js
const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const authJwt = require('../middlewares/authJwt');

// Lấy danh sách tất cả thẻ độc giả (Admin only)
router.get('/', authJwt.verifyToken, authJwt.isAdmin, cardController.findAll);

// Lấy chi tiết thẻ và danh sách phạt của một user
router.get('/:userId', authJwt.verifyToken, cardController.findByUserId);

// Gia hạn thẻ độc giả (Admin only)
router.put('/:userId/renew', authJwt.verifyToken, authJwt.isAdmin, cardController.renewCard);

// Kiểm tra trạng thái thẻ
router.get('/:userId/status', authJwt.verifyToken, cardController.checkCardStatus);

module.exports = router;
