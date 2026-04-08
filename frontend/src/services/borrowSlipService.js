import API from './axiosConfig';

const borrowSlipService = {
  // User: Tạo phiếu mượn từ giỏ sách
  createSlip: (bookIds, daysToBorrow = 30) =>
    API.post('/borrow-slips', { bookIds, daysToBorrow }),

  // User: Lấy phiếu mượn của mình
  getMySlips: (status) =>
    API.get('/borrow-slips/my', { params: { status } }),

  // Admin: Lấy tất cả phiếu mượn
  getAllSlips: (params) =>
    API.get('/borrow-slips/all', { params }),

  // Chi tiết phiếu mượn
  getSlipById: (id) =>
    API.get(`/borrow-slips/${id}`),

  // Admin: Xác nhận lấy sách
  pickupSlip: (id) =>
    API.put(`/borrow-slips/${id}/pickup`),

  // Trả sách
  returnSlip: (id) =>
    API.put(`/borrow-slips/${id}/return`),
};

export default borrowSlipService;
