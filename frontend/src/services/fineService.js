import API from './axiosConfig';

export const fineService = {
  // Lấy tất cả phiếu phạt (admin)
  getAllFines: (params) => 
    API.get('/fines/all', { params }),

  // Lấy phiếu phạt của user
  getUserFines: (userId, status) => 
    API.get(`/fines/user/${userId}`, { params: { status } }),

  // Lấy phiếu phạt của user hiện tại
  getMyFines: (status) =>
    API.get('/fines/user/me', { params: { status } }),

  // Chi tiết phiếu phạt
  getFineById: (id) => 
    API.get(`/fines/${id}`),

  // Tạo phiếu phạt (admin)
  createFine: (data) => 
    API.post('/fines', data),

  // Xác nhận thanh toán (admin)
  confirmPayment: (fineId) => 
    API.put(`/fines/${fineId}/confirm-payment`),
};

export default fineService;
