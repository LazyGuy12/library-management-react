import API from './axiosConfig';

export const userService = {
  // Lấy thông tin profile của user hiện tại
  getProfile: () => API.get('/users/profile/me'),

  // Cập nhật profile
  updateProfile: (data) => API.put('/users/profile/update', data),

  // Lấy lịch sử mượn sách
  getBorrowHistory: (status) => API.get('/users/borrow-history', { params: { status } }),

  // Lấy thông tin thẻ độc giả
  getCard: (userId) => API.get(`/cards/${userId}`),

  // Lấy trạng thái thẻ
  getCardStatus: (userId) => API.get(`/cards/${userId}/status`),

  // [ADMIN] Lấy danh sách tất cả users
  getAllUsers: (params) => API.get('/users/all', { params }),

  // [ADMIN] Lấy thông tin một user
  getUserById: (userId) => API.get(`/users/admin/${userId}`),
};

export default userService;
