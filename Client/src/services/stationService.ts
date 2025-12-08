import { mockStations, mockFeedbacks, mockFavorites, getNextId } from './mockData';

const USE_MOCK = true;

export const stationService = {
  getAllStations: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      return { data: mockStations };
    }
    // Real API: return await api.get('/stations');
  },

  getStationById: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const station = mockStations.find(s => s.station_id === stationId);
      if (!station) throw new Error('Không tìm thấy trạm sạc');
      
      const feedbacks = mockFeedbacks.filter(f => f.station_id === stationId);
      return { data: { ...station, feedbacks } };
    }
    // Real API: return await api.get(`/stations/${stationId}`);
  },

  addFavorite: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
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
        station_id: stationId
      });
      
      return { data: { message: 'Đã thêm vào yêu thích' } };
    }
    // Real API: return await api.post(`/favorites`, { station_id: stationId });
  },

  removeFavorite: async (stationId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) throw new Error('Chưa đăng nhập');
      
      const index = mockFavorites.findIndex(
        f => f.user_id === user.user_id && f.station_id === stationId
      );
      
      if (index === -1) throw new Error('Không tìm thấy trong danh sách yêu thích');
      
      mockFavorites.splice(index, 1);
      return { data: { message: 'Đã xóa khỏi yêu thích' } };
    }
    // Real API: return await api.delete(`/favorites/${stationId}`);
  },

  getFavorites: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) return { data: [] };
      
      const userFavorites = mockFavorites
        .filter(f => f.user_id === user.user_id)
        .map(f => {
          const station = mockStations.find(s => s.station_id === f.station_id);
          return station;
        })
        .filter(Boolean);
      
      return { data: userFavorites };
    }
    // Real API: return await api.get('/favorites');
  },

  addFeedback: async (stationId: number, rating: number, comment: string) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (!user) throw new Error('Chưa đăng nhập');
      
      const newFeedback = {
        feedback_id: getNextId(mockFeedbacks, 'feedback_id'),
        user_id: user.user_id,
        station_id: stationId,
        rating,
        comment,
        created_at: new Date().toISOString()
      };
      
      mockFeedbacks.push(newFeedback);
      return { data: newFeedback };
    }
    // Real API: return await api.post('/feedbacks', { station_id: stationId, rating, comment });
  }
};
