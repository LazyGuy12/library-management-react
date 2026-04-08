import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import LibraryCard from '../components/LibraryCard';
import userService from '../services/userService';
import '../styles/profile.css';

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [card, setCard] = useState(null);
  const [cardStatus, setCardStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profileResponse = await userService.getProfile();
      const userData = profileResponse.data.user;
      const cardData = profileResponse.data.card;

      setUser(userData);
      setCard(cardData);
      setFormData({
        fullName: userData.fullName,
        email: userData.email,
      });

      const cardStatusResponse = await userService.getCardStatus(userData._id);
      setCardStatus(cardStatusResponse.data.currentStatus);

      setError(null);
    } catch (err) {
      console.error('Lỗi tải profile:', err);
      setError('Không thể tải thông tin profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await userService.updateProfile(formData);
      alert('✅ Cập nhật thông tin thành công!');
      setIsEditing(false);
      fetchUserProfile();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi cập nhật'));
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName,
      email: user?.email,
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <Navigation />
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Navigation />
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navigation />

      <main className="profile-content">
        <div className="container">
          {/* Header */}
          <div className="header-section">
            <h1 className="page-title">
              <i className="bi bi-person-vcard"></i> Thông Tin Cá Nhân
            </h1>
            <p className="page-subtitle">Quản lý thông tin tài khoản của bạn</p>
          </div>

          <div className="profile-grid">
            {/* Left Column - Library Card */}
            <div className="profile-card-column">
              <div className="card-section">
                <h2 className="section-title">Thẻ Độc Giả</h2>
                <LibraryCard 
                  user={user} 
                  card={card}
                  cardStatus={cardStatus}
                />
                <button 
                  className="refresh-btn"
                  onClick={fetchUserProfile}
                  title="Cập nhật thông tin"
                >
                  <i className="bi bi-arrow-clockwise"></i> Cập Nhật
                </button>
              </div>
            </div>

            {/* Right Column - User Info */}
            <div className="profile-info-column">
              {/* Personal Info Card */}
              <div className="info-section">
                <div className="section-header">
                  <h2 className="section-title">Thông Tin Tài Khoản</h2>
                  {!isEditing && (
                    <button 
                      className="edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="bi bi-pencil"></i> Chỉnh Sửa
                    </button>
                  )}
                </div>

                <div className="user-info-card">
                  {isEditing ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="fullName">Họ và Tên</label>
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="form-input"
                        />
                      </div>

                      <div className="form-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={handleSaveProfile}
                        >
                          <i className="bi bi-check-lg"></i> Lưu
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={handleCancel}
                        >
                          <i className="bi bi-x-lg"></i> Hủy
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="info-item">
                        <label className="info-label">Họ và Tên</label>
                        <p className="info-value">{user?.fullName || 'N/A'}</p>
                      </div>

                      <div className="info-item">
                        <label className="info-label">Mã Số Sinh Viên</label>
                        <p className="info-value">{user?.mssv || 'N/A'}</p>
                      </div>

                      <div className="info-item">
                        <label className="info-label">Email</label>
                        <p className="info-value">{user?.email || 'N/A'}</p>
                      </div>

                      <div className="info-item">
                        <label className="info-label">Vai Trò</label>
                        <p className="info-value">
                          {user?.role === 'ADMIN' ? (
                            <span className="badge badge-admin">Quản Trị Viên</span>
                          ) : (
                            <span className="badge badge-user">Độc Giả</span>
                          )}
                        </p>
                      </div>

                      <div className="info-item">
                        <label className="info-label">Ngày Tạo Tài Khoản</label>
                        <p className="info-value">
                          {user?.createdAt ? 
                            new Date(user.createdAt).toLocaleDateString('vi-VN') 
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Library Card Info */}
              {card && (
                <div className="info-section">
                  <h2 className="section-title">Thông Tin Thẻ Độc Giả</h2>
                  <div className="user-info-card">
                    <div className="info-item">
                      <label className="info-label">Số Thẻ</label>
                      <p className="info-value">{card.cardNumber || 'N/A'}</p>
                    </div>

                    <div className="info-item">
                      <label className="info-label">Ngày Cấp</label>
                      <p className="info-value">
                        {card.issuedDate ? 
                          new Date(card.issuedDate).toLocaleDateString('vi-VN') 
                          : 'N/A'
                        }
                      </p>
                    </div>

                    <div className="info-item">
                      <label className="info-label">Hạn Dùng</label>
                      <p className="info-value">
                        {card.expiryDate ? 
                          new Date(card.expiryDate).toLocaleDateString('vi-VN') 
                          : 'N/A'
                        }
                      </p>
                    </div>

                    <div className="info-item">
                      <label className="info-label">Trạng Thái</label>
                      <p className={`info-value status-badge status-${cardStatus.toLowerCase()}`}>
                        {cardStatus === 'ACTIVE' && '✓ Đang hoạt động'}
                        {cardStatus === 'EXPIRED' && '✗ Hết hạn'}
                        {cardStatus === 'SUSPENDED' && '! Bị khóa'}
                      </p>
                    </div>

                    <div className="info-item">
                      <label className="info-label">Số Lần Gia Hạn</label>
                      <p className="info-value">{card.renewalCount || 0} lần</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
