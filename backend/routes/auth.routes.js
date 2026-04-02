// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const userController = require('../controllers/user.controller');

// Đăng ký tài khoản mới (Dùng hàm register từ userController)
router.post('/signup', userController.register);

// Đăng nhập (Dùng hàm signin từ authController)
router.post('/signin', authController.signin);

module.exports = router;