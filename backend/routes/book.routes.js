// routes/book.routes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const authJwt = require('../middlewares/authJwt');

// Lấy danh sách tất cả sách (Public)
router.get('/', bookController.findAll);

// Lấy chi tiết một cuốn sách (Public)
router.get('/:id', bookController.findOne);

// Thêm sách mới (Admin only)
router.post('/', authJwt.verifyToken, authJwt.isAdmin, bookController.create);

// Cập nhật sách (Admin only)
router.put('/:id', authJwt.verifyToken, authJwt.isAdmin, bookController.update);

// Xóa sách (Admin only)
router.delete('/:id', authJwt.verifyToken, authJwt.isAdmin, bookController.delete);

module.exports = router;