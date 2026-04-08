import API from './axiosConfig';

export const bookService = {
  // Lấy danh sách sách với pagination & search
  getBooks: (params) => API.get('/books', { params }),

  // Lấy chi tiết một sách
  getBookById: (id) => API.get(`/books/${id}`),

  // Mượn sách (user)
  borrowBook: (bookId, daysToBorrow) => 
    API.post('/loans', { bookId, daysToBorrow }),

  // Tất cả sách (admin)
  getAllBooks: (params) => API.get('/books/all', { params }),

  // Thêm sách (admin) - supports FormData for file upload
  createBook: (data) => {
    // If data is FormData, let axios handle it automatically
    // If data is plain object, send as JSON
    return API.post('/books', data, {
      headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
    });
  },

  // Cập nhật sách (admin) - supports FormData for file upload
  updateBook: (id, data) => {
    return API.put(`/books/${id}`, data, {
      headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
    });
  },

  // Xóa sách (admin)
  deleteBook: (id) => API.delete(`/books/${id}`),

  // Mượn sách trực tiếp (admin - cho độc giả)
  adminBorrowBook: (bookId, cardNumber, daysToBorrow) =>
    API.post('/borrow-slips/admin/borrow', { bookId, cardNumber, daysToBorrow }),
};

export default bookService;
