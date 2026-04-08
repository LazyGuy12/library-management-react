import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import borrowSlipService from '../services/borrowSlipService';
import bookService from '../services/bookService';
import '../styles/borrow-history.css';

function BorrowHistoryPage() {
  const [slips, setSlips] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingBook, setRatingBook] = useState(null);
  const [selectedStars, setSelectedStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratedBookIds, setRatedBookIds] = useState(new Set());

  useEffect(() => {
    fetchSlips();
    fetchRatedBookIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchRatedBookIds = async () => {
    try {
      const res = await bookService.getMyRatings();
      setRatedBookIds(new Set(res.data.ratedBookIds || []));
    } catch {
      // Not critical
    }
  };

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const response = await borrowSlipService.getMySlips(status || undefined);
      setSlips(response.data.slips || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải lịch sử mượn:', err);
      setError('Không thể tải lịch sử mượn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = async (slip) => {
    try {
      const response = await borrowSlipService.getSlipById(slip._id);
      setSelectedSlip(response.data.slip);
      setShowDetailsModal(true);
    } catch (err) {
      alert('❌ Lỗi tải chi tiết phiếu mượn');
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedSlip(null);
  };

  const openRatingModal = (book) => {
    setRatingBook(book);
    setSelectedStars(0);
    setHoverStars(0);
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (selectedStars === 0) {
      alert('Vui lòng chọn số sao!');
      return;
    }
    setRatingLoading(true);
    try {
      const response = await bookService.rateBook(ratingBook._id, selectedStars);
      alert('✅ ' + response.data.message);
      setRatedBookIds(prev => new Set([...prev, ratingBook._id]));
      setShowRatingModal(false);
      setRatingBook(null);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi đánh giá'));
    } finally {
      setRatingLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'borrowed': return 'status-borrowed';
      case 'returned': return 'status-returned';
      case 'overdue': return 'status-overdue';
      default: return 'status-unknown';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ Lấy Sách';
      case 'borrowed': return 'Đang Mượn';
      case 'returned': return 'Đã Trả';
      case 'overdue': return 'Quá Hạn';
      default: return 'Không Xác Định';
    }
  };

  if (loading) {
    return (
      <div className="borrow-history-page">
        <Navigation />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="borrow-history-page">
      <Navigation />

      <main className="borrow-history-content">
        <div className="container">
          {/* Header */}
          <div className="header-section">
            <h1 className="page-title">
              <i className="bi bi-clock-history"></i> Lịch Sử Mượn Sách
            </h1>
            <p className="page-subtitle">Quản lý các phiếu mượn sách của bạn</p>
          </div>

          {/* Filter Buttons */}
          <div className="filter-section">
            <button className={`filter-btn ${status === '' ? 'active' : ''}`} onClick={() => setStatus('')}>
              <i className="bi bi-list"></i> Tất Cả
            </button>
            <button className={`filter-btn ${status === 'pending' ? 'active' : ''}`} onClick={() => setStatus('pending')}>
              <i className="bi bi-hourglass"></i> Chờ Lấy Sách
            </button>
            <button className={`filter-btn ${status === 'borrowed' ? 'active' : ''}`} onClick={() => setStatus('borrowed')}>
              <i className="bi bi-bag-check"></i> Đang Mượn
            </button>
            <button className={`filter-btn ${status === 'returned' ? 'active' : ''}`} onClick={() => setStatus('returned')}>
              <i className="bi bi-check-circle"></i> Đã Trả
            </button>
            <button className={`filter-btn ${status === 'overdue' ? 'active' : ''}`} onClick={() => setStatus('overdue')}>
              <i className="bi bi-exclamation-circle"></i> Quá Hạn
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-error">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Slips Table */}
          <div className="loans-section">
            {slips.length > 0 ? (
              <div className="loans-table">
                <table>
                  <thead>
                    <tr>
                      <th>Mã Phiếu Mượn</th>
                      <th>Ngày Mượn</th>
                      <th>Hạn Trả</th>
                      <th>Ngày Trả</th>
                      <th>Trạng Thái</th>
                      <th>Phạt</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slips.map((slip) => (
                      <tr key={slip._id}>
                        <td><span className="slip-code">{slip.slipCode}</span></td>
                        <td>{formatDate(slip.borrowDate)}</td>
                        <td>{formatDate(slip.dueDate)}</td>
                        <td>{slip.returnDate ? formatDate(slip.returnDate) : '-'}</td>
                        <td>
                          <span className={`status-badge ${getStatusColor(slip.status)}`}>
                            {getStatusText(slip.status)}
                          </span>
                        </td>
                        <td className="fine-amount">
                          {slip.fine > 0 ? (
                            <span className="fine-text">{slip.fine.toLocaleString('vi-VN')}₫</span>
                          ) : '-'}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-details" onClick={() => openDetailsModal(slip)}>
                              <i className="bi bi-eye"></i> Xem Chi Tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-loans-message">
                <i className="bi bi-inbox"></i>
                <p>Bạn chưa mượn sách nào. Hãy mượn sách từ trang chủ!</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {slips.length > 0 && (
            <div className="summary-section">
              <div className="summary-card">
                <i className="bi bi-hourglass"></i>
                <div className="summary-info">
                  <span className="summary-label">Chờ Lấy Sách</span>
                  <span className="summary-value">{slips.filter(s => s.status === 'pending').length}</span>
                </div>
              </div>
              <div className="summary-card">
                <i className="bi bi-bag-check"></i>
                <div className="summary-info">
                  <span className="summary-label">Đang Mượn</span>
                  <span className="summary-value">{slips.filter(s => s.status === 'borrowed').length}</span>
                </div>
              </div>
              <div className="summary-card">
                <i className="bi bi-check-circle"></i>
                <div className="summary-info">
                  <span className="summary-label">Đã Trả</span>
                  <span className="summary-value">{slips.filter(s => s.status === 'returned').length}</span>
                </div>
              </div>
              <div className="summary-card">
                <i className="bi bi-exclamation-circle"></i>
                <div className="summary-info">
                  <span className="summary-label">Quá Hạn</span>
                  <span className="summary-value">{slips.filter(s => s.status === 'overdue').length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && ratingBook && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowRatingModal(false)}>
          <div className="modal-content rating-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đánh Giá Sách</h2>
              <button className="modal-close" onClick={() => setShowRatingModal(false)}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="rating-book-info">
                <p className="rating-book-title">{ratingBook.title}</p>
                <p className="rating-book-author">{ratingBook.author}</p>
              </div>

              <div className="rating-section">
                <label>Bạn đánh giá sách này bao nhiêu sao?</label>
                <div className="stars-picker">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`bi ${star <= (hoverStars || selectedStars) ? 'bi-star-fill' : 'bi-star'}`}
                      onClick={() => setSelectedStars(star)}
                      onMouseEnter={() => setHoverStars(star)}
                      onMouseLeave={() => setHoverStars(0)}
                      style={{
                        fontSize: '2.5rem',
                        cursor: 'pointer',
                        color: star <= (hoverStars || selectedStars) ? '#ffc107' : '#ddd',
                        transition: 'color 0.2s ease',
                        margin: '0 0.4rem'
                      }}
                    />
                  ))}
                </div>
                {selectedStars > 0 && (
                  <p className="rating-selected">Bạn chọn {selectedStars} sao</p>
                )}
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={() => setShowRatingModal(false)} disabled={ratingLoading}>
                  Hủy
                </button>
                <button
                  className="btn-confirm"
                  onClick={handleSubmitRating}
                  disabled={ratingLoading || selectedStars === 0}
                >
                  {ratingLoading ? '⏳ Đang Xử Lý...' : '✓ Gửi Đánh Giá'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSlip && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi Tiết Phiếu Mượn Sách</h2>
              <button className="modal-close" onClick={closeDetailsModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span className="detail-label">Mã Phiếu Mượn:</span>
                <span className="detail-value slip-code">{selectedSlip.slipCode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ngày Mượn:</span>
                <span className="detail-value">{formatDate(selectedSlip.borrowDate)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Hạn Trả:</span>
                <span className="detail-value">{formatDate(selectedSlip.dueDate)}</span>
              </div>
              {selectedSlip.returnDate && (
                <div className="detail-row">
                  <span className="detail-label">Ngày Trả:</span>
                  <span className="detail-value">{formatDate(selectedSlip.returnDate)}</span>
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Trạng Thái:</span>
                <span className={`detail-value status-badge ${getStatusColor(selectedSlip.status)}`}>
                  {getStatusText(selectedSlip.status)}
                </span>
              </div>
              {selectedSlip.fine > 0 && (
                <div className="detail-row highlight">
                  <span className="detail-label">Tiền Phạt:</span>
                  <span className="detail-value fine-amount">{selectedSlip.fine.toLocaleString('vi-VN')}₫</span>
                </div>
              )}

              {/* Danh sách sách mượn */}
              <div className="detail-books-section">
                <h3>Danh Sách Sách Mượn ({selectedSlip.books?.length || 0} cuốn)</h3>
                <div className="detail-books-list">
                  {selectedSlip.books?.map((book, index) => (
                    <div key={book._id} className="detail-book-item">
                      <span className="detail-book-index">{index + 1}</span>
                      <div className="detail-book-info">
                        <div className="detail-book-title">{book.title}</div>
                        <div className="detail-book-author">{book.author}</div>
                        {book.isbn && <div className="detail-book-isbn">ISBN: {book.isbn}</div>}
                      </div>
                      {selectedSlip.status === 'returned' && (
                        ratedBookIds.has(book._id) ? (
                          <button
                            className="btn-rate-book btn-rated"
                            disabled
                            title="Đã đánh giá sách này"
                          >
                            <i className="bi bi-star-fill"></i> Đã Đánh Giá
                          </button>
                        ) : (
                          <button
                            className="btn-rate-book"
                            onClick={() => openRatingModal(book)}
                            title="Đánh giá sách này"
                          >
                            <i className="bi bi-star"></i> Đánh Giá
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-close-modal" onClick={closeDetailsModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BorrowHistoryPage;
