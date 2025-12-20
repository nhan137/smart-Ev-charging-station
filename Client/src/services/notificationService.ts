import api from './api';

export const notificationService = {
  // Get unread notifications (for modal after login)
  getUnreadNotifications: async () => {
    try {
      const response = await api.get('/notifications/unread');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông báo');
    }
  },

  // Get notification history with filters
  getNotificationHistory: async (filters?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/notifications?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử thông báo');
    }
  },

  // Mark notification as read
  markAsRead: async (notificationId: number) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể đánh dấu đã đọc');
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể đánh dấu tất cả đã đọc');
    }
  }
};
