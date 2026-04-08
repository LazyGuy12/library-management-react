import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navigation from '../components/Navigation';
import bookService from '../services/bookService';
import '../styles/admin.css';

function AdminBooksPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [editingBookId, setEditingBookId] = useState(null);
  
  // Ref for form scroll
  const formRef = useRef(null);
  
  // Manual borrow state
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState(null);
  const [borrowFormData, setBorrowFormData] = useState({
    cardNumber: '',
    returnDate: '',
  });
  const [borrowLoading, setBorrowLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    isbn: '',
    quantity: '',
    description: '',
    image: null, // File object hoặc null
    location: '',
  });

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await bookService.getBooks({
        search: search || undefined,
        limit: 10,
      });
      setBooks(response.data.books || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải sách:', err);
      setError('Không thể tải danh sách sách.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      const file = files[0];
      if (file) {
        // Kiểm tra kích thước (giới hạn 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('❌ Ảnh phải nhỏ hơn 5MB!');
          return;
        }

        // Kiểm tra loại file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          alert('❌ Chỉ chấp nhận: JPEG, PNG, WebP, GIF');
          return;
        }

        // Lưu file object
        setFormData((prev) => ({
          ...prev,
          [name]: file,
        }));

        // Tạo preview
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    
    // Trim all text values
    const trimmedData = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      category: formData.category.trim(),
      isbn: formData.isbn.trim(),
      quantity: formData.quantity ? parseInt(formData.quantity) : '',
      description: formData.description.trim(),
      location: formData.location.trim(),
      image: formData.image, // File object hoặc null
    };

    // Validation
    if (!trimmedData.title || trimmedData.title.length === 0) {
      alert('❌ Vui lòng nhập tên sách!');
      return;
    }
    if (!trimmedData.author || trimmedData.author.length === 0) {
      alert('❌ Vui lòng nhập tác giả!');
      return;
    }
    if (!trimmedData.category || trimmedData.category.length === 0) {
      alert('❌ Vui lòng nhập thể loại!');
      return;
    }
    if (!trimmedData.quantity || trimmedData.quantity === 0 || isNaN(trimmedData.quantity)) {
      alert('❌ Vui lòng nhập số lượng (phải > 0)!');
      return;
    }

    try {
      // Tạo FormData object
      const payload = new FormData();
      payload.append('title', trimmedData.title);
      payload.append('author', trimmedData.author);
      payload.append('category', trimmedData.category);
      payload.append('isbn', trimmedData.isbn);
      payload.append('quantity', trimmedData.quantity);
      payload.append('description', trimmedData.description);
      payload.append('location', trimmedData.location);
      
      // Thêm ảnh nếu có
      if (trimmedData.image instanceof File) {
        payload.append('image', trimmedData.image);
      }

      if (editingBookId) {
        // Chỉnh sửa sách
        await bookService.updateBook(editingBookId, payload);
        alert('✅ Chỉnh sửa sách thành công!');
      } else {
        // Thêm sách mới
        console.log('Gửi dữ liệu sách mới với FormData');
        await bookService.createBook(payload);
        alert('✅ Thêm sách thành công!');
      }

      // Reset form
      setFormData({
        title: '',
        author: '',
        category: '',
        isbn: '',
        quantity: '',
        description: '',
        image: '',
        location: '',
      });
      setImagePreview('');
      setShowForm(false);
      setEditingBookId(null);
      fetchBooks();
    } catch (err) {
      console.error('Chi tiết lỗi:', err.response?.data);
      alert('❌ ' + (err.response?.data?.message || 'Lỗi thao tác sách'));
    }
  };

  const handleEditBook = (book) => {
    setEditingBookId(book._id);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn || '',
      quantity: book.quantity.toString(),
      description: book.description || '',
      image: null,
      location: book.location || '',
    });
    if (book.image) {
      setImagePreview(book.image);
    }
    setShowForm(true);
    
    // Auto scroll to form
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingBookId(null);
    setFormData({
      title: '',
      author: '',
      category: '',
      isbn: '',
      quantity: '',
      description: '',
      image: '',
      location: '',
    });
    setImagePreview('');
    setShowForm(false);
  };

  const openBorrowModal = (book) => {
    setSelectedBookForBorrow(book);
    setBorrowFormData({
      cardNumber: '',
      returnDate: '',
    });
    setShowBorrowModal(true);
  };

  const closeBorrowModal = () => {
    setShowBorrowModal(false);
    setSelectedBookForBorrow(null);
    setBorrowFormData({
      cardNumber: '',
      returnDate: '',
    });
  };

  const handleBorrowFormChange = (e) => {
    const { name, value } = e.target;
    setBorrowFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitBorrow = async (e) => {
    e.preventDefault();

    if (!borrowFormData.cardNumber.trim()) {
      alert('❌ Vui lòng nhập mã thẻ độc giả!');
      return;
    }

    if (!borrowFormData.returnDate) {
      alert('❌ Vui lòng chọn ngày trả sách!');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (borrowFormData.returnDate <= today) {
      alert('❌ Ngày trả sách phải sau hôm nay!');
      return;
    }

    setBorrowLoading(true);
    try {
      // Calculate days to borrow from return date
      const today = new Date();
      const returnDateObj = new Date(borrowFormData.returnDate);
      const daysToBorrow = Math.ceil((returnDateObj - today) / (1000 * 60 * 60 * 24));

      // Gọi API để tạo phiếu mượn cho người dùng
      const response = await bookService.adminBorrowBook(
        selectedBookForBorrow._id,
        borrowFormData.cardNumber,
        daysToBorrow
      );

      alert('✅ ' + (response.data.message || 'Tạo phiếu mượn thành công!'));
      closeBorrowModal();
      fetchBooks(); // Refresh để cập nhật số lượng
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi tạo phiếu mượn'));
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sách này?')) return;
    try {
      await bookService.deleteBook(id);
      alert('✅ Xóa sách thành công!');
      fetchBooks();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi xóa sách'));
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <Navigation />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navigation />

      <main className="admin-content">
        <div className="container">
          {/* Header */}
          <div className="admin-header">
            <h1 className="page-title">
              <i className="bi bi-book"></i> Quản Lý Sách
            </h1>
            <button
              className="btn-add"
              onClick={() => editingBookId ? handleCancelEdit() : setShowForm(!showForm)}
            >
              <i className="bi bi-plus-circle"></i> {editingBookId ? 'Hủy Chỉnh Sửa' : 'Thêm Sách Mới'}
            </button>
          </div>

          {/* Add/Edit Book Form */}
          {showForm && (
            <div className="admin-form-card" ref={formRef}>
              <h2>{editingBookId ? 'Chỉnh Sửa Sách' : 'Thêm Sách Mới'}</h2>
              <form onSubmit={handleAddBook}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên Sách *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên sách"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tác Giả *</label>
                    <input
                      type="text"
                      name="author"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                      placeholder="Nhập tên tác giả"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Thể Loại *</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      placeholder="VD: CNTT, Văn học"
                    />
                  </div>
                  <div className="form-group">
                    <label>ISBN</label>
                    <input
                      type="text"
                      name="isbn"
                      value={formData.isbn}
                      onChange={handleInputChange}
                      placeholder="Mã ISBN"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Số Lượng *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      placeholder="Ví dụ: 5"
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vị Trí Kệ</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Khu A - Kệ 1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô Tả</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả sách"
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Ảnh Sách</label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleInputChange}
                    accept="image/*"
                    placeholder="Chọn ảnh sách"
                  />
                  {imagePreview && (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Preview" />
                      <small>Xem trước ảnh</small>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg"></i> {editingBookId ? 'Cập Nhật' : 'Lưu'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    <i className="bi bi-x-lg"></i> Hủy
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-container">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Tìm kiếm sách..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <i className="bi bi-exclamation-circle"></i>
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="admin-stats">
            <div className="stat-card">
              <i className="bi bi-book"></i>
              <div className="stat-info">
                <span className="stat-label">Tổng Sách</span>
                <span className="stat-value">{books.length}</span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-check-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Còn Trong Kho</span>
                <span className="stat-value">
                  {books.reduce((sum, b) => sum + b.available, 0)}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-bag-check"></i>
              <div className="stat-info">
                <span className="stat-label">Đang Cho Mượn</span>
                <span className="stat-value">
                  {books.reduce((sum, b) => sum + (b.quantity - b.available), 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Books Table */}
          <div className="admin-table">
            {books.length > 0 ? ( 
              <table>
                <thead>
                  <tr>
                    <th>Hình Ảnh</th>
                    <th>Tên Sách</th>
                    <th>Tác Giả</th>
                    <th>Thể Loại</th>
                    <th>ISBN</th>
                    <th>Tổng SL</th>
                    <th>Còn</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book._id}>
                      <td className="book-image-cell">
                        {book.image ? (
                          <img src={book.image} alt={book.title} className="book-thumbnail" />
                        ) : (
                          <div className="book-thumbnail-placeholder">
                            <i className="bi bi-image"></i>
                          </div>
                        )}
                      </td>
                      <td className="book-title">{book.title}</td>
                      <td>{book.author}</td>
                      <td>{book.category}</td>
                      <td>{book.isbn || '-'}</td>
                      <td className="text-center">{book.quantity}</td>
                      <td className="text-center">
                        <span className={book.available > 0 ? 'text-success' : 'text-danger'}>
                          {book.available}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-borrow"
                            onClick={() => openBorrowModal(book)}
                            disabled={book.available === 0}
                            title={book.available === 0 ? 'Hết sách' : 'Mượn sách trực tiếp'}
                          >
                            <i className="bi bi-bag-plus"></i> Mượn
                          </button>
                          <button
                            className="btn-edit"
                            onClick={() => handleEditBook(book)}
                          >
                            <i className="bi bi-pencil"></i> Chỉnh Sửa
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteBook(book._id)}
                          >
                            <i className="bi bi-trash"></i> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data-message">
                <i className="bi bi-inbox"></i>
                <p>Không có sách nào</p>
              </div>
            )}
          </div>

          {/* Manual Borrow Modal */}
          {showBorrowModal && (
            <div className="modal-overlay" onClick={closeBorrowModal}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Mượn Sách Trực Tiếp</h3>
                  <button
                    className="btn-close"
                    onClick={closeBorrowModal}
                    type="button"
                  >
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  {selectedBookForBorrow && (
                    <div className="book-info-section">
                      {selectedBookForBorrow.image && (
                        <div className="book-image-container">
                          <img
                            src={
                              selectedBookForBorrow.image.startsWith('/uploads')
                                ? `https://library-backend-env.eba-7et24bke.us-east-1.elasticbeanstalk.com${selectedBookForBorrow.image}`
                                : selectedBookForBorrow.image
                            }
                            alt={selectedBookForBorrow.title}
                            className="book-info-image-large"
                          />
                        </div>
                      )}
                      <div className="book-details-full">
                        <p>
                          <strong>Tên Sách:</strong> {selectedBookForBorrow.title}
                        </p>
                        <p>
                          <strong>Tác Giả:</strong> {selectedBookForBorrow.author}
                        </p>
                        <p>
                          <strong>Thể Loại:</strong> {selectedBookForBorrow.category}
                        </p>
                        <p>
                          <strong>Còn Lại:</strong>{' '}
                          <span className="available-count">
                            {selectedBookForBorrow.available} cuốn
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmitBorrow} className="borrow-form">
                    <div className="form-group">
                      <label htmlFor="cardNumber">Mã Thẻ Độc Giả *</label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={borrowFormData.cardNumber}
                        onChange={handleBorrowFormChange}
                        placeholder="VD: LIB-2026-D9PA"
                        required
                        disabled={borrowLoading}
                      />
                      <small className="form-hint">
                        Nhập mã thẻ độc giả (VD: LIB-2026-D9PA)
                      </small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="returnDate">Ngày Trả Sách *</label>
                      <input
                        type="date"
                        id="returnDate"
                        name="returnDate"
                        value={borrowFormData.returnDate}
                        onChange={handleBorrowFormChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        disabled={borrowLoading}
                      />
                      <small className="form-hint">
                        Chọn ngày trả sách (sau hôm nay)
                      </small>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={closeBorrowModal}
                        disabled={borrowLoading}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="btn-confirm"
                        disabled={borrowLoading}
                      >
                        {borrowLoading ? '⏳ Đang Xử Lý...' : '✓ Xác Nhận Mượn'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminBooksPage;
