import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import bookService from '../services/bookService';
import API from '../services/axiosConfig';
import '../styles/home.css';

function HomePage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Get user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'ADMIN';

  // Rating state
  const [ratingModal, setRatingModal] = useState(null); // book object
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratedBookIds, setRatedBookIds] = useState(new Set());

  // Book detail modal
  const [detailBook, setDetailBook] = useState(null);

  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('borrowCart') || '[]');
    } catch { return []; }
  });
  const [borrowedBookIds, setBorrowedBookIds] = useState(new Set());

  useEffect(() => {
    fetchBooks();
    fetchReturnedBookIds();
    fetchBorrowedBookIds();
    fetchRatedBookIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search]);

  const fetchRatedBookIds = async () => {
    try {
      const res = await bookService.getMyRatings();
      setRatedBookIds(new Set(res.data.ratedBookIds || []));
    } catch {
      // Not critical
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await bookService.getBooks({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
      });
      const data = response.data;
      setBooks(data.books || []);
      setPagination({
        page: data.pagination.page,
        limit: data.pagination.limit,
        total: data.pagination.total,
        pages: data.pagination.pages,
      });
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách sách. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnedBookIds = async () => {
    try {
      const res = await API.get('/loans/user/history');
      // const loans = res.data.loans || [];
      // const ids = new Set(
      //   loans
      //     .filter(l => l.status === 'returned')
      //     .map(l => (l.book?._id || l.book)?.toString())
      // );
      // setReturnedBookIds(ids); // Can be used later if needed
    } catch {
      // Not critical - if fails, user just can't rate
    }
  };

  const fetchBorrowedBookIds = async () => {
    try {
      const res = await API.get('/loans/user/history');
      const loans = res.data.loans || [];
      const ids = new Set(
        loans
          .filter(l => ['borrowed', 'overdue'].includes(l.status))
          .map(l => (l.book?._id || l.book)?.toString())
      );
      setBorrowedBookIds(ids);
    } catch {
      // Not critical
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPagination(p => ({ ...p, page: 1 }));
  };

  const handleBorrow = (book) => {
    if (borrowedBookIds.has(book._id?.toString())) {
      alert('⚠️ Bạn đã mượn cuốn sách này rồi! Vui lòng trả sách cũ trước.');
      return;
    }
    
    // Check cart limit (max 5 books)
    if (cart.length >= 5) {
      alert('⚠️ Bạn chỉ có thể mượn tối đa 5 cuốn sách cùng một lúc!');
      return;
    }

    setCart(prev => {
      const updated = [...prev, { _id: book._id, title: book.title, author: book.author }];
      localStorage.setItem('borrowCart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (bookId) => {
    setCart(prev => {
      const updated = prev.filter(b => b._id !== bookId);
      localStorage.setItem('borrowCart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('borrowCart');
  };

  const handleSubmitRating = async () => {
    if (!selectedStars || selectedStars === 0) return;
    setRatingLoading(true);
    try {
      const res = await bookService.rateBook(ratingModal._id, selectedStars);
      // Update book in list with new avgRating
      setBooks(prev =>
        prev.map(b =>
          b._id === ratingModal._id
            ? { ...b, avgRating: res.data.avgRating, totalRatings: res.data.totalRatings }
            : b
        )
      );
      setRatedBookIds(prev => new Set([...prev, ratingModal._id]));
      alert('✅ ' + res.data.message);
      setRatingModal(null);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi đánh giá'));
    } finally {
      setRatingLoading(false);
    }
  };

  const renderDisplayStars = (avg = 0) => {
    const fullStars = Math.floor(avg);
    const hasHalf = avg - fullStars >= 0.25;
    return (
      <div className="stars-display">
        {[1, 2, 3, 4, 5].map(i => (
          <i
            key={i}
            className={`bi ${i <= fullStars ? 'bi-star-fill' : (i === fullStars + 1 && hasHalf ? 'bi-star-half' : 'bi-star')}`}
          />
        ))}
      </div>
    );
  };

  if (loading && books.length === 0) {
    return (
      <div className="home-page">
        <Navigation />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải sách...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <Navigation 
        searchValue={search} 
        onSearch={handleSearch}
        cartCount={cart.length}
        cartItems={cart}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
      />

      <main className="home-content">
        <div className="container">

          {error && (
            <div className="alert alert-error">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Books Grid */}
          <div className="books-grid">
            {books.length > 0 ? books.map(book => (
              <div key={book._id} className="book-card">
                {/* Cover Image */}
                <div className="book-image-container" onClick={() => setDetailBook(book)} style={{ cursor: 'pointer' }}>
                  <img
                    src={
                      book.image
                        ? (book.image.startsWith('/uploads')
                          ? `https://library-backend-env.eba-7et24bke.us-east-1.elasticbeanstalk.com${book.image}`
                          : book.image)
                        : 'https://via.placeholder.com/250x350/dddddd/999999?text=No+Image'
                    }
                    alt={book.title}
                    className="book-image"
                  />
                  {!isAdmin && (
                    <button
                      className={`borrow-btn-overlay ${book.available <= 0 || borrowedBookIds.has(book._id?.toString()) || cart.length >= 5 ? 'unavailable' : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleBorrow(book); }}
                      disabled={book.available <= 0 || borrowedBookIds.has(book._id?.toString()) || cart.length >= 5}
                      title={
                        cart.length >= 5 
                          ? 'Giỏ sách đã đủ 5 cuốn' 
                          : (book.available > 0 
                            ? (borrowedBookIds.has(book._id?.toString()) ? 'Đã mượn' : 'Mượn sách') 
                            : 'Hết sách'
                          )
                      }
                    >
                      <i className={`bi ${book.available > 0 && cart.length < 5 ? 'bi-bag-plus' : 'bi-x-circle'}`}></i>
                    </button>
                  )}
                </div>

                {/* Book Info */}
                <div className="book-details">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>

                  {/* Stars Row */}
                  <div className="book-rating-row">
                    {renderDisplayStars(book.avgRating || 0)}
                    {book.totalRatings > 0 && (
                      <span className="rating-count">({book.totalRatings})</span>
                    )}
                  </div>

                  
                </div>
              </div>
            )) : (
              <div className="no-books-message">
                <i className="bi bi-inbox"></i>
                <p>Thư viện hiện chưa có sách nào.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <i className="bi bi-chevron-left"></i> Trước
              </button>
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`pagination-dot ${pagination.page === i + 1 ? 'active' : ''}`}
                  onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                />
              ))}
              <button
                className="pagination-btn"
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Sau <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Rating Modal */}
      {ratingModal && (
        <div className="modal-overlay" onClick={() => setRatingModal(null)}>
          <div className="rating-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setRatingModal(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <h3 className="modal-title">Đánh giá sách</h3>
            <p className="modal-book-name">{ratingModal.title}</p>
            <p className="modal-author">{ratingModal.author}</p>

            <div className="modal-stars">
              {[1, 2, 3, 4, 5].map(star => (
                <i
                  key={star}
                  className={`bi ${star <= (hoverStars || selectedStars) ? 'bi-star-fill' : 'bi-star'} modal-star`}
                  onClick={() => setSelectedStars(star)}
                  onMouseEnter={() => setHoverStars(star)}
                  onMouseLeave={() => setHoverStars(0)}
                  style={{ color: star <= (hoverStars || selectedStars) ? '#f5a623' : '#ccc' }}
                />
              ))}
            </div>

            <p className="modal-star-label">
              {['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'][hoverStars || selectedStars] || 'Chọn số sao'}
            </p>

            <div className="modal-actions">
              <button
                className="btn-submit-rate"
                onClick={handleSubmitRating}
                disabled={!selectedStars || ratingLoading}
              >
                {ratingLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button className="btn-cancel-rate" onClick={() => setRatingModal(null)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {detailBook && (
        <div className="modal-overlay" onClick={() => setDetailBook(null)}>
          <div className="book-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDetailBook(null)}>
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="book-detail-layout">
              <div className="book-detail-image">
                <img
                  src={
                    detailBook.image
                      ? (detailBook.image.startsWith('/uploads')
                        ? `https://library-backend-env.eba-7et24bke.us-east-1.elasticbeanstalk.com${detailBook.image}`
                        : detailBook.image)
                      : 'https://via.placeholder.com/250x350/dddddd/999999?text=No+Image'
                  }
                  alt={detailBook.title}
                />
              </div>
              <div className="book-detail-info">
                <h2>{detailBook.title}</h2>
                <p className="detail-author"><strong>Tác giả:</strong> {detailBook.author}</p>
                {detailBook.category && <p><strong>Thể loại:</strong> {detailBook.category}</p>}
                {detailBook.isbn && <p><strong>ISBN:</strong> {detailBook.isbn}</p>}
                {detailBook.location && <p><strong>Vị trí:</strong> {detailBook.location}</p>}
                <p><strong>Còn lại:</strong> {detailBook.available}/{detailBook.quantity} cuốn</p>
                <div className="book-detail-rating">
                  {renderDisplayStars(detailBook.avgRating || 0)}
                  <span className="rating-count">({detailBook.totalRatings || 0} đánh giá)</span>
                </div>
                {detailBook.description && (
                  <div className="book-detail-desc">
                    <strong>Mô tả:</strong>
                    <p>{detailBook.description}</p>
                  </div>
                )}
                {!isAdmin && (
                  <button
                    className="btn-borrow-detail"
                    onClick={() => { handleBorrow(detailBook); setDetailBook(null); }}
                    disabled={detailBook.available <= 0 || borrowedBookIds.has(detailBook._id?.toString())}
                  >
                    <i className="bi bi-bag-plus"></i> {borrowedBookIds.has(detailBook._id?.toString()) ? 'Đã Mượn' : 'Mượn Sách'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
