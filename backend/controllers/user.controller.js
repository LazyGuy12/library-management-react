// controllers/user.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password, fullName, email } = req.body;
        
        // Validate input
        if (!username || !password || !fullName || !email) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự!" });
        }
        
        const newUser = new User({ username, password, fullName, email, role: 'USER' });
        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} đã được sử dụng!` });
        }
        res.status(500).json({ message: error.message });
    }
};