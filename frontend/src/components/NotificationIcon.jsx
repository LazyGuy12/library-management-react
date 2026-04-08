import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../services/notificationService';
import '../styles/notification-icon.css';

function NotificationIcon() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showList, setShowList] = useState(false);
  const notificationRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Lỗi tải số thông báo:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="notification-icon-container" ref={notificationRef}>
      <button
        className="nav-icon-btn"
        onClick={() => setShowList(!showList)}
        title="Thông báo"
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showList && (
        <NotificationListDropdown
          onClose={() => setShowList(false)}
          onNotificationUpdated={fetchUnreadCount}
        />
      )}
    </div>
  );
}

function NotificationListDropdown({ onClose, onNotificationUpdated }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getMyNotifications(1, 20);
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Lỗi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDeleteOne = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(n => n._id !== id));
      onNotificationUpdated();
    } catch (err) {
      console.error('Lỗi xóa thông báo:', err);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Bạn chắc chắn muốn xóa tất cả thông báo?')) {
      try {
        await notificationService.deleteAllNotifications();
        setNotifications([]);
        onNotificationUpdated();
      } catch (err) {
        console.error('Lỗi xóa tất cả thông báo:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-header">Thông báo ({notifications.length})</div>
      
      {loading ? (
        <div className="notification-loading">Đang tải...</div>
      ) : notifications.length > 0 ? (
        <>
          <div className="notification-items">
            {notifications.map((notification) => (
              <div key={notification._id} className="notification-item">
                <div className="notification-item-content">
                  <div className="notification-item-title">{notification.title}</div>
                  <div className="notification-item-message">{notification.message}</div>
                  <div className="notification-item-time">{formatDate(notification.createdAt)}</div>
                </div>
                <button
                  className="notification-item-remove"
                  onClick={() => handleDeleteOne(notification._id)}
                  title="Xóa"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="notification-actions">
            <button className="btn-delete-all" onClick={handleDeleteAll}>
              Xóa Tất Cả
            </button>
          </div>
        </>
      ) : (
        <div className="notification-empty">Không có thông báo</div>
      )}
    </div>
  );
}

export default NotificationIcon;
