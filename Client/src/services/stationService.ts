import api from './api';

export const stationService = {
  getAllStations: async (filters?: {
    station_type?: string;
    min_price?: number;
    max_price?: number;
    lat?: number;
    lng?: number;
    radius?: number;
  }) => {
    try {
      const params = new URLSearchParams();
      
      if (filters?.station_type) params.append('station_type', filters.station_type);
      if (filters?.min_price !== undefined) params.append('min_price', filters.min_price.toString());
      if (filters?.max_price !== undefined) params.append('max_price', filters.max_price.toString());
      if (filters?.lat) params.append('lat', filters.lat.toString());
      if (filters?.lng) params.append('lng', filters.lng.toString());
      if (filters?.radius) params.append('radius', filters.radius.toString());
      
      const response = await api.get(`/stations?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách trạm sạc');
    }
  },

  getStationById: async (stationId: number) => {
    try {
      const response = await api.get(`/stations/${stationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không tìm thấy trạm sạc');
    }
  },

  addFavorite: async (stationId: number) => {
    try {
      const response = await api.post('/favorites', { station_id: stationId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể thêm vào yêu thích');
    }
  },

  removeFavorite: async (stationId: number) => {
    try {
      const response = await api.delete(`/favorites/${stationId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể xóa khỏi yêu thích');
    }
  },

  getFavorites: async () => {
    try {
      const response = await api.get('/favorites/my');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể tải danh sách yêu thích');
    }
  },

  addFeedback: async (stationId: number, rating: number, comment: string) => {
    try {
      const response = await api.post('/feedbacks', { 
        station_id: stationId, 
        rating, 
        comment 
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Không thể gửi đánh giá');
    }
  }
};
