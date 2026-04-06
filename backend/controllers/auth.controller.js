// controllers/auth.controller.js
const User = require('../models/user.model');
const LibraryCard = require('../models/libraryCard.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
exports.signin = async (req, res) => {
  try {
    const { mssv, password } = req.body;
    
    // Validate input
    if (!mssv || !password) {
      return res.status(400).json({ message: "Vui lòng nhập MSSV và mật khẩu!" });
    }
    
    const user = await User.findOne({ mssv }).select('+password');
    if (!user) return res.status(404).json({ message: "Sinh viên không tồn tại." });

    // Kiểm tra mật khẩu
    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ message: "Sai mật khẩu!" });

    // Lấy thông tin Thẻ độc giả
    const libraryCard = await LibraryCard.findOne({ user: user._id });

    // Tạo JWT access token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET || "library-secret-key",
      { expiresIn: 86400 } // 24 hours
    );

    // Tạo refresh token
    const RefreshToken = require('../models/refreshToken.model');
    // Xóa refresh token cũ
    await RefreshToken.deleteMany({ user: user._id });
    
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setSeconds(refreshTokenExpiry.getSeconds() + 172800); // 48 hours
    
    const refreshToken = await RefreshToken.create({
      token: require('crypto').randomBytes(40).toString('hex'),
      user: user._id,
      expiryDate: refreshTokenExpiry
    });

    // Kiểm tra thông báo thẻ
    let cardNotification = null;
    if (libraryCard) {
      const now = new Date();
      const daysUntilExpiry = Math.ceil((libraryCard.expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (libraryCard.status === 'SUSPENDED') {
        const Fine = require('../models/fine.model');
        const pendingCount = await Fine.countDocuments({ user: user._id, status: 'PENDING' });
        cardNotification = {
          type: 'DANGER',
          message: `🔒 Thẻ bị khóa do có ${pendingCount} phiếu phạt chưa thanh toán. Vui lòng liên hệ admin.`
        };
      } else if (libraryCard.status === 'EXPIRED' || libraryCard.expiryDate < now) {
        cardNotification = {
          type: 'DANGER',
          message: '⚠️ Thẻ độc giả hết hạn! Vui lòng liên hệ admin gia hạn.'
        };
      } else if (daysUntilExpiry <= 30) {
        cardNotification = {
          type: 'WARNING',
          message: `📅 Thẻ độc giả sắp hết hạn trong ${daysUntilExpiry} ngày. Hãy gia hạn trước!`
        };
      }
    }

    res.status(200).json({
      message: "✅ Đăng nhập thành công!",
      id: user._id,
      mssv: user.mssv,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      libraryCard: libraryCard ? {
        cardNumber: libraryCard.cardNumber,
        status: libraryCard.status,
        expiryDate: libraryCard.expiryDate,
        renewalCount: libraryCard.renewalCount
      } : null,
      cardNotification,
      accessToken: token,
      refreshToken: refreshToken.token
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi đăng nhập: " + err.message });
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken: requestToken } = req.body;

    if (!requestToken) {
      return res.status(403).json({ message: "Refresh Token là bắt buộc!" });
    }

    const RefreshToken = require('../models/refreshToken.model');
    const storedToken = await RefreshToken.findOne({ token: requestToken });

    if (!storedToken) {
      return res.status(403).json({ message: "Refresh Token không hợp lệ!" });
    }

    // Kiểm tra hết hạn
    if (RefreshToken.verifyExpiration(storedToken)) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(403).json({ message: "Refresh Token đã hết hạn. Vui lòng đăng nhập lại!" });
    }

    // Tạo access token mới
    const newAccessToken = jwt.sign(
      { id: storedToken.user, role: (await User.findById(storedToken.user)).role },
      process.env.JWT_SECRET || "library-secret-key",
      { expiresIn: 86400 }
    );

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: storedToken.token
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi refresh token: " + err.message });
  }
};