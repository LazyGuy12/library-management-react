const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const authJwt = require('../middlewares/authJwt');

// Lấy thống kê đánh giá cho sách (public)
router.get('/:bookId/stats', reviewController.getBookReviewStats);

// Lấy danh sách reviews cho sách (public)
router.get('/:bookId', reviewController.getBookReviews);

// Tạo/cập nhật review (authenticated user)
router.post('/:bookId', authJwt.verifyToken, reviewController.createReview);

module.exports = router;
