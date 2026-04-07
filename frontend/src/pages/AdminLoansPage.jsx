import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import loanService from '../services/loanService';
import '../styles/admin.css';

function AdminLoansPage() {
  const [loans, setLoans] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await loanService.getAllLoans({ limit: 100 });
      setLoans(response.data.loans || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi tải mượn sách:', err);
      setError('Không thể tải danh sách mượn sách.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickupLoan = async (loanId) => {
    if (!window.confirm('Xác nhận khách hàng đã lấy sách?')) return;
    try {
      const response = await loanService.pickupLoan(loanId);
      alert('✅ ' + response.data.message);
      fetchLoans();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi xác nhận lấy sách'));
    }
  };

  const handleReturnLoan = async (loanId) => {
    if (!window.confirm('Xác nhận khách hàng đã trả sách?')) return;
    try {
      const response = await loanService.returnBook(loanId);
      alert('✅ ' + response.data.message);
      fetchLoans();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Lỗi xác nhận trả sách'));
    }
  };

  const showDetails = (loan) => {
    setSelectedLoan(loan);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedLoan(null);
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

  // Filter loans by active tab
  const filteredLoans = loans.filter(loan => {
    if (activeTab === 'all') return true;
    return loan.status === activeTab;
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
            <button
              className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <i className="bi bi-list"></i> Tất Cả
            </button>
            <button
              className={`filter-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <i className="bi bi-hourglass"></i> Chờ Lấy Sách
            </button>
            <button
              className={`filter-btn ${activeTab === 'borrowed' ? 'active' : ''}`}
              onClick={() => setActiveTab('borrowed')}
            >
              <i className="bi bi-bag-check"></i> Đang Mượn
            </button>
            <button
              className={`filter-btn ${activeTab === 'returned' ? 'active' : ''}`}
              onClick={() => setActiveTab('returned')}
            >
              <i className="bi bi-check-circle"></i> Đã Trả
            </button>
            <button
              className={`filter-btn ${activeTab === 'overdue' ? 'active' : ''}`}
              onClick={() => setActiveTab('overdue')}
            >
              <i className="bi bi-exclamation-circle"></i> Quá Hạn
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
            {filteredLoans.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Người Mượn</th>
                    <th>Tên Sách</th>
                    <th>Ngày Mượn</th>
                    <th>Hạn Trả</th>
                    <th>Trạng Thái</th>
                    <th>Phạt</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map((loan) => (
                    <tr key={loan._id}>
                      <td className="font-bold">{loan.user?.fullName || 'N/A'}</td>
                      <td>{loan.book?.title || 'N/A'}</td>
                      <td>{formatDate(loan.borrowDate)}</td>
                      <td>{formatDate(loan.dueDate)}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(loan.status)}`}>
                          {getStatusText(loan.status)}
                        </span>
                      </td>
                      <td className="text-danger">
                        {loan.fine > 0 ? `${loan.fine.toLocaleString('vi-VN')}₫` : '-'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {/* Chờ Lấy Sách: Lấy Sách + Xem Chi Tiết */}
                          {loan.status === 'pending' && (
                            <>
                              <button
                                className="btn-pickup"
                                onClick={() => handlePickupLoan(loan._id)}
                                title="Xác nhận khách hàng đã lấy sách"
                              >
                                <i className="bi bi-box-seam"></i> Lấy Sách
                              </button>
                              <button
                                className="btn-details"
                                onClick={() => showDetails(loan)}
                              >
                                <i className="bi bi-eye"></i> Xem Chi Tiết
                              </button>
                            </>
                          )}

                          {/* Đang Mượn: Trả Sách + Xem Chi Tiết */}
                          {loan.status === 'borrowed' && (
                            <>
                              <button
                                className="btn-return"
                                onClick={() => handleReturnLoan(loan._id)}
                                title="Xác nhận khách hàng đã trả sách"
                              >
                                <i className="bi bi-arrow-return-left"></i> Trả Sách
                              </button>
                              <button
                                className="btn-details"
                                onClick={() => showDetails(loan)}
                              >
                                <i className="bi bi-eye"></i> Xem Chi Tiết
                              </button>
                            </>
                          )}

                          {/* Đã Trả: Xem Chi Tiết */}
                          {loan.status === 'returned' && (
                            <button
                              className="btn-details"
                              onClick={() => showDetails(loan)}
                            >
                              <i className="bi bi-eye"></i> Xem Chi Tiết
                            </button>
                          )}

                          {/* Quá Hạn: Trả Sách + Xem Chi Tiết */}
                          {loan.status === 'overdue' && (
                            <>
                              <button
                                className="btn-return"
                                onClick={() => handleReturnLoan(loan._id)}
                                title="Xác nhận khách hàng đã trả sách"
                              >
                                <i className="bi bi-arrow-return-left"></i> Trả Sách
                              </button>
                              <button
                                className="btn-details"
                                onClick={() => showDetails(loan)}
                              >
                                <i className="bi bi-eye"></i> Xem Chi Tiết
                              </button>
                            </>
                          )}
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
                <span className="stat-value">
                  {loans.filter((l) => l.status === 'pending').length}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-bag-check"></i>
              <div className="stat-info">
                <span className="stat-label">Đang Mượn</span>
                <span className="stat-value">
                  {loans.filter((l) => l.status === 'borrowed').length}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-check-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Đã Trả</span>
                <span className="stat-value">
                  {loans.filter((l) => l.status === 'returned').length}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <i className="bi bi-exclamation-circle"></i>
              <div className="stat-info">
                <span className="stat-label">Quá Hạn</span>
                <span className="stat-value">
                  {loans.filter((l) => l.status === 'overdue').length}
                </span>
              </div>
            </div>
          </div>

          {/* Details Modal */}
          {showDetailsModal && selectedLoan && (
            <div className="modal-overlay" onClick={closeDetailsModal}>
              <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Chi Tiết Phiếu Mượn</h2>
                  <button className="btn-close" onClick={closeDetailsModal} type="button">
                    ×
                  </button>
                </div>

                <div className="modal-body">
                  <div className="detail-row">
                    <strong>Người Mượn:</strong>
                    <span>{selectedLoan.user?.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Tên Sách:</strong>
                    <span>{selectedLoan.book?.title}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Tác Giả:</strong>
                    <span>{selectedLoan.book?.author}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Ngày Mượn:</strong>
                    <span>{formatDate(selectedLoan.borrowDate)}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Hạn Trả:</strong>
                    <span>{formatDate(selectedLoan.dueDate)}</span>
                  </div>
                  {selectedLoan.returnDate && (
                    <div className="detail-row">
                      <strong>Ngày Trả:</strong>
                      <span>{formatDate(selectedLoan.returnDate)}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <strong>Trạng Thái:</strong>
                    <span className={`status-badge ${getStatusColor(selectedLoan.status)}`}>
                      {getStatusText(selectedLoan.status)}
                    </span>
                  </div>
                  {selectedLoan.fine > 0 && (
                    <div className="detail-row">
                      <strong>Tiền Phạt:</strong>
                      <span className="fine-amount">
                        {selectedLoan.fine.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn-close-modal" onClick={closeDetailsModal}>
                    Đóng
                  </button>
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
