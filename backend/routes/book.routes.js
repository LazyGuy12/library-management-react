// routes/book.routes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const { verifyToken, isAdmin } = require('../middlewares/authJwt');

// Lấy danh sách tất cả sách (Public)
router.get('/', bookController.findAll);

// Lấy chi tiết một cuốn sách (Public)
router.get('/:id', bookController.findOne);

// Thêm sách mới (Admin only)
router.post('/', verifyToken, isAdmin, bookController.create);

module.exports = router;