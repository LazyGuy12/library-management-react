import React from 'react';
import '../styles/library-card.css';

function LibraryCard({ user, card, cardStatus }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'danger';
      case 'SUSPENDED':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '● Đang hoạt động';
      case 'EXPIRED':
        return '● Hết hạn';
      case 'SUSPENDED':
        return '● Bị khóa';
      default:
        return '● Không xác định';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="library-card-wrapper">
      <div className="library-card">
        {/* Card Header */}
        <div className="card-header-section">
          <div className="card-header-info">
            <h6 className="card-label">Library Card</h6>
            <h5 className="card-fullname">{user?.fullName || 'N/A'}</h5>
          </div>
          <div className="card-qr-icon">
            <i className="bi bi-qr-code"></i>
          </div>
        </div>

        {/* Card ID */}
        <div className="card-id-section">
          <small className="card-id-label">CARD ID</small>
          <span className="card-id-number">{card?.cardNumber || 'LIB-XXXX-XXXX'}</span>
        </div>

        {/* Card Details */}
        <div className="card-details">
          <div className="detail-item">
            <span className="detail-label">MÃ Số SINH VIÊN</span>
            <span className="detail-value">{user?.mssv || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">HẠN DÙNG</span>
            <span className="detail-value">{formatDate(card?.expiryDate)}</span>
          </div>
        </div>

        {/* Divider */}
        <hr className="card-divider" />

        {/* Card Status */}
        <div className="card-status">
          <span className={`status-text status-${getStatusColor(cardStatus)}`}>
            {getStatusText(cardStatus)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LibraryCard;
