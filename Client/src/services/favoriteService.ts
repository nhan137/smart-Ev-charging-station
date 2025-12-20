import api from './api';

export const favoriteService = {
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  addFavorite: async (stationId: number) => {
    const response = await api.post('/favorites', { station_id: stationId });
    return response.data;
  },

  removeFavorite: async (stationId: number) => {
    const response = await api.delete(`/favorites/${stationId}`);
    return response.data;
  }
};
