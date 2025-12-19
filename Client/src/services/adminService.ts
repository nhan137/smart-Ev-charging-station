import api from './api';

export const adminService = {
  // ============================================
  // DASHBOARD APIs
  // ============================================
  
  /**
   * Get dashboard overview statistics
   * GET /api/admin/dashboard/overview?type=month|year
   */
  getDashboardOverview: async (type: 'month' | 'year' = 'month') => {
    try {
      const response = await api.get('/admin/dashboard/overview', {
        params: { type }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê dashboard');
    }
  },

  /**
   * Get dashboard highlights
   * GET /api/admin/dashboard/highlights
   */
  getDashboardHighlights: async () => {
    try {
      const response = await api.get('/admin/dashboard/highlights');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê nổi bật');
    }
  },

  /**
   * Get revenue chart data
   * GET /api/admin/dashboard/charts/revenue
   */
  getRevenueChart: async () => {
    try {
      const response = await api.get('/admin/dashboard/charts/revenue');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải dữ liệu biểu đồ doanh thu');
    }
  },

  /**
   * Get station types chart data
   * GET /api/admin/dashboard/charts/station-types
   */
  getStationTypesChart: async () => {
    try {
      const response = await api.get('/admin/dashboard/charts/station-types');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải dữ liệu biểu đồ loại trạm');
    }
  },

  /**
   * Get recent activities
   * GET /api/admin/dashboard/recent-activities
   */
  getRecentActivities: async () => {
    try {
      const response = await api.get('/admin/dashboard/recent-activities');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải hoạt động gần đây');
    }
  },

  // ============================================
  // USER MANAGEMENT APIs
  // ============================================

  /**
   * Get user statistics
   * GET /api/admin/users/stats
   */
  getUserStats: async () => {
    try {
      const response = await api.get('/admin/users/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê người dùng');
    }
  },

  /**
   * Get all users with filters
   * GET /api/admin/users?role_id=&status=&search=&page=&limit=
   */
  getUsers: async (params?: {
    role_id?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách người dùng');
    }
  },

  /**
   * Get user by ID
   * GET /api/admin/users/:user_id
   */
  getUserById: async (userId: number) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin người dùng');
    }
  },

  /**
   * Create new user
   * POST /api/admin/users
   */
  createUser: async (data: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role_id: number;
  }) => {
    try {
      const response = await api.post('/admin/users', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo người dùng');
    }
  },

  /**
   * Update user
   * PUT /api/admin/users/:user_id
   */
  updateUser: async (userId: number, data: {
    full_name?: string;
    email?: string;
    phone?: string;
    role_id?: number;
  }) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  },

  /**
   * Update user status (lock/unlock)
   * PUT /api/admin/users/:user_id/status
   */
  updateUserStatus: async (userId: number, status: 'active' | 'locked') => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái người dùng');
    }
  },

  /**
   * Delete user
   * DELETE /api/admin/users/:user_id
   */
  deleteUser: async (userId: number) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xóa người dùng');
    }
  },

  // ============================================
  // STATION MANAGEMENT APIs
  // ============================================

  /**
   * Get station statistics
   * GET /api/admin/stations/stats
   */
  getStationStats: async () => {
    try {
      const response = await api.get('/admin/stations/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê trạm sạc');
    }
  },

  /**
   * Get all stations with filters
   * GET /api/admin/stations?status=&type=&search=&page=&limit=
   */
  getStations: async (params?: {
    status?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/admin/stations', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách trạm sạc');
    }
  },

  /**
   * Get station by ID
   * GET /api/admin/stations/:station_id
   */
  getStationById: async (stationId: number) => {
    try {
      const response = await api.get(`/admin/stations/${stationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin trạm sạc');
    }
  },

  /**
   * Create new station
   * POST /api/admin/stations
   */
  createStation: async (data: any) => {
    try {
      const response = await api.post('/admin/stations', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo trạm sạc');
    }
  },

  /**
   * Update station
   * PUT /api/admin/stations/:station_id
   */
  updateStation: async (stationId: number, data: any) => {
    try {
      const response = await api.put(`/admin/stations/${stationId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạm sạc');
    }
  },

  /**
   * Delete station
   * DELETE /api/admin/stations/:station_id
   */
  deleteStation: async (stationId: number) => {
    try {
      const response = await api.delete(`/admin/stations/${stationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xóa trạm sạc');
    }
  },

  // ============================================
  // BOOKING MANAGEMENT APIs
  // ============================================

  /**
   * Get booking statistics
   * GET /api/admin/bookings/stats
   */
  getBookingStats: async () => {
    try {
      const response = await api.get('/admin/bookings/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê đặt lịch');
    }
  },

  /**
   * Get all bookings with filters
   * GET /api/admin/bookings?status=&station_id=&search=&startDate=&endDate=&page=&limit=
   */
  getBookings: async (params?: {
    status?: string;
    station_id?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/admin/bookings', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách đặt lịch');
    }
  },

  /**
   * Get booking by ID
   * GET /api/admin/bookings/:booking_id
   */
  getBookingById: async (bookingId: number) => {
    try {
      const response = await api.get(`/admin/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin đặt lịch');
    }
  },

  /**
   * Confirm booking
   * PUT /api/admin/bookings/:booking_id/confirm
   */
  confirmBooking: async (bookingId: number) => {
    try {
      const response = await api.put(`/admin/bookings/${bookingId}/confirm`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xác nhận đặt lịch');
    }
  },

  /**
   * Cancel booking
   * PUT /api/admin/bookings/:booking_id/cancel
   */
  cancelBooking: async (bookingId: number) => {
    try {
      const response = await api.put(`/admin/bookings/${bookingId}/cancel`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể hủy đặt lịch');
    }
  },

  // ============================================
  // PAYMENT MANAGEMENT APIs
  // ============================================

  /**
   * Get payment statistics
   * GET /api/admin/payments/stats
   */
  getPaymentStats: async () => {
    try {
      const response = await api.get('/admin/payments/stats');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thống kê thanh toán');
    }
  },

  /**
   * Get all payments with filters
   * GET /api/admin/payments?status=&method=&search=&startDate=&endDate=&page=&limit=
   */
  getPayments: async (params?: {
    status?: string;
    method?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/admin/payments', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách thanh toán');
    }
  },

  /**
   * Get payment by ID
   * GET /api/admin/payments/:payment_id
   */
  getPaymentById: async (paymentId: number) => {
    try {
      const response = await api.get(`/admin/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin thanh toán');
    }
  },

  /**
   * Export payments to Excel/CSV
   * GET /api/admin/payments/export?status=&method=&startDate=&endDate=
   */
  exportPayments: async (params?: {
    status?: string;
    method?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const response = await api.get('/admin/payments/export', {
        params,
        responseType: 'blob' // Important for file download
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xuất file thanh toán');
    }
  },

  // ============================================
  // NOTIFICATION APIs
  // ============================================

  /**
   * Send notification
   * POST /api/admin/notifications
   */
  sendNotification: async (data: {
    title: string;
    message: string;
    type: string;
    recipients: 'all' | number[];
  }) => {
    try {
      const response = await api.post('/admin/notifications', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể gửi thông báo');
    }
  },

  /**
   * Get notification history
   * GET /api/admin/notifications/history?page=&limit=
   */
  getNotificationHistory: async (params?: {
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/admin/notifications/history', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử thông báo');
    }
  },

  // ============================================
  // REPORT APIs
  // ============================================

  /**
   * Get reports for admin
   * GET /api/reports/admin?status=&page=&limit=
   */
  getReports: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const response = await api.get('/reports/admin', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách báo cáo');
    }
  },

  /**
   * Update report status
   * PUT /api/reports/:report_id/status
   */
  updateReportStatus: async (reportId: number, status: 'pending' | 'resolved') => {
    try {
      const response = await api.put(`/reports/${reportId}/status`, { status });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể cập nhật trạng thái báo cáo');
    }
  }
};

