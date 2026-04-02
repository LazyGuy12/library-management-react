// middlewares/verifySignUp.js
const User = require("../models/user.model");

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    const { username, email } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ message: "Tên đăng nhập và email là bắt buộc!" });
    }
    
    // Combine both checks into one query for better performance
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });
    
    if (existingUser) {
      const field = existingUser.username === username ? "Tên đăng nhập" : "Email";
      return res.status(400).json({ message: `Lỗi: ${field} đã được sử dụng!` });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail
};
module.exports = verifySignUp;