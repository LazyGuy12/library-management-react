import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navigation from '../components/Navigation';
import bookService from '../services/bookService';
import reviewService from '../services/reviewService';
import API from '../services/axiosConfig';
import '../styles/home.css';

function HomePage() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });

  // Get user info
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'ADMIN';

  // Book detail modal
  const [detailBook, setDetailBook] = useState(null);

  // Review states
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, totalRatings: 0, distribution: {5:0,4:0,3:0,2:0,1:0} });
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPages, setReviewPages] = useState(0);
  const [reviewFilterStar, setReviewFilterStar] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [editingReview, setEditingReview] = useState(null); // existing review being edited

  // Cart state
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('borrowCart') || '[]');
    } catch { return []; }
  });
  const [borrowedBookIds, setBorrowedBookIds] = useState(new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewSectionRef = useRef(null);
  const shouldScrollToReview = useRef(false);

  useEffect(() => {
    fetchBooks();
    fetchBorrowedBookIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search]);

  // Handle reviewBook query param from borrow history
  useEffect(() => {
    const reviewBookId = searchParams.get('reviewBook');
    if (reviewBookId && books.length > 0) {
      shouldScrollToReview.current = true;
      const book = books.find(b => b._id === reviewBookId);
      if (book) {
        setDetailBook(book);
        setSearchParams({}, { replace: true });
      } else {
        // Book not in current page, fetch it directly
        bookService.getBookById(reviewBookId).then(res => {
          if (res.data) {
            setDetailBook(res.data.book || res.data);
          }
          setSearchParams({}, { replace: true });
        }).catch(() => {
          setSearchParams({}, { replace: true });
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, books]);

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

  // Fetch review stats + reviews when detailBook changes
  const fetchReviewStats = useCallback(async (bookId) => {
    try {
      const res = await reviewService.getBookReviewStats(bookId);
      setReviewStats(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchReviews = useCallback(async (bookId, page = 1, star = 0) => {
    setReviewLoading(true);
    try {
      const params = { page, limit: 5 };
      if (star >= 1 && star <= 5) params.star = star;
      if (user?.id) params.currentUserId = user.id;
      const res = await reviewService.getBookReviews(bookId, params);
      setReviews(res.data.reviews || []);
      setReviewPages(res.data.pagination.pages);
    } catch { /* ignore */ }
    setReviewLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (detailBook) {
      setReviewPage(1);
      setReviewFilterStar(0);
      setShowReviewForm(false);
      setReviewScore(0);
      setReviewComment('');
      setCanReview(false);
      setEditingReview(null);
      fetchReviewStats(detailBook._id);
      fetchReviews(detailBook._id, 1, 0);
      // Check if user can review this book
      if (user?.id && !isAdmin) {
        reviewService.checkCanReview(detailBook._id).then(res => {
          setCanReview(res.data.canReview);
          setEditingReview(res.data.existingReview);
        }).catch(() => {});
      }
      // Scroll to review section only when coming from borrow history
      if (shouldScrollToReview.current) {
        shouldScrollToReview.current = false;
        setTimeout(() => {
          if (reviewSectionRef.current) {
            reviewSectionRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 300);
      }
    }
  }, [detailBook, fetchReviewStats, fetchReviews, user?.id, isAdmin]);

  useEffect(() => {
    if (detailBook) {
      fetchReviews(detailBook._id, reviewPage, reviewFilterStar);
    }
  }, [reviewPage, reviewFilterStar, detailBook, fetchReviews]);

  const handleSubmitReview = async () => {
    if (!reviewScore) return;
    setReviewSubmitting(true);
    try {
      const res = await reviewService.createReview(detailBook._id, { score: reviewScore, comment: reviewComment });
      // Update book in grid
      setBooks(prev => prev.map(b => b._id === detailBook._id ? { ...b, avgRating: res.data.avgRating, totalRatings: res.data.totalRatings } : b));
      setShowReviewForm(false);
      setReviewScore(0);
      setReviewComment('');
      setEditingReview(res.data.review);
      // Refresh reviews
      fetchReviewStats(detailBook._id);
      fetchReviews(detailBook._id, 1, reviewFilterStar);
      setReviewPage(1);
      alert('✅ ' + res.data.message);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi đánh giá'));
    }
    setReviewSubmitting(false);
  };

  const handleEditReview = () => {
    if (editingReview) {
      setReviewScore(editingReview.score);
      setReviewComment(editingReview.comment || '');
    }
    setShowReviewForm(true);
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ngày trước`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} tháng trước`;
    return `${Math.floor(months / 12)} năm trước`;
  };

  const getScoreLabel = (score) => {
    return ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'][score] || '';
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
                  {renderDisplayStars(reviewStats.avgRating || 0)}
                  <span className="rating-count">({reviewStats.totalRatings || 0} đánh giá)</span>
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

            {/* Review Section */}
            <div className="review-section" ref={reviewSectionRef}>
              <h3 className="review-section-title">Đánh giá {detailBook.title}</h3>

              {/* Review Summary */}
              <div className="review-summary">
                <div className="review-summary-left">
                  <div className="review-avg-score">
                    <span className="review-avg-number">{reviewStats.avgRating || 0}</span>
                    <span className="review-avg-max">/5</span>
                  </div>
                  <div className="review-avg-stars">
                    {renderDisplayStars(reviewStats.avgRating || 0)}
                  </div>
                  <p className="review-total-count">{reviewStats.totalRatings || 0} lượt đánh giá</p>
                  {!isAdmin && canReview && !editingReview && (
                    <button className="btn-write-review" onClick={handleEditReview}>
                      Viết đánh giá
                    </button>
                  )}
                </div>
                <div className="review-summary-right">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewStats.distribution?.[star] || 0;
                    const percent = reviewStats.totalRatings > 0 ? (count / reviewStats.totalRatings) * 100 : 0;
                    return (
                      <div key={star} className="review-bar-row">
                        <span className="review-bar-label">{star} <i className="bi bi-star-fill"></i></span>
                        <div className="review-bar-track">
                          <div className="review-bar-fill" style={{ width: `${percent}%`, background: star >= 4 ? '#e53935' : star === 3 ? '#ff9800' : '#bdbdbd' }}></div>
                        </div>
                        <span className="review-bar-count">{count} đánh giá</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Form */}
              {showReviewForm && (
                <div className="review-form">
                  <h4>{editingReview ? 'Sửa đánh giá của bạn' : 'Viết đánh giá của bạn'}</h4>
                  <div className="review-form-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i
                        key={star}
                        className={`bi ${star <= (reviewHover || reviewScore) ? 'bi-star-fill' : 'bi-star'} review-form-star`}
                        onClick={() => setReviewScore(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                      />
                    ))}
                    <span className="review-form-star-label">
                      {getScoreLabel(reviewHover || reviewScore) || 'Chọn số sao'}
                    </span>
                  </div>
                  <textarea
                    className="review-form-textarea"
                    placeholder="Chia sẻ nhận xét của bạn về cuốn sách này..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    maxLength={1000}
                    rows={4}
                  />
                  <div className="review-form-actions">
                    <button
                      className="btn-submit-review"
                      onClick={handleSubmitReview}
                      disabled={!reviewScore || reviewSubmitting}
                    >
                      {reviewSubmitting ? 'Đang gửi...' : (editingReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                    </button>
                    <button className="btn-cancel-review" onClick={() => { setShowReviewForm(false); setReviewScore(0); setReviewComment(''); }}>
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="review-filters">
                <span className="review-filter-label">Lọc đánh giá theo</span>
                <div className="review-filter-tabs">
                  <button
                    className={`review-filter-tab ${reviewFilterStar === 0 ? 'active' : ''}`}
                    onClick={() => { setReviewFilterStar(0); setReviewPage(1); }}
                  >
                    Tất cả
                  </button>
                  {[5, 4, 3, 2, 1].map(star => (
                    <button
                      key={star}
                      className={`review-filter-tab ${reviewFilterStar === star ? 'active' : ''}`}
                      onClick={() => { setReviewFilterStar(star); setReviewPage(1); }}
                    >
                      {star} sao
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="review-list">
                {reviewLoading ? (
                  <div className="review-loading"><div className="spinner"></div></div>
                ) : reviews.length > 0 ? (
                  reviews.map(review => (
                    <div key={review._id} className="review-item">
                      <div className="review-item-avatar">
                        {(review.user?.fullName || review.user?.email || '?')[0].toUpperCase()}
                      </div>
                      <div className="review-item-content">
                        <div className="review-item-header">
                          <span className="review-item-name">
                            {review.user?.fullName || review.user?.email || 'Ẩn danh'}
                            {review.isEdited && <span className="review-edited-badge"> (đã chỉnh sửa)</span>}
                          </span>
                          {user?.id && review.user?._id === user.id && canReview && (
                            <button className="btn-edit-review" onClick={handleEditReview} title="Sửa đánh giá">
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        </div>
                        <div className="review-item-rating">
                          <div className="stars-display">
                            {[1, 2, 3, 4, 5].map(i => (
                              <i key={i} className={`bi ${i <= review.score ? 'bi-star-fill' : 'bi-star'}`} />
                            ))}
                          </div>
                          <span className="review-item-label">{getScoreLabel(review.score)}</span>
                        </div>
                        {review.comment && <p className="review-item-comment">{review.comment}</p>}
                        <p className="review-item-time">
                          <i className="bi bi-clock"></i> Đánh giá đã đăng vào {getTimeAgo(review.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="review-empty">Chưa có đánh giá nào{reviewFilterStar > 0 ? ` ${reviewFilterStar} sao` : ''}.</p>
                )}
              </div>

              {/* Review Pagination */}
              {reviewPages > 1 && (
                <div className="review-pagination">
                  <button disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)}>
                    <i className="bi bi-chevron-left"></i> Trước
                  </button>
                  <span>Trang {reviewPage}/{reviewPages}</span>
                  <button disabled={reviewPage >= reviewPages} onClick={() => setReviewPage(p => p + 1)}>
                    Sau <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
