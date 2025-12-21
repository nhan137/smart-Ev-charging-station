import api from './api';

export const feedbackService = {
  // Create feedback
  async create(data: { station_id: number; rating: number; comment?: string; booking_id?: number }) {
    try {
      const response = await api.post('/feedbacks', {
        station_id: Number(data.station_id),
        rating: Number(data.rating),
        comment: data.comment || null,
        booking_id: data.booking_id ? Number(data.booking_id) : null
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Không thể gửi đánh giá';
      throw new Error(errorMessage);
    }
  },

  // Get feedbacks by station
  async getByStation(stationId: number) {
    try {
      const response = await api.get(`/feedbacks/station/${stationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải đánh giá');
    }
  },

  // Get user's feedbacks
  async getMyFeedbacks() {
    try {
      const response = await api.get('/feedbacks/my');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải đánh giá của bạn');
    }
  }
};
