import API from './axiosConfig';

export const loanService = {
  // Lấy lịch sử mượn của user
  getMyLoans: (status) => 
    API.get('/loans/user/history', { params: { status } }),

  // Lấy tất cả phiếu mượn (admin)
  getAllLoans: (params) => 
    API.get('/loans/all', { params }),

  // Mượn sách
  borrowBook: (bookId, daysToBorrow = 30) => 
    API.post('/loans', { bookId, daysToBorrow }),

  // Trả sách
  returnBook: (loanId) => 
    API.put(`/loans/return/${loanId}`),

  // Chi tiết phiếu mượn
  getLoanById: (id) => 
    API.get(`/loans/${id}`),

  // Admin: Mượn sách cho user
  adminBorrow: (bookId, userId, daysToBorrow = 30) =>
    API.post('/loans/admin/borrow', { bookId, userId, daysToBorrow }),

  // Admin: Xác nhận lấy sách - chuyển từ pending → borrowed
  pickupLoan: (loanId) => 
    API.put(`/loans/${loanId}/pickup`),
};

export default loanService;
