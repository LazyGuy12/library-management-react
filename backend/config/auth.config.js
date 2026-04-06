// config/auth.config.js
module.exports = {
  secret: process.env.JWT_SECRET || "library-secret-key",
  // Thời gian sống của token (ví dụ: 24 giờ)
  jwtExpiration: 86400,          
  // Thời gian sống của refresh token (ví dụ: 48 giờ)
  jwtRefreshExpiration: 172800,   
};