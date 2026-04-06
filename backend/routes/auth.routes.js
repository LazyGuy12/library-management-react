// routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authJwt = require('../middlewares/authJwt');

// Đăng ký tài khoản mới
router.post('/signup', authController.signup);

// Đăng nhập
router.post('/signin', authController.signin);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Kiểm tra token
router.get('/verify', authJwt.verifyToken, (req, res) => {
  res.status(200).json({ success: true, message: "Token hợp lệ!", userId: req.userId, role: req.userRole });
});

module.exports = router;