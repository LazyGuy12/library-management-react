import React, { useState, useEffect, useCallback } from 'react';
import Navigation from '../components/Navigation';
import userService from '../services/userService';
import API from '../services/axiosConfig';
import '../styles/admin.css';

function AdminCardsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cardStatus, setCardStatus] = useState('');
  const [lockModal, setLockModal] = useState({ show: false, userId: null, fullName: null, reason: '' });
  const [unlockModal, setUnlockModal] = useState({ show: false, userId: null, fullName: null });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({
        status: cardStatus || undefined,
        limit: 10,
      });
      // Filter out admin users (they don't have library cards)
      const filteredUsers = (response.data.users || []).filter(user => user.role !== 'ADMIN');
      setUsers(filteredUsers);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
      setError('Không thể tải danh sách độc giả. Vui lòng kiểm tra backend.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [cardStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const handleLockClick = (userId, fullName) => {
    setLockModal({ show: true, userId, fullName, reason: '' });
  };

  const handleLockSubmit = async () => {
    if (!lockModal.reason.trim()) {
      alert('Vui lòng nhập lý do khóa thẻ!');
      return;
    }

    try {
      await API.put(`/cards/${lockModal.userId}/lock`, { reason: lockModal.reason });
      alert('✅ Khóa thẻ thành công!');
      setLockModal({ show: false, userId: null, fullName: null, reason: '' });
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Lỗi khóa thẻ:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCloseLockModal = () => {
    setLockModal({ show: false, userId: null, fullName: null, reason: '' });
  };

  const handleUnlockClick = (userId, fullName) => {
    setUnlockModal({ show: true, userId, fullName });
  };

  const handleUnlockSubmit = async () => {
    try {
      await API.put(`/cards/${unlockModal.userId}/unlock`);
      alert('✅ Mở khóa thẻ thành công!');
      setUnlockModal({ show: false, userId: null, fullName: null });
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error('Lỗi mở khóa thẻ:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCloseUnlockModal = () => {
    setUnlockModal({ show: false, userId: null, fullName: null });
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

          {/* Table with Actions */}
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
                    <th>Hành Động</th>
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
                      <td>
                        <div className="action-btn-group">
                          <button
                            className="action-btn lock-btn"
                            onClick={() => handleLockClick(user._id, user.fullName)}
                            title="Khóa thẻ"
                            disabled={user.card?.status === 'SUSPENDED'}
                          >
                            <i className="bi bi-lock"></i>
                          </button>
                          <button
                            className="action-btn unlock-btn"
                            onClick={() => handleUnlockClick(user._id, user.fullName)}
                            title="Mở khóa thẻ"
                            disabled={user.card?.status !== 'SUSPENDED'}
                          >
                            <i className="bi bi-unlock"></i>
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

      {/* Lock Modal */}
      {lockModal.show && (
        <div className="modal-overlay" onClick={handleCloseLockModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Khóa Thẻ Độc Giả</h2>
              <button className="modal-close" onClick={handleCloseLockModal}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-subtitle">
                Khóa thẻ của: <strong>{lockModal.fullName}</strong>
              </p>
              <label htmlFor="lock-reason">Lý do khóa thẻ:</label>
              <textarea
                id="lock-reason"
                className="form-textarea"
                value={lockModal.reason}
                onChange={(e) => setLockModal({ ...lockModal, reason: e.target.value })}
                placeholder="Nhập lý do khóa thẻ (bắt buộc)..."
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseLockModal}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={handleLockSubmit}>
                <i className="bi bi-lock"></i> Khóa Thẻ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {unlockModal.show && (
        <div className="modal-overlay" onClick={handleCloseUnlockModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mở Khóa Thẻ Độc Giả</h2>
              <button className="modal-close" onClick={handleCloseUnlockModal}>✕</button>
            </div>
            <div className="modal-body">
              <p className="modal-subtitle">
                Mở khóa thẻ của: <strong>{unlockModal.fullName}</strong>
              </p>
              <p style={{ color: '#666', marginTop: '1rem' }}>
                User sẽ nhận được thông báo: "Admin đã mở khóa thẻ cho bạn, giờ đây bạn có thể mượn sách"
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseUnlockModal}>
                Hủy
              </button>
              <button className="btn btn-success" onClick={handleUnlockSubmit}>
                <i className="bi bi-unlock"></i> Mở Khóa Thẻ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCardsPage;
