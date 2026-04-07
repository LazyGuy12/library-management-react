import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import userService from '../services/userService';
import '../styles/admin.css';

function AdminCardsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardStatus, setCardStatus] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [cardStatus]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({
        status: cardStatus || undefined,
        limit: 50,
      });
      setUsers(response.data.users || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
      setError('Không thể tải danh sách độc giả. Vui lòng kiểm tra backend.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getCardStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'EXPIRED':
        return 'status-expired';
      case 'SUSPENDED':
        return 'status-suspended';
      default:
        return 'status-unknown';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
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
              <i className="bi bi-credit-card"></i> Quản Lý Thẻ Thư Viện
            </h1>
          </div>

          {/* Filter */}
          <div className="filter-section">
            <button
              className={`filter-btn ${cardStatus === '' ? 'active' : ''}`}
              onClick={() => setCardStatus('')}
            >
              <i className="bi bi-list"></i> Tất Cả
            </button>
            <button
              className={`filter-btn ${cardStatus === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setCardStatus('ACTIVE')}
            >
              <i className="bi bi-check-circle"></i> Hoạt Động
            </button>
            <button
              className={`filter-btn ${cardStatus === 'EXPIRED' ? 'active' : ''}`}
              onClick={() => setCardStatus('EXPIRED')}
            >
              <i className="bi bi-x-circle"></i> Hết Hạn
            </button>
            <button
              className={`filter-btn ${cardStatus === 'SUSPENDED' ? 'active' : ''}`}
              onClick={() => setCardStatus('SUSPENDED')}
            >
              <i className="bi bi-exclamation-circle"></i> Tạm Khóa
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-warning">
              <i className="bi bi-info-circle"></i>
              {error}
            </div>
          )}

          {/* Table */}
          <div className="admin-table">
            {users.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Họ Tên</th>
                    <th>Tên Đăng Nhập</th>
                    <th>Mã Thẻ</th>
                    <th>Ngày Cấp</th>
                    <th>Hết Hạn</th>
                    <th>Trạng Thái</th>
                    <th>Lượt Gia Hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="font-bold">{user.fullName || 'N/A'}</td>
                      <td>{user.mssv}</td>
                      <td className="mono">{user.card?.cardNumber || 'N/A'}</td>
                      <td>{formatDate(user.card?.issuedDate)}</td>
                      <td>{formatDate(user.card?.expiryDate)}</td>
                      <td>
                        <span className={`status-badge ${getCardStatusColor(user.card?.status)}`}>
                          {user.card?.status === 'ACTIVE'
                            ? 'Hoạt Động'
                            : user.card?.status === 'EXPIRED'
                            ? 'Hết Hạn'
                            : user.card?.status === 'SUSPENDED'
                            ? 'Tạm Khóa'
                            : 'Không Xác Định'}
                        </span>
                      </td>
                      <td className="text-center">{user.card?.renewalCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-data-message">
                <i className="bi bi-inbox"></i>
                <p>Không có dữ liệu thẻ thư viện</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="admin-stats">
            <div className="stat-card">
              <i className="bi bi-credit-card"></i>
              <div className="stat-info">
                <span className="stat-label">Tổng Thẻ</span>
                <span className="stat-value">{users.length}</span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-check-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Hoạt Động</span>
                <span className="stat-value">
                  {users.filter((u) => u.card?.status === 'ACTIVE').length}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-x-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Hết Hạn</span>
                <span className="stat-value">
                  {users.filter((u) => u.card?.status === 'EXPIRED').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminCardsPage;
