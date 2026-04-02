// controllers/auth.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Vui lòng nhập tên đăng nhập và mật khẩu!" });
    }
    
    const user = await User.findOne({ username }).select('+password');
    if (!user) return res.status(404).json({ message: "User không tồn tại." });

    // Use async bcrypt.compare instead of compareSync
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ message: "Sai mật khẩu!" });

    // Use user._id (MongoDB), not user.id
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "library-secret-key", {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};