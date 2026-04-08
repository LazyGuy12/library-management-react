import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import fineService from '../services/fineService';
import '../styles/admin.css';

function AdminFinesPage() {
  const [fines, setFines] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFines = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fineService.getAllFines({
        status: status || undefined,
        limit: 10,
      });
      setFines(response.data.fines || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải phiếu phạt:', err);
      setError('Không thể tải danh sách phiếu phạt.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const handleConfirmPayment = async (fineId) => {
    if (!window.confirm('Xác nhận thanh toán phiếu phạt này?')) return;
    try {
      await fineService.confirmPayment(fineId);
      alert('✅ Xác nhận thanh toán thành công!');
      fetchFines();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi'));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'PAID':
        return 'status-paid';
      default:
        return 'status-unknown';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'LATE_FEE':
        return '❌ Phạt Trả Trễ';
      case 'DAMAGE':
        return '📖 Sách Hỏng';
      case 'LOST':
        return '🚨 Sách Mất';
      default:
        return type;
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

  const totalPending = fines
    .filter((f) => f.status === 'PENDING')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="admin-page">
      <Navigation />

      <main className="admin-content">
        <div className="container">
          {/* Header */}
          <div className="admin-header">
            <h1 className="page-title">
              <i className="bi bi-exclamation-triangle"></i> Quản Lý Phiếu Phạt
            </h1>
          </div>

          {/* Alert */}
          {totalPending > 0 && (
            <div className="alert alert-warning">
              <i className="bi bi-exclamation-triangle"></i>
              Tổng chưa thanh toán:{' '}
              <strong>{totalPending.toLocaleString('vi-VN')}₫</strong>
            </div>
          )}

          {fines.length === 0 && (
            <div className="alert alert-success">
              <i className="bi bi-check-circle"></i>
              Không có phiếu phạt nào
            </div>
          )}

          {/* Filter */}
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
              <i className="bi bi-hourglass-split"></i> Chưa Thanh Toán
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

          {/* Table */}
          <div className="admin-table">
            {fines.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Người Dùng</th>
                    <th>Loại Phạt</th>
                    <th>Lý Do</th>
                    <th>Số Tiền</th>
                    <th>Ngày Tạo</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {fines.map((fine) => (
                    <tr
                      key={fine._id}
                      className={fine.status === 'PENDING' ? 'row-pending' : ''}
                    >
                      <td className="font-bold">{fine.user?.fullName || 'N/A'}</td>
                      <td>
                        <span className="fine-type">{getTypeText(fine.type)}</span>
                      </td>
                      <td>{fine.reason || 'N/A'}</td>
                      <td className="text-danger font-bold">
                        {fine.amount.toLocaleString('vi-VN')}₫
                      </td>
                      <td>{formatDate(fine.createdAt)}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(fine.status)}`}>
                          {fine.status === 'PENDING' ? 'Chưa Thanh Toán' : 'Đã Thanh Toán'}
                        </span>
                      </td>
                      <td>
                        {fine.status === 'PENDING' && (
                          <button
                            className="btn-success"
                            onClick={() => handleConfirmPayment(fine._id)}
                          >
                            <i className="bi bi-check"></i> Xác Nhận
                          </button>
                        )}
                        {fine.status !== 'PENDING' && <span className="text-muted">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data-message">
                <i className="bi bi-inbox"></i>
                <p>Không có phiếu phạt nào</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="admin-stats">
            <div className="stat-card">
              <i className="bi bi-exclamation-triangle"></i>
              <div className="stat-info">
                <span className="stat-label">Chưa Thanh Toán</span>
                <span className="stat-value">
                  {fines.filter((f) => f.status === 'PENDING').length}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-check-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Đã Thanh Toán</span>
                <span className="stat-value">
                  {fines.filter((f) => f.status === 'PAID').length}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-cash"></i>
              <div className="stat-info">
                <span className="stat-label">Tổng Chưa TT</span>
                <span className="stat-value">
                  {totalPending.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminFinesPage;
