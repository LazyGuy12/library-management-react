// middlewares/authJwt.js
const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const User = require("../models/user.model");

// Kiểm tra Token hợp lệ (async/await version)
const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers["x-access-token"] || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(403).json({ message: "Không tìm thấy Token!" });
    }

    const decoded = jwt.verify(token, config.secret || process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token đã hết hạn!" });
    }
    return res.status(401).json({ message: "Token không hợp lệ!" });
  }
};

// Kiểm tra quyền Admin
const isAdmin = (req, res, next) => {
  if (req.userRole === "ADMIN") {
    next();
    return;
  }
  res.status(403).json({ message: "Yêu cầu quyền Quản trị viên!" });
};

const authJwt = {
  verifyToken,
  isAdmin
};
module.exports = authJwt;