import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import fineService from '../services/fineService';
import '../styles/fines.css';

function FinesPage() {
  const [fines, setFines] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalFine, setTotalFine] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fineService.getMyFines(status || undefined, {
        page: pagination.page,
        limit: pagination.limit,
      });
      const finesList = response.data.fines || [];
      setFines(finesList);
      
      // Handle pagination data
      if (response.data.pagination) {
        setPagination({
          page: response.data.pagination.page || 1,
          limit: response.data.pagination.limit || 10,
          total: response.data.pagination.total || 0,
          pages: response.data.pagination.pages || 1,
        });
      }
      
      // Calculate total
      const total = finesList
        .filter((fine) => fine.status === 'PENDING')
        .reduce((sum, fine) => sum + fine.amount, 0);
      setTotalFine(total);  
      
      setError(null);
    } catch (err) {
      console.error('Lỗi tải phiếu phạt:', err);
      setError('Không thể tải phiếu phạt. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [status, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatMoney = (amount) => {
    return amount.toLocaleString('vi-VN');
  };

  const getStatusColor = (status) => {
    return status === 'PENDING' ? 'status-pending' : 'status-paid';
  };

  const getStatusText = (status) => {
    return status === 'PENDING' ? 'Chưa Thanh Toán' : 'Đã Thanh Toán';
  };

  const getFineTypeText = (type) => {
    switch (type) {
      case 'LATE_FEE':
        return 'Phạt Trả Trễ';
      case 'DAMAGE':
        return 'Sách Hỏng';
      case 'LOST':
        return 'Sách Mất';
      default:
        return 'Khác';
    }
  };

  if (loading) {
    return (
      <div className="fines-page">
        <Navigation />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fines-page">
      <Navigation />

      <main className="fines-content">
        <div className="container">
          {/* Header */}
          <div className="header-section">
            <h1 className="page-title">
              <i className="bi bi-card-checklist"></i> Phiếu Phạt
            </h1>
            <p className="page-subtitle">Quản lý các khoản phạt của bạn</p>
          </div>

          {/* Total Fine Alert */}
          {totalFine > 0 && (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle"></i>
              <div className="alert-content">
                <strong>Bạn có {formatMoney(totalFine)}₫ chưa thanh toán</strong>
                <p>Vui lòng thanh toán để tránh bị khóa thẻ</p>
              </div>
            </div>
          )}

          {totalFine === 0 && fines.length > 0 && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle"></i>
              <div className="alert-content">
                <strong>✓ Bạn không có khoản phạt nào</strong>
                <p>Thẻ độc giả của bạn đang ở trạng thái bình thường</p>
              </div>
            </div>
          )}

          {/* Filter Buttons */}
          <div className="filter-section">
            <button
              className={`filter-btn ${status === '' ? 'active' : ''}`}
              onClick={() => setStatus('')}
            >
              <i className="bi bi-list"></i> Tất Cả
            </button>
            <button
              className={`filter-btn ${status === 'PENDING' ? 'active' : ''}`}
              onClick={() => setStatus('PENDING')}
            >
              <i className="bi bi-clock"></i> Chưa Thanh Toán
            </button>
            <button
              className={`filter-btn ${status === 'PAID' ? 'active' : ''}`}
              onClick={() => setStatus('PAID')}
            >
              <i className="bi bi-check-circle"></i> Đã Thanh Toán
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <i className="bi bi-exclamation-circle"></i>
              {error}
            </div>
          )}

          {/* Fines Table */}
          <div className="fines-section">
            {fines.length > 0 ? (
              <div className="fines-table">
                <table>
                  <thead>
                    <tr>
                      <th>Loại Phạt</th>
                      <th>Lý Do</th>
                      <th>Số Tiền</th>
                      <th>Ngày Tạo</th>
                      <th>Trạng Thái</th>
                      <th>Ngày Thanh Toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fines.map((fine) => (
                      <tr key={fine._id} className={fine.status === 'PENDING' ? 'pending-row' : ''}>
                        <td>
                          <span className="fine-type">{getFineTypeText(fine.fineType)}</span>
                        </td>
                        <td>{fine.reason || 'N/A'}</td>
                        <td className="fine-amount">
                          <strong>{formatMoney(fine.amount)}₫</strong>
                        </td>
                        <td>{formatDate(fine.createdDate)}</td>
                        <td>
                          <span className={`status-badge ${getStatusColor(fine.status)}`}>
                            {getStatusText(fine.status)}
                          </span>
                        </td>
                        <td>{fine.paidDate ? formatDate(fine.paidDate) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="no-fines-message">
                <i className="bi bi-inbox"></i>
                <p>Không có phiếu phạt nào cần thanh toán.</p>
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

          {/* Total Summary */}
          {fines.length > 0 && (
            <div className="summary-section">
              <div className="summary-card pending">
                <i className="bi bi-clock"></i>
                <div className="summary-info">
                  <span className="summary-label">Chưa Thanh Toán</span>
                  <span className="summary-value">
                    {formatMoney(totalFine)}₫
                  </span>
                </div>
              </div>
              <div className="summary-card">
                <i className="bi bi-list-check"></i>
                <div className="summary-info">
                  <span className="summary-label">Tổng Phiếu Phạt</span>
                  <span className="summary-value">{fines.length}</span>
                </div>
              </div>
              <div className="summary-card">
                <i className="bi bi-check-circle"></i>
                <div className="summary-info">
                  <span className="summary-label">Đã Thanh Toán</span>
                  <span className="summary-value">
                    {fines.filter((f) => f.status === 'PAID').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FinesPage;
