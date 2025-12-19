import api from './api';

export const bookingService = {
  // Create new booking
  createBooking: async (data: {
    station_id: number;
    vehicle_type: string;
    start_time: string;
    end_time: string;
    promo_code?: string;
  }) => {
    try {
      const response = await api.post('/bookings', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tạo đặt lịch');
    }
  },

  // Get user's booking history (for "Lịch sử đặt lịch")
  getMyBookingList: async (params?: {
    startDate?: string;
    endDate?: string;
    stationId?: string;
    status?: string;
  }) => {
    try {
      const response = await api.get('/bookings/my-bookings', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử đặt lịch');
    }
  },

  // Verify check-in code to start charging
  verifyCheckinCode: async (bookingId: number, checkinCode: string) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/verify-checkin`, {
        checkin_code: checkinCode,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xác thực mã check-in');
    }
  },

  // Get user's bookings (for "Lịch sử sạc & thanh toán")
  getMyBookings: async () => {
    try {
      const response = await api.get('/bookings/my');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải lịch sử đặt lịch');
    }
  },

  // Get booking by ID
  getBookingById: async (bookingId: number) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải thông tin đặt lịch');
    }
  },

  // Cancel booking by user
  cancelBookingByUser: async (bookingId: number) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel-by-user`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể hủy đặt lịch');
    }
  },

  // Get charging status
  getChargingStatus: async (bookingId: number) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/charging/status`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải trạng thái sạc');
    }
  },

  // Complete charging manually
  completeCharging: async (bookingId: number) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/charging/complete`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể hoàn tất sạc');
    }
  }
};
