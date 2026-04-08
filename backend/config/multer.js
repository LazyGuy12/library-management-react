const multer = require('multer');
const path = require('path');

// Sử dụng memory storage để temp store trước khi upload lên Cloudinary
const storage = multer.memoryStorage();

// Filter file (chỉ cho image)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload ảnh (JPEG, PNG, WebP, GIF)'), false);
  }
};

// Khởi tạo upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
