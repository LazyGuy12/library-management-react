// controllers/auth.controller.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

<<<<<<< Updated upstream
=======
// ĐĂNG KÝ (Sign Up)
exports.signup = async (req, res) => {
  try {
    const { mssv, email, password, fullName } = req.body;

    // Validate input
    if (!mssv || !email || !password || !fullName) {
      return res.status(400).json({ 
        message: "Vui lòng nhập đầy đủ: MSSV, email, password, fullName!" 
      });
    }

    // Kiểm tra MSSV đã tồn tại
    const existingUser = await User.findOne({ mssv });
    if (existingUser) {
      return res.status(400).json({ message: "MSSV đã tồn tại!" });
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email đã tồn tại!" });
    }

    // Tạo User mới (password sẽ được hash tự động bằng middleware pre-save)
    const newUser = new User({
      mssv,
      email,
      password,
      fullName,
      role: 'USER'
    });

    const savedUser = await newUser.save();

    // Tạo LibraryCard tự động
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // +1 năm

    // Tạo cardNumber
    const year = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const cardNumber = `LIB-${year}-${randomStr}`;

    const libraryCard = new LibraryCard({
      user: savedUser._id,
      cardNumber: cardNumber,
      status: 'ACTIVE',
      expiryDate: expiryDate
    });

    await libraryCard.save();

    res.status(201).json({
      message: "✅ Đăng ký thành công! Thẻ độc giả đã được tạo.",
      user: {
        id: savedUser._id,
        mssv: savedUser.mssv,
        email: savedUser.email,
        fullName: savedUser.fullName,
        role: savedUser.role
      },
      libraryCard: {
        cardNumber: libraryCard.cardNumber,
        status: libraryCard.status,
        expiryDate: libraryCard.expiryDate
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi đăng ký: " + err.message });
  }
};

// ĐĂNG NHẬP (Sign In)
>>>>>>> Stashed changes
exports.signin = async (req, res) => {
  try {
    const { mssv, password } = req.body;
    
    // Validate input
    if (!mssv || !password) {
      return res.status(400).json({ message: "Vui lòng nhập MSSV và mật khẩu!" });
    }
    
    const user = await User.findOne({ mssv }).select('+password');
    if (!user) return res.status(404).json({ message: "Sinh viên không tồn tại." });

    // Use async bcrypt.compare instead of compareSync
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ message: "Sai mật khẩu!" });

    // Use user._id (MongoDB), not user.id
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "library-secret-key", {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      id: user._id,
      mssv: user.mssv,
      email: user.email,
      role: user.role,
      accessToken: token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};