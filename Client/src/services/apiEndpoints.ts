/**
 * API Endpoints Configuration
 * File tập trung tất cả các API endpoints để dễ dàng quản lý và ghép API
 * 
 * Cách sử dụng:
 * 1. Đặt USE_MOCK = false để chuyển sang API thật
 * 2. Cập nhật VITE_API_BASE_URL trong file .env
 * 3. Các endpoint đã được định nghĩa sẵn theo chuẩn RESTful
 */

import api from './api';
import { mockUsers, mockStations, mockBookings, mockFeedbacks, mockFavorites, getNextId } from './mockData';

// ============================================
// CẤU HÌNH CHUNG
// ============================================
export const USE_MOCK = true; // Đặt false để dùng API thật

// ============================================
// AUTH API - Xác thực người dùng
// ============================================
export const authAPI = {
  /**
   * Đăng nhập
   * POST /api/auth/login
   * Body: { email: string, password: string }
   * Response: { token: string, user: User }
   */
  login: async (email: string, password: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = mockUsers.find(u => u.email === email && u.password === password);
      if (!user) throw new Error('Email hoặc mật khẩu không đúng');
      
      const token = 'mock-token-' + Date.now();
      const userData = { ...user };
      delete (userData as any).password;
      
      return { token, user: userData };
    }
    
    // API thật
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Đăng ký tài khoản mới
   * POST /api/auth/register
   * Body: { email: string, password: string, full_name: string, phone?: string }
   * Response: { token: string, user: User }
   */
  register: async (data: { email: string; password: string; full_name: string; phone?: string }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (mockUsers.find(u => u.email === data.email)) {
        throw new Error('Email đã được sử dụng');
      }
      
      const newUser = {
        user_id: getNextId(mockUsers, 'user_id'),
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone || '',
        role: 'user',
        created_at: new Date().toISOString()
      };
      
      mockUsers.push(newUser);
      const token = 'mock-token-' + Date.now();
      const userData = { ...newUser };
      delete (userData as any).password;
      
      return { token, user: userData };
    }
    
    // API thật
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Quên mật khẩu
   * POST /api/auth/forgot-password
   * Body: { email: string }
   * Response: { message: string }
   */
  forgotPassword: async (email: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = mockUsers.find(u => u.email === email);
      if (!user) throw new Error('Email không tồn tại');
      return { message: 'Link đặt lại mật khẩu đã được gửi đến email của bạn' };
    }
    
    // API thật
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Đặt lại mật khẩu
   * POST /api/auth/reset-password
   * Body: { token: string, password: string }
   * Response: { message: string }
   */
  resetPassword: async (token: string, password: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Mật khẩu đã được đặt lại thành công' };
    }
    
    // API thật
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  }
};

// ============================================
// STATION API - Quản lý trạm sạc
// ============================================
export const stationAPI = {
  /**
   * Lấy danh sách tất cả trạm sạc
   * GET /api/stations
   * Query params: { status?: string, type?: string, search?: string }
   * Response: Station[]
   */
  getAll: async (params?: { status?: string; type?: string; search?: string }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      let stations = [...mockStations];
      
      if (params?.status) {
        stations = stations.filter(s => s.status === params.status);
      }
      if (params?.type) {
        stations = stations.filter(s => s.station_type === params.type);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        stations = stations.filter(s => 
          s.station_name.toLowerCase().includes(search) ||
          s.address.toLowerCase().includes(search)
        );
      }
      
      return stations;
    }
    
    // API thật
    const response = await api.get('/stations', { params });
    return response.data;
  },

  /**
   * Lấy thông tin chi tiết trạm sạc
   * GET /api/stations/:id
   * Response: Station & { feedbacks: Feedback[] }
   */
  getById: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const station = mockStations.find(s => s.station_id === stationId);
      if (!station) throw new Error('Không tìm thấy trạm sạc');
      
      const feedbacks = mockFeedbacks.filter(f => f.station_id === stationId);
      return { ...station, feedbacks };
    }
    
    // API thật
    const response = await api.get(`/stations/${stationId}`);
    return response.data;
  },

  /**
   * Tạo trạm sạc mới (Admin)
   * POST /api/stations
   * Body: StationCreateData
   * Response: Station
   */
  create: async (data: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newStation = {
        station_id: getNextId(mockStations, 'station_id'),
        ...data,
        created_at: new Date().toISOString()
      };
      mockStations.push(newStation);
      return newStation;
    }
    
    // API thật
    const response = await api.post('/stations', data);
    return response.data;
  },

  /**
   * Cập nhật thông tin trạm sạc (Admin)
   * PUT /api/stations/:id
   * Body: Partial<Station>
   * Response: Station
   */
  update: async (stationId: number, data: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockStations.findIndex(s => s.station_id === stationId);
      if (index === -1) throw new Error('Không tìm thấy trạm sạc');
      
      mockStations[index] = { ...mockStations[index], ...data };
      return mockStations[index];
    }
    
    // API thật
    const response = await api.put(`/stations/${stationId}`, data);
    return response.data;
  },

  /**
   * Xóa trạm sạc (Admin)
   * DELETE /api/stations/:id
   * Response: { message: string }
   */
  delete: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockStations.findIndex(s => s.station_id === stationId);
      if (index === -1) throw new Error('Không tìm thấy trạm sạc');
      
      mockStations.splice(index, 1);
      return { message: 'Đã xóa trạm sạc thành công' };
    }
    
    // API thật
    const response = await api.delete(`/stations/${stationId}`);
    return response.data;
  }
};

// ============================================
// BOOKING API - Quản lý đặt chỗ
// ============================================
export const bookingAPI = {
  /**
   * Lấy danh sách booking của user hiện tại
   * GET /api/bookings/my-bookings
   * Response: Booking[]
   */
  getMyBookings: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return [];
      
      return mockBookings
        .filter(b => b.user_id === user.user_id)
        .map(booking => {
          const station = mockStations.find(s => s.station_id === booking.station_id);
          return {
            ...booking,
            station_name: station?.station_name || 'Unknown',
            station_address: station?.address || 'Unknown'
          };
        });
    }
    
    // API thật
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },

  /**
   * Lấy tất cả booking (Admin/Manager)
   * GET /api/bookings
   * Query params: { status?: string, station_id?: number }
   * Response: Booking[]
   */
  getAll: async (params?: { status?: string; station_id?: number }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      let bookings = [...mockBookings];
      
      if (params?.status) {
        bookings = bookings.filter(b => b.status === params.status);
      }
      if (params?.station_id) {
        bookings = bookings.filter(b => b.station_id === params.station_id);
      }
      
      return bookings;
    }
    
    // API thật
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  /**
   * Tạo booking mới
   * POST /api/bookings
   * Body: { station_id: number, vehicle_type: string, start_time: string, end_time: string }
   * Response: Booking
   */
  create: async (data: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('Chưa đăng nhập');
      
      const newBooking = {
        booking_id: getNextId(mockBookings, 'booking_id'),
        user_id: user.user_id,
        ...data,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      mockBookings.push(newBooking);
      return newBooking;
    }
    
    // API thật
    const response = await api.post('/bookings', data);
    return response.data;
  },

  /**
   * Cập nhật trạng thái booking
   * PUT /api/bookings/:id/status
   * Body: { status: string }
   * Response: Booking
   */
  updateStatus: async (bookingId: number, status: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const booking = mockBookings.find(b => b.booking_id === bookingId);
      if (!booking) throw new Error('Không tìm thấy booking');
      
      booking.status = status;
      return booking;
    }
    
    // API thật
    const response = await api.put(`/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  /**
   * Yêu cầu hủy booking
   * POST /api/bookings/:id/cancel
   * Response: { message: string }
   */
  requestCancel: async (bookingId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const booking = mockBookings.find(b => b.booking_id === bookingId);
      if (!booking) throw new Error('Không tìm thấy booking');
      
      booking.status = 'pending_cancel';
      return { message: 'Yêu cầu hủy đã được gửi' };
    }
    
    // API thật
    const response = await api.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  /**
   * Xác nhận hủy booking (Admin/Manager)
   * POST /api/bookings/:id/confirm-cancel
   * Response: { message: string }
   */
  confirmCancel: async (bookingId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const booking = mockBookings.find(b => b.booking_id === bookingId);
      if (!booking) throw new Error('Không tìm thấy booking');
      
      booking.status = 'cancelled';
      return { message: 'Đã xác nhận hủy booking' };
    }
    
    // API thật
    const response = await api.post(`/bookings/${bookingId}/confirm-cancel`);
    return response.data;
  }
};

// ============================================
// FAVORITE API - Quản lý yêu thích
// ============================================
export const favoriteAPI = {
  /**
   * Lấy danh sách trạm yêu thích
   * GET /api/favorites
   * Response: Station[]
   */
  getAll: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return [];
      
      return mockFavorites
        .filter(f => f.user_id === user.user_id)
        .map(f => mockStations.find(s => s.station_id === f.station_id))
        .filter(Boolean);
    }
    
    // API thật
    const response = await api.get('/favorites');
    return response.data;
  },

  /**
   * Thêm trạm vào yêu thích
   * POST /api/favorites
   * Body: { station_id: number }
   * Response: { message: string }
   */
  add: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('Chưa đăng nhập');
      
      const exists = mockFavorites.find(
        f => f.user_id === user.user_id && f.station_id === stationId
      );
      if (exists) throw new Error('Đã có trong danh sách yêu thích');
      
      mockFavorites.push({
        favorite_id: getNextId(mockFavorites, 'favorite_id'),
        user_id: user.user_id,
        station_id: stationId,
        created_at: new Date().toISOString()
      });
      
      return { message: 'Đã thêm vào yêu thích' };
    }
    
    // API thật
    const response = await api.post('/favorites', { station_id: stationId });
    return response.data;
  },

  /**
   * Xóa trạm khỏi yêu thích
   * DELETE /api/favorites/:stationId
   * Response: { message: string }
   */
  remove: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('Chưa đăng nhập');
      
      const index = mockFavorites.findIndex(
        f => f.user_id === user.user_id && f.station_id === stationId
      );
      if (index === -1) throw new Error('Không tìm thấy trong danh sách yêu thích');
      
      mockFavorites.splice(index, 1);
      return { message: 'Đã xóa khỏi yêu thích' };
    }
    
    // API thật
    const response = await api.delete(`/favorites/${stationId}`);
    return response.data;
  },

  /**
   * Kiểm tra trạm có trong yêu thích không
   * GET /api/favorites/check/:stationId
   * Response: { isFavorite: boolean }
   */
  check: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return { isFavorite: false };
      
      const exists = mockFavorites.some(
        f => f.user_id === user.user_id && f.station_id === stationId
      );
      return { isFavorite: exists };
    }
    
    // API thật
    const response = await api.get(`/favorites/check/${stationId}`);
    return response.data;
  }
};

// ============================================
// FEEDBACK API - Quản lý đánh giá
// ============================================
export const feedbackAPI = {
  /**
   * Lấy danh sách feedback của trạm
   * GET /api/feedbacks/station/:stationId
   * Response: Feedback[]
   */
  getByStation: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockFeedbacks.filter(f => f.station_id === stationId);
    }
    
    // API thật
    const response = await api.get(`/feedbacks/station/${stationId}`);
    return response.data;
  },

  /**
   * Lấy feedback của user hiện tại
   * GET /api/feedbacks/my-feedbacks
   * Response: Feedback[]
   */
  getMyFeedbacks: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return [];
      
      return mockFeedbacks.filter(f => f.user_id === user.user_id);
    }
    
    // API thật
    const response = await api.get('/feedbacks/my-feedbacks');
    return response.data;
  },

  /**
   * Tạo feedback mới
   * POST /api/feedbacks
   * Body: { station_id: number, booking_id: number, rating: number, comment?: string }
   * Response: Feedback
   */
  create: async (data: { station_id: number; booking_id: number; rating: number; comment?: string }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('Chưa đăng nhập');
      
      const newFeedback = {
        feedback_id: getNextId(mockFeedbacks, 'feedback_id'),
        user_id: user.user_id,
        ...data,
        created_at: new Date().toISOString()
      };
      
      mockFeedbacks.push(newFeedback);
      return newFeedback;
    }
    
    // API thật
    const response = await api.post('/feedbacks', data);
    return response.data;
  },

  /**
   * Cập nhật feedback
   * PUT /api/feedbacks/:id
   * Body: { rating: number, comment?: string }
   * Response: Feedback
   */
  update: async (feedbackId: number, data: { rating: number; comment?: string }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const feedback = mockFeedbacks.find(f => f.feedback_id === feedbackId);
      if (!feedback) throw new Error('Không tìm thấy feedback');
      
      Object.assign(feedback, data);
      return feedback;
    }
    
    // API thật
    const response = await api.put(`/feedbacks/${feedbackId}`, data);
    return response.data;
  },

  /**
   * Xóa feedback
   * DELETE /api/feedbacks/:id
   * Response: { message: string }
   */
  delete: async (feedbackId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockFeedbacks.findIndex(f => f.feedback_id === feedbackId);
      if (index === -1) throw new Error('Không tìm thấy feedback');
      
      mockFeedbacks.splice(index, 1);
      return { message: 'Đã xóa feedback' };
    }
    
    // API thật
    const response = await api.delete(`/feedbacks/${feedbackId}`);
    return response.data;
  }
};

// ============================================
// PAYMENT API - Quản lý thanh toán
// ============================================
export const paymentAPI = {
  /**
   * Lấy danh sách thanh toán của user
   * GET /api/payments/my-payments
   * Response: Payment[]
   */
  getMyPayments: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) return [];
      
      // Mock data - cần implement
      return [];
    }
    
    // API thật
    const response = await api.get('/payments/my-payments');
    return response.data;
  },

  /**
   * Lấy tất cả thanh toán (Admin)
   * GET /api/payments
   * Query params: { status?: string, method?: string }
   * Response: Payment[]
   */
  getAll: async (params?: { status?: string; method?: string }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock data - cần implement
      return [];
    }
    
    // API thật
    const response = await api.get('/payments', { params });
    return response.data;
  },

  /**
   * Tạo thanh toán mới
   * POST /api/payments
   * Body: { booking_id: number, method: string, amount: number }
   * Response: Payment & { qr_code?: string, bank_info?: object }
   */
  create: async (data: { booking_id: number; method: string; amount: number }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock data - cần implement
      return {
        payment_id: Date.now(),
        ...data,
        status: 'pending',
        created_at: new Date().toISOString()
      };
    }
    
    // API thật
    const response = await api.post('/payments', data);
    return response.data;
  },

  /**
   * Xác nhận thanh toán
   * POST /api/payments/:id/confirm
   * Body: { transaction_id?: string }
   * Response: Payment
   */
  confirm: async (paymentId: number, transactionId?: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock data - cần implement
      return { message: 'Thanh toán thành công' };
    }
    
    // API thật
    const response = await api.post(`/payments/${paymentId}/confirm`, { transaction_id: transactionId });
    return response.data;
  }
};

// ============================================
// USER API - Quản lý người dùng
// ============================================
export const userAPI = {
  /**
   * Lấy thông tin user hiện tại
   * GET /api/users/me
   * Response: User
   */
  getMe: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    
    // API thật
    const response = await api.get('/users/me');
    return response.data;
  },

  /**
   * Cập nhật thông tin user
   * PUT /api/users/me
   * Body: Partial<User>
   * Response: User
   */
  updateMe: async (data: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) throw new Error('Chưa đăng nhập');
      
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      const userIndex = mockUsers.findIndex(u => u.user_id === user.user_id);
      if (userIndex !== -1) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
      }
      
      return updatedUser;
    }
    
    // API thật
    const response = await api.put('/users/me', data);
    return response.data;
  },

  /**
   * Đổi mật khẩu
   * POST /api/users/change-password
   * Body: { old_password: string, new_password: string }
   * Response: { message: string }
   */
  changePassword: async (oldPassword: string, newPassword: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { message: 'Đổi mật khẩu thành công' };
    }
    
    // API thật
    const response = await api.post('/users/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  },

  /**
   * Lấy tất cả user (Admin)
   * GET /api/users
   * Query params: { role?: string, search?: string }
   * Response: User[]
   */
  getAll: async (params?: { role?: string; search?: string }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      let users = [...mockUsers];
      
      if (params?.role) {
        users = users.filter(u => u.role === params.role);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        users = users.filter(u => 
          u.full_name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search)
        );
      }
      
      return users.map(u => {
        const { password, ...userWithoutPassword } = u as any;
        return userWithoutPassword;
      });
    }
    
    // API thật
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Cập nhật user (Admin)
   * PUT /api/users/:id
   * Body: Partial<User>
   * Response: User
   */
  update: async (userId: number, data: any) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const user = mockUsers.find(u => u.user_id === userId);
      if (!user) throw new Error('Không tìm thấy user');
      
      Object.assign(user, data);
      const { password, ...userWithoutPassword } = user as any;
      return userWithoutPassword;
    }
    
    // API thật
    const response = await api.put(`/users/${userId}`, data);
    return response.data;
  },

  /**
   * Xóa user (Admin)
   * DELETE /api/users/:id
   * Response: { message: string }
   */
  delete: async (userId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const index = mockUsers.findIndex(u => u.user_id === userId);
      if (index === -1) throw new Error('Không tìm thấy user');
      
      mockUsers.splice(index, 1);
      return { message: 'Đã xóa user' };
    }
    
    // API thật
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};

// ============================================
// NOTIFICATION API - Quản lý thông báo
// ============================================
export const notificationAPI = {
  /**
   * Lấy thông báo của user
   * GET /api/notifications
   * Response: Notification[]
   */
  getAll: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock data - cần implement
      return [];
    }
    
    // API thật
    const response = await api.get('/notifications');
    return response.data;
  },

  /**
   * Gửi thông báo (Admin)
   * POST /api/notifications/send
   * Body: { title: string, message: string, type: string, recipients: 'all' | number[] }
   * Response: { message: string, sent_count: number }
   */
  send: async (data: { 
    title: string; 
    message: string; 
    type: string; 
    recipients: 'all' | number[] 
  }) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const recipientCount = data.recipients === 'all' 
        ? mockUsers.filter(u => u.role === 'user').length
        : data.recipients.length;
      
      // Trong thực tế sẽ lưu vào database
      console.log('Sending notification:', data);
      
      return { 
        message: 'Gửi thông báo thành công',
        sent_count: recipientCount
      };
    }
    
    // API thật
    const response = await api.post('/notifications/send', data);
    return response.data;
  },

  /**
   * Đánh dấu đã đọc
   * PUT /api/notifications/:id/read
   * Response: { message: string }
   */
  markAsRead: async (notificationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { message: 'Đã đánh dấu đã đọc' };
    }
    
    // API thật
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Đánh dấu tất cả đã đọc
   * PUT /api/notifications/read-all
   * Response: { message: string }
   */
  markAllAsRead: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { message: 'Đã đánh dấu tất cả đã đọc' };
    }
    
    // API thật
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};

// ============================================
// STATISTICS API - Thống kê (Admin/Manager)
// ============================================
export const statisticsAPI = {
  /**
   * Lấy thống kê tổng quan
   * GET /api/statistics/overview
   * Response: { total_users, total_stations, total_bookings, total_revenue }
   */
  getOverview: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        total_users: mockUsers.length,
        total_stations: mockStations.length,
        total_bookings: mockBookings.length,
        total_revenue: mockBookings.reduce((sum, b) => sum + (b.total_price || 0), 0)
      };
    }
    
    // API thật
    const response = await api.get('/statistics/overview');
    return response.data;
  },

  /**
   * Lấy thống kê theo thời gian
   * GET /api/statistics/revenue
   * Query params: { start_date: string, end_date: string }
   * Response: { date: string, revenue: number }[]
   */
  getRevenue: async (startDate: string, endDate: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock data - cần implement
      return [];
    }
    
    // API thật
    const response = await api.get('/statistics/revenue', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  },

  /**
   * Lấy thống kê trạm sạc
   * GET /api/statistics/stations
   * Response: { station_id, station_name, total_bookings, total_revenue }[]
   */
  getStationStats: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 300));
      // Mock data - cần implement
      return mockStations.map(station => ({
        station_id: station.station_id,
        station_name: station.station_name,
        total_bookings: mockBookings.filter(b => b.station_id === station.station_id).length,
        total_revenue: mockBookings
          .filter(b => b.station_id === station.station_id)
          .reduce((sum, b) => sum + (b.total_price || 0), 0)
      }));
    }
    
    // API thật
    const response = await api.get('/statistics/stations');
    return response.data;
  }
};

// ============================================
// EXPORT TẤT CẢ
// ============================================
export default {
  auth: authAPI,
  station: stationAPI,
  booking: bookingAPI,
  favorite: favoriteAPI,
  feedback: feedbackAPI,
  payment: paymentAPI,
  user: userAPI,
  notification: notificationAPI,
  statistics: statisticsAPI
};
