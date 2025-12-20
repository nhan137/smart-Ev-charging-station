import api from './api';

export const managerService = {
  // Get manager's stations
  getManagerStations: async (filters?: { status?: string }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      
      const response = await api.get(`/manager/stations?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách trạm');
    }
  },

  // Get station detail (for manager)
  getStationDetail: async (stationId: number) => {
    try {
      const response = await api.get(`/manager/stations/${stationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin trạm');
    }
  },

  // Update station status
  updateStationStatus: async (stationId: number, status: string) => {
    try {
      const response = await api.put(`/manager/stations/${stationId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái trạm');
    }
  },

  // Get station bookings (for View & Confirm Schedules)
  getStationBookings: async (stationId: number, filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/manager/stations/${stationId}/bookings?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách đặt lịch');
    }
  },

  // Confirm booking (generate check-in code)
  confirmBooking: async (bookingId: number) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/confirm`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xác nhận đặt lịch');
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId: number) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể hủy đặt lịch');
    }
  },

  // Get booking history for all stations managed by manager
  getBookingHistory: async (filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.start_date) params.append('from_date', filters.start_date);
      if (filters?.end_date) params.append('to_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/manager/bookings/history?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử đặt lịch');
    }
  },

  // ========== Dashboard API ==========
  getDashboardOverview: async () => {
    try {
      const response = await api.get('/manager/dashboard');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin dashboard');
    }
  },

  // ========== Report APIs ==========
  // Create report (Manager gửi báo cáo sự cố lên Admin)
  createReport: async (data: {
    station_id: number;
    title: string;
    description: string;
    images?: File[];
  }) => {
    try {
      const formData = new FormData();
      formData.append('station_id', data.station_id.toString());
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      const response = await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể gửi báo cáo');
    }
  },

  // Get manager inbox (báo cáo từ User)
  getManagerInbox: async (filters?: {
    station_id?: number;
    status?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.station_id) params.append('station_id', filters.station_id.toString());
      if (filters?.status) params.append('status', filters.status);
      
      const response = await api.get(`/reports/manager/inbox?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải hộp thư báo cáo');
    }
  },

  // Get manager report history (báo cáo đã gửi lên Admin)
  getManagerHistory: async () => {
    try {
      const response = await api.get('/reports/manager/history');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử báo cáo');
    }
  },

  // Resolve report (Manager xử lý xong báo cáo từ User)
  resolveReport: async (reportId: number) => {
    try {
      const response = await api.put(`/reports/${reportId}/manager/resolve`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xử lý báo cáo');
    }
  },

  // Escalate report (Manager chuyển báo cáo lên Admin)
  escalateReport: async (reportId: number) => {
    try {
      const response = await api.put(`/reports/${reportId}/manager/escalate`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể chuyển báo cáo lên Admin');
    }
  },

  // ========== Notification APIs ==========
  // Get notifications
  getNotifications: async (filters?: {
    type?: string;
    is_read?: boolean;
    status?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      // Backend sử dụng 'status' (unread/read), không phải 'is_read'
      if (filters?.status) {
        params.append('status', filters.status);
      } else if (filters?.is_read !== undefined) {
        // Map is_read to status
        params.append('status', filters.is_read ? 'read' : 'unread');
      }
      
      const response = await api.get(`/notifications?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông báo');
    }
  },

  // Mark notification as read
  markNotificationAsRead: async (notificationId: number) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể đánh dấu đã đọc');
    }
  },

  // Mark all notifications as read
  markAllNotificationsAsRead: async () => {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể đánh dấu tất cả đã đọc');
    }
  },

  // Delete notification
  deleteNotification: async (notificationId: number) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xóa thông báo');
    }
  }
};

