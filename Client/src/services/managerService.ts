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
  }
};

