import API from './axiosConfig';

const reviewService = {
  // Lấy thống kê đánh giá cho sách (avg, distribution)
  getBookReviewStats: (bookId) => API.get(`/reviews/${bookId}/stats`),

  // Lấy danh sách reviews cho sách
  getBookReviews: (bookId, params) => API.get(`/reviews/${bookId}`, { params }),

  // Tạo/cập nhật review
  createReview: (bookId, data) => API.post(`/reviews/${bookId}`, data),

  // Kiểm tra user có được phép đánh giá không
  checkCanReview: (bookId) => API.get(`/reviews/${bookId}/can-review`),
};

export default reviewService;
