import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';
import '../styles/navigation.css';

function Navigation({ 
  searchValue = '', 
  onSearch = null,
  cartCount = 0,
  cartItems = [],
  onRemoveFromCart = null,
  onClearCart = null
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userMenuRef = useRef(null);
  const menuRef = useRef(null);
  const cartRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenuDropdown(false);
      }
      if (cartRef.current && !cartRef.current.contains(e.target)) {
        setShowCartDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    setShowUserDropdown(false);
    setShowMenuDropdown(false);
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="navbar">
      {/* Full dark header */}
      <div className="nav-header">
        {/* Logo */}
        <div className="logo-section" onClick={() => navigate('/')}>
          <span className="logo-text">Ngũ Quỷ</span>
        </div>

        {/* Search Bar */}
        <div className="header-search"> 
          <input
            type="text"
            placeholder="Tìm kiếm sách..."
            className="search-input"
            value={searchValue}
            onChange={onSearch}
            onKeyPress={(e) => e.key === 'Enter' && onSearch?.(e)}
          />
          <button className="search-btn" onClick={onSearch}>
            <i className="bi bi-search"></i>
          </button>
        </div>

        {/* Right Icons */}
        <div className="nav-right">
          {/* Notification Icon */}
          <NotificationIcon />

          {/* Cart Icon */}
          <div className="nav-cart-wrap" ref={cartRef}>
            <button 
              className={`nav-icon-btn ${showCartDropdown ? 'active' : ''}`} 
              title="Giỏ sách"
              onClick={() => { setShowCartDropdown(v => !v); setShowUserDropdown(false); setShowMenuDropdown(false); }}
            >
              <i className="bi bi-cart3"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>

            {showCartDropdown && (
              <div className="cart-dropdown">
                <div className="cart-header">Giỏ Sách ({cartCount})</div>
                {cartItems.length > 0 ? (
                  <>
                    <div className="cart-items">
                      {cartItems.map(item => (
                        <div key={item._id} className="cart-item">
                          <div className="cart-item-info">
                            <div className="cart-item-title">{item.title}</div>
                            <div className="cart-item-author">{item.author}</div>
                          </div>
                          <button 
                            className="cart-item-remove"
                            onClick={() => onRemoveFromCart?.(item._id)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="cart-actions">
                      <button 
                        className="btn-checkout"
                        onClick={() => navigate('/borrow-schedule', { state: { cartItems } })}
                      >
                        Xác Nhận Mượn
                      </button>
                      <button className="btn-clear-cart" onClick={() => onClearCart?.()}>Xóa Tất Cả</button>
                    </div>
                  </>
                ) : (
                  <div className="cart-empty">Giỏ sách trống</div>
                )}
              </div>
            )}
          </div>

          {/* Hamburger Menu Dropdown */}
          <div className="nav-menu-wrap" ref={menuRef}>
            <button
              className={`nav-icon-btn ${showMenuDropdown ? 'active' : ''}`}
              title="Menu"
              onClick={() => { setShowMenuDropdown(v => !v); setShowUserDropdown(false); }}
            >
              <i className="bi bi-list"></i>
            </button>

            {showMenuDropdown && (
              <div className="menu-dropdown">
                {isAdmin && (
                  <>
                    <div className="menu-dropdown-section">Quản Trị</div>
                    <button
                      className={`menu-dropdown-item ${isActive('/admin/books') ? 'active' : ''}`}
                      onClick={() => handleNavigate('/admin/books')}
                    >
                      <i className="bi bi-book"></i>
                      <span>Quản Lý Sách</span>
                    </button>
                    <button
                      className={`menu-dropdown-item ${isActive('/admin/loans') ? 'active' : ''}`}
                      onClick={() => handleNavigate('/admin/loans')}
                    >
                      <i className="bi bi-journal-check"></i>
                      <span>Quản Lý Mượn</span>
                    </button>
                    <button
                      className={`menu-dropdown-item ${isActive('/admin/cards') ? 'active' : ''}`}
                      onClick={() => handleNavigate('/admin/cards')}
                    >
                      <i className="bi bi-people"></i>
                      <span>Quản Lý Độc Giả</span>
                    </button>
                    <button
                      className={`menu-dropdown-item ${isActive('/admin/fines') ? 'active' : ''}`}
                      onClick={() => handleNavigate('/admin/fines')}
                    >
                      <i className="bi bi-exclamation-triangle"></i>
                      <span>Quản Lý Phạt</span>
                    </button>
                    <div className="menu-dropdown-divider"></div>
                  </>
                )}
                <div className="menu-dropdown-section">Điều Hướng</div>
                <button className="menu-dropdown-item" onClick={() => handleNavigate('/')}>
                  <i className="bi bi-house"></i>
                  <span>Trang Chủ</span>
                </button>
                <button className="menu-dropdown-item" onClick={() => handleNavigate('/borrow-history')}>
                  <i className="bi bi-clock-history"></i>
                  <span>Lịch Sử Mượn</span>
                </button>
                <button className="menu-dropdown-item" onClick={() => handleNavigate('/fines')}>
                  <i className="bi bi-card-checklist"></i>
                  <span>Phiếu Phạt</span>
                </button>
              </div>
            )}
          </div>

          {/* User Avatar Dropdown */}
          <div className="user-menu" ref={userMenuRef}>
            <div
              className="user-avatar"
              onClick={() => { setShowUserDropdown(v => !v); setShowMenuDropdown(false); }}
              title={user?.mssv || 'User'}
            >
              <i className="bi bi-person-fill"></i>
            </div>

            {showUserDropdown && (
              <div className="user-dropdown">
                <div className="dropdown-user-info">
                  <i className="bi bi-person-circle"></i>
                  <span>{user?.mssv || 'User'}</span>
                </div>
                <div className="dropdown-divider"></div>
                <button
                  className={`dropdown-item ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => handleNavigate('/profile')}
                >
                  <i className="bi bi-person-vcard"></i>
                  <span>Thông Tin Cá Nhân</span>
                </button>
                {user?.role !== 'ADMIN' && (
                  <>
                    <button
                      className={`dropdown-item ${isActive('/borrow-history') ? 'active' : ''}`}
                      onClick={() => handleNavigate('/borrow-history')}
                    >
                      <i className="bi bi-clock-history"></i>
                      <span>Lịch Sử Mượn</span>
                    </button>
                    <button
                      className={`dropdown-item ${isActive('/fines') ? 'active' : ''}`}
                      onClick={() => handleNavigate('/fines')}
                    >
                      <i className="bi bi-card-checklist"></i>
                      <span>Phiếu Phạt</span>
                    </button>
                  </>
                )}
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Đăng Xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
