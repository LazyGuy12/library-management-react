import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navigation from '../components/Navigation';
import borrowSlipService from '../services/borrowSlipService';
import '../styles/borrow-schedule.css';

function BorrowSchedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems = location.state?.cartItems || [];

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleConfirmBorrow = async () => {
    if (!pickupDate) {
      setError('Vui lòng chọn ngày lên thư viện');
      return;
    }
    if (!returnDate) {
      setError('Vui lòng chọn ngày trả sách');
      return;
    }
    if (returnDate <= pickupDate) {
      setError('Ngày trả sách phải sau ngày lên thư viện');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tính số ngày mượn từ returnDate
      const pickupDateObj = new Date(pickupDate);
      const returnDateObj = new Date(returnDate);
      const daysToBorrow = Math.ceil((returnDateObj - pickupDateObj) / (1000 * 60 * 60 * 24));

      // Tạo phiếu mượn sách (1 phiếu chứa tất cả sách trong giỏ)
      const bookIds = cartItems.map(book => book._id);
      const response = await borrowSlipService.createSlip(bookIds, daysToBorrow);

      alert(`✅ ${response.data.message}\nLên thư viện: ${pickupDate} lúc ${pickupTime}\nNgày trả: ${returnDate}\n\nTrạng thái: Chờ Lấy Sách\nAdmin sẽ xác nhận khi bạn lên lấy.`);
      localStorage.removeItem('borrowCart');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đặt lịch mươn sách');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="borrow-page">
        <Navigation />
        <main className="borrow-content">
          <div className="container">
            <div className="empty-cart-message">
              <i className="bi bi-inbox"></i>
              <p>Giỏ sách trống. Vui lòng chọn sách để mượn!</p>
              <button className="btn-back" onClick={() => navigate('/')}>
                Quay Lại Trang Chủ
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="borrow-page">
      <Navigation />

      <main className="borrow-content">
        <div className="container">
          <h1>Đặt Lịch Mượn Sách</h1>

          <div className="borrow-layout">
            {/* Left: Cart Items */}
            <div className="borrow-cart">
              <h2>Sách Cần Mượn ({cartItems.length})</h2>
              <div className="cart-items-list">
                {cartItems.map((book) => (
                  <div key={book._id} className="cart-item-summary">
                    <div className="item-info">
                      <div className="item-title">{book.title}</div>
                      <div className="item-author">{book.author}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Schedule Form */}
            <div className="borrow-form-section">
              <h2>Chọn Thời Gian Lên Thư Viện</h2>

              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="pickup-date">Ngày Lên Thư Viện *</label>
                <input
                  id="pickup-date"
                  type="date"
                  min={today}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="pickup-time">Giờ Lên Thư Viện *</label>
                <select
                  id="pickup-time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="form-input"
                >
                  <option value="08:00">08:00 - Mở cửa</option>
                  <option value="09:00">09:00</option>
                  <option value="10:00">10:00</option>
                  <option value="11:00">11:00</option>
                  <option value="13:00">13:00</option>
                  <option value="14:00">14:00</option>
                  <option value="15:00">15:00</option>
                  <option value="16:00">16:00</option>
                  <option value="17:00">17:00 - Gần đóng cửa</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="return-date">Ngày Trả Sách *</label>
                <input
                  id="return-date"
                  type="date"
                  min={pickupDate || today}
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <p className="form-hint">
                <i className="bi bi-info-circle"></i>
                Giờ làm việc: 08:00 - 17:00 (Thứ Hai - Thứ Sáu)
              </p>

              <div className="form-actions">
                <button
                  className="btn-confirm"
                  onClick={handleConfirmBorrow}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Xác Nhận Mượn'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BorrowSchedulePage;
