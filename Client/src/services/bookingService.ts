import { mockBookings, mockStations } from './mockData';
import { authService } from './authService';

const USE_MOCK = true;

export const bookingService = {
  // Get user's bookings
  getMyBookings: async () => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const user = authService.getCurrentUser();
      if (!user) return { data: [] };
      
      const userBookings = mockBookings
        .filter(b => b.user_id === user.user_id)
        .map(booking => {
          const station = mockStations.find(s => s.station_id === booking.station_id);
          return {
            ...booking,
            station_name: station?.station_name || 'Unknown Station',
            station_address: station?.address || 'Unknown Address',
            vehicle_type: 'oto_ccs',
            total_cost: booking.total_price,
            created_at: booking.start_time
          };
        });
      
      return { data: userBookings };
    }
    // Real API call would go here
  },

  // Request cancel booking
  requestCancel: async (bookingId: number) => {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 0));
      const booking = mockBookings.find(b => b.booking_id === bookingId);
      if (booking) {
        booking.status = 'pending_cancel';
      }
      return { data: { message: 'Yêu cầu hủy đã được gửi' } };
    }
    // Real API call would go here
  }
};
