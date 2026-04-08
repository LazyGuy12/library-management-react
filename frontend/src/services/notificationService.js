import API from './axiosConfig';

const notificationService = {
  // Lấy danh sách thông báo của user
  getMyNotifications: (page = 1, limit = 20) =>
    API.get('/notifications', { params: { page, limit } }),

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: () =>
    API.get('/notifications/unread-count'),

  // Lấy chi tiết một thông báo (và đánh dấu đã đọc)
  getNotificationDetail: (id) =>
    API.get(`/notifications/${id}`),

  // Đánh dấu thông báo là đã đọc
  markAsRead: (id) =>
    API.put(`/notifications/${id}/read`),

  // Xóa một thông báo
  deleteNotification: (id) =>
    API.delete(`/notifications/${id}`),

  // Xóa tất cả thông báo
  deleteAllNotifications: () =>
    API.delete('/notifications'),
};

export default notificationService;
