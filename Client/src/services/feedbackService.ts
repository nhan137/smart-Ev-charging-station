import { authService } from './authService';
import { mockFeedbacks, getNextId } from './mockData';

const USE_MOCK = true;

export const feedbackService = {
  // Create feedback
  async create(data: { station_id: number; rating: number; comment?: string }) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const user = authService.getCurrentUser();
      if (!user) throw new Error('Chưa đăng nhập');

      const newFeedback = {
        feedback_id: getNextId(mockFeedbacks, 'feedback_id'),
        user_id: user.user_id,
        station_id: data.station_id,
        rating: data.rating,
        comment: data.comment || '',
        created_at: new Date().toISOString()
      };

      mockFeedbacks.push(newFeedback);
      return { data: newFeedback };
    }
    // Real API call would go here
  },

  // Get feedbacks by station
  async getByStation(stationId: number) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const feedbacks = mockFeedbacks.filter(f => f.station_id === stationId);
      return { data: feedbacks };
    }
    // Real API call would go here
  },

  // Get user's feedbacks
  async getMyFeedbacks() {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const user = authService.getCurrentUser();
      if (!user) return { data: [] };
      
      const feedbacks = mockFeedbacks.filter(f => f.user_id === user.user_id);
      return { data: feedbacks };
    }
    // Real API call would go here
  }
};
