// routes/book.routes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
<<<<<<< Updated upstream
const { verifyToken, isAdmin } = require('../middlewares/authJwt');
=======
const authJwt = require('../middlewares/authJwt');
const upload = require('../config/multer');
>>>>>>> Stashed changes

// Lấy danh sách tất cả sách (Public)
router.get('/', bookController.findAll);

// Lấy chi tiết một cuốn sách (Public)
router.get('/:id', bookController.findOne);

<<<<<<< Updated upstream
// Thêm sách mới (Admin only)
router.post('/', verifyToken, isAdmin, bookController.create);
=======
// Thêm sách mới (Admin only) - with file upload
router.post('/', authJwt.verifyToken, authJwt.isAdmin, upload.single('image'), bookController.create);

// Cập nhật sách (Admin only) - with optional file upload
router.put('/:id', authJwt.verifyToken, authJwt.isAdmin, upload.single('image'), bookController.update);

// Đánh giá sách (Authenticated user - phải đã mượn và trả)
router.post('/:id/rate', authJwt.verifyToken, bookController.rateBook);

// Xóa sách (Admin only)
router.delete('/:id', authJwt.verifyToken, authJwt.isAdmin, bookController.delete);
>>>>>>> Stashed changes

module.exports = router;