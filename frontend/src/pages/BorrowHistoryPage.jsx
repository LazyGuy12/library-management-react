import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import borrowSlipService from '../services/borrowSlipService';
import '../styles/borrow-history.css';

function BorrowHistoryPage() {
  const [slips, setSlips] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    setPagination({ page: 1, limit: 10, total: 0, pages: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    fetchSlips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, status]);

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const response = await borrowSlipService.getMySlips(status, {
        page: pagination.page,
        limit: pagination.limit,
      });
      
      const slipsData = response.data?.slips || [];
      setSlips(slipsData);
      
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          page: response.data.pagination.page || 1,
          limit: response.data.pagination.limit || 10,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 1,
        }));
      }
      setError(null);
    } catch (err) {
      console.error('Fetch slips error:', err);
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

  const goToBookReview = (book) => {
    navigate('/?reviewBook=' + book._id);
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
                      <div className="detail-book-info">
                        <div className="detail-book-title">{book.title}</div>
                        <div className="detail-book-author">{book.author}</div>
                        {book.isbn && <div className="detail-book-isbn">ISBN: {book.isbn}</div>}
                      </div>
                      {selectedSlip.status === 'returned' && (
                        <button
                          className="btn-rate-book"
                          onClick={() => goToBookReview(book)}
                          title="Đánh giá sách này"
                        >
                          <i className="bi bi-star"></i> Đánh Giá
                        </button>
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
