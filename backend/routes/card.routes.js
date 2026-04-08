// routes/card.routes.js
const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const authJwt = require('../middlewares/authJwt');

// ⚠️ Specific routes MUST be before parameterized routes (/:userId)

// Kiểm tra trạng thái thẻ
router.get('/:userId/status', authJwt.verifyToken, cardController.checkCardStatus);

// Lấy danh sách tất cả thẻ độc giả (Admin only)
router.get('/', authJwt.verifyToken, authJwt.isAdmin, cardController.findAll);

// Lấy chi tiết thẻ và danh sách phạt của một user
router.get('/:userId', authJwt.verifyToken, cardController.findByUserId);

// Gia hạn thẻ độc giả (Admin only)
router.put('/:userId/renew', authJwt.verifyToken, authJwt.isAdmin, cardController.renewCard);

// Khóa thẻ độc giả (Admin only)
router.put('/:userId/lock', authJwt.verifyToken, authJwt.isAdmin, cardController.lockCard);

// Mở khóa thẻ độc giả (Admin only)
router.put('/:userId/unlock', authJwt.verifyToken, authJwt.isAdmin, cardController.unlockCard);

module.exports = router;
