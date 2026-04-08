import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import borrowSlipService from '../services/borrowSlipService';
import '../styles/admin.css';

function AdminLoansPage() {
  const [slips, setSlips] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchSlips();
  }, []);

  const fetchSlips = async () => {
    try {
      setLoading(true);
      const response = await borrowSlipService.getAllSlips({ limit: 10 });
      setSlips(response.data.slips || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải phiếu mượn:', err);
      setError('Không thể tải danh sách phiếu mượn.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickupSlip = async (slipId) => {
    if (!window.confirm('Xác nhận khách hàng đã lấy sách?')) return;
    try {
      const response = await borrowSlipService.pickupSlip(slipId);
      alert('✅ ' + response.data.message);
      fetchSlips();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi xác nhận lấy sách'));
    }
  };

  const handleReturnSlip = async (slipId) => {
    if (!window.confirm('Xác nhận khách hàng đã trả sách?')) return;
    try {
      const response = await borrowSlipService.returnSlip(slipId);
      alert('✅ ' + response.data.message);
      fetchSlips();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi xác nhận trả sách'));
    }
  };

  const showDetails = async (slip) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      borrowed: 'status-borrowed',
      returned: 'status-returned',
      overdue: 'status-overdue'
    };
    return colors[status] || 'status-unknown';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Chờ Lấy Sách',
      borrowed: 'Đang Mượn',
      returned: 'Đã Trả',
      overdue: 'Quá Hạn'
    };
    return texts[status] || 'Không Xác Định';
  };

  const filteredSlips = slips.filter(slip => {
    if (activeTab === 'all') return true;
    return slip.status === activeTab;
  });

  if (loading) {
    return (
      <div className="admin-page">
        <Navigation />
        <main className="admin-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        </main>
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
              <i className="bi bi-list-check"></i> Quản Lý Mượn Sách
            </h1>
          </div>

          {/* Tabs */}
          <div className="filter-section">
            <button className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
              <i className="bi bi-list"></i> Tất Cả
            </button>
            <button className={`filter-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
              <i className="bi bi-hourglass"></i> Chờ Lấy Sách
            </button>
            <button className={`filter-btn ${activeTab === 'borrowed' ? 'active' : ''}`} onClick={() => setActiveTab('borrowed')}>
              <i className="bi bi-bag-check"></i> Đang Mượn
            </button>
            <button className={`filter-btn ${activeTab === 'returned' ? 'active' : ''}`} onClick={() => setActiveTab('returned')}>
              <i className="bi bi-check-circle"></i> Đã Trả
            </button>
            <button className={`filter-btn ${activeTab === 'overdue' ? 'active' : ''}`} onClick={() => setActiveTab('overdue')}>
              <i className="bi bi-exclamation-circle"></i> Quá Hạn
            </button>
          </div>

          {error && (
            <div className="alert alert-error">
              <i className="bi bi-exclamation-circle"></i> {error}
            </div>
          )}

          {/* Table */}
          <div className="admin-table">
            {filteredSlips.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Người Mượn</th>
                    <th>Mã Phiếu Mượn</th>
                    <th>Ngày Mượn</th>
                    <th>Hạn Trả</th>
                    <th>Trạng Thái</th>
                    <th>Phạt</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlips.map((slip) => (
                    <tr key={slip._id}>
                      <td className="font-bold">{slip.user?.fullName || 'N/A'}</td>
                      <td><span className="slip-code">{slip.slipCode}</span></td>
                      <td>{formatDate(slip.borrowDate)}</td>
                      <td>{formatDate(slip.dueDate)}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(slip.status)}`}>
                          {getStatusText(slip.status)}
                        </span>
                      </td>
                      <td className="text-danger">
                        {slip.fine > 0 ? `${slip.fine.toLocaleString('vi-VN')}₫` : '-'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {slip.status === 'pending' && (
                            <button className="btn-pickup" onClick={() => handlePickupSlip(slip._id)} title="Xác nhận lấy sách">
                              <i className="bi bi-box-seam"></i> Lấy Sách
                            </button>
                          )}
                          {(slip.status === 'borrowed' || slip.status === 'overdue') && (
                            <button className="btn-return" onClick={() => handleReturnSlip(slip._id)} title="Xác nhận trả sách">
                              <i className="bi bi-arrow-return-left"></i> Trả Sách
                            </button>
                          )}
                          <button className="btn-details" onClick={() => showDetails(slip)}>
                            <i className="bi bi-eye"></i> Xem Chi Tiết
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
                <p>Không có phiếu mượn nào</p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="admin-stats">
            <div className="stat-card">
              <i className="bi bi-hourglass"></i>
              <div className="stat-info">
                <span className="stat-label">Chờ Lấy Sách</span>
                <span className="stat-value">{slips.filter(s => s.status === 'pending').length}</span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-bag-check"></i>
              <div className="stat-info">
                <span className="stat-label">Đang Mượn</span>
                <span className="stat-value">{slips.filter(s => s.status === 'borrowed').length}</span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-check-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Đã Trả</span>
                <span className="stat-value">{slips.filter(s => s.status === 'returned').length}</span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-exclamation-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Quá Hạn</span>
                <span className="stat-value">{slips.filter(s => s.status === 'overdue').length}</span>
              </div>
            </div>
          </div>

          {/* Details Modal */}
          {showDetailsModal && selectedSlip && (
            <div className="modal-overlay" onClick={closeDetailsModal}>
              <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Chi Tiết Phiếu Mượn</h2>
                  <button className="btn-close" onClick={closeDetailsModal} type="button">×</button>
                </div>

                <div className="modal-body">
                  <div className="detail-row">
                    <strong>Mã Phiếu Mượn:</strong>
                    <span className="slip-code">{selectedSlip.slipCode}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Người Mượn:</strong>
                    <span>{selectedSlip.user?.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Ngày Mượn:</strong>
                    <span>{formatDate(selectedSlip.borrowDate)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Hạn Trả:</strong>
                    <span>{formatDate(selectedSlip.dueDate)}</span>
                  </div>
                  {selectedSlip.returnDate && (
                    <div className="detail-row">
                      <strong>Ngày Trả:</strong>
                      <span>{formatDate(selectedSlip.returnDate)}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <strong>Trạng Thái:</strong>
                    <span className={`status-badge ${getStatusColor(selectedSlip.status)}`}>
                      {getStatusText(selectedSlip.status)}
                    </span>
                  </div>
                  {selectedSlip.fine > 0 && (
                    <div className="detail-row">
                      <strong>Tiền Phạt:</strong>
                      <span className="fine-amount">{selectedSlip.fine.toLocaleString('vi-VN')} VNĐ</span>
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
      </main>
    </div>
  );
}

export default AdminLoansPage;
