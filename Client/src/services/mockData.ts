// Mock Users
export const mockUsers = [
  {
    user_id: 1,
    email: 'user@gmail.com',
    password: '123456',
    full_name: 'Nguyễn Văn A',
    phone: '0123456789',
    role: 'user'
  },
  {
    user_id: 2,
    email: 'manager@gmail.com',
    password: '123456',
    full_name: 'Trần Thị B',
    phone: '0987654321',
    role: 'manager',
    managed_stations: [1, 2] // Quản lý trạm 1 và 2
  },
  {
    user_id: 3,
    email: 'admin@evcharge.com',
    password: 'admin123',
    full_name: 'Admin System',
    phone: '0236388899',
    role: 'admin'
  }
];

// Mock Stations
export const mockStations = [
  {
    station_id: 1,
    station_name: 'Trạm sạc Hải Châu',
    address: '123 Trần Phú, Hải Châu, Đà Nẵng - Gần Cầu Rồng và Bãi biển Mỹ Khê',
    latitude: 16.0544,
    longitude: 108.2022,
    total_slots: 6,
    available_slots: 3,
    price_per_kwh: 3500,
    station_type: 'ca_hai',
    connector_types: 'Type 2, CCS2, CHAdeMO',
    avatar_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400'
  },
  {
    station_id: 2,
    station_name: 'Trạm sạc Sơn Trà Premium',
    address: '456 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng - Khu vực Bán đảo Sơn Trà',
    latitude: 16.0715,
    longitude: 108.2433,
    total_slots: 8,
    available_slots: 5,
    price_per_kwh: 3200,
    station_type: 'oto',
    connector_types: 'Type 2, CCS2',
    avatar_url: 'https://images.unsplash.com/photo-1617704548623-340376564e68?w=400'
  },
  {
    station_id: 3,
    station_name: 'Trạm sạc Ngũ Hành Sơn',
    address: '789 Nguyễn Tất Thành, Ngũ Hành Sơn, Đà Nẵng - Gần Chùa Linh Ứng',
    latitude: 16.0010,
    longitude: 108.2650,
    total_slots: 10,
    available_slots: 7,
    price_per_kwh: 3000,
    station_type: 'ca_hai',
    connector_types: 'Type 2, CCS2, CHAdeMO, GB/T',
    avatar_url: 'https://images.unsplash.com/photo-1621361365424-06f0e1eb5c49?w=400'
  },
  {
    station_id: 4,
    station_name: 'Trạm sạc Thanh Khê Express',
    address: '321 Điện Biên Phủ, Thanh Khê, Đà Nẵng - Trung tâm thương mại',
    latitude: 16.0678,
    longitude: 108.1986,
    total_slots: 5,
    available_slots: 2,
    price_per_kwh: 3300,
    station_type: 'xe_may',
    connector_types: 'Type 2, Schuko',
    avatar_url: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=400'
  },
  {
    station_id: 5,
    station_name: 'Trạm sạc Liên Chiểu Eco',
    address: '555 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng - Khu công nghiệp',
    latitude: 16.0753,
    longitude: 108.1500,
    total_slots: 4,
    available_slots: 4,
    price_per_kwh: 2900,
    station_type: 'ca_hai',
    connector_types: 'Type 2, CCS2',
    avatar_url: 'https://images.unsplash.com/photo-1617704548623-340376564e68?w=400'
  }
];

// Mock Bookings
export const mockBookings = [
  {
    booking_id: 1,
    user_id: 1,
    station_id: 1,
    port_id: 1,
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    total_kwh: 45.5,
    total_price: 159250,
    payment_status: 'paid'
  },
  {
    booking_id: 2,
    user_id: 1,
    station_id: 2,
    port_id: 3,
    start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
    status: 'completed',
    total_kwh: 38.2,
    total_price: 122240,
    payment_status: 'paid'
  }
];

// Mock Favorites
export const mockFavorites = [
  {
    favorite_id: 1,
    user_id: 1,
    station_id: 1
  },
  {
    favorite_id: 2,
    user_id: 1,
    station_id: 2
  }
];

// Mock Feedbacks
export const mockFeedbacks = [
  {
    feedback_id: 1,
    user_id: 1,
    station_id: 1,
    rating: 5,
    comment: 'Trạm sạc rất tốt, nhanh và tiện lợi!',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    feedback_id: 2,
    user_id: 1,
    station_id: 1,
    rating: 4,
    comment: 'Tốt, nhưng đôi khi hơi đông',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    feedback_id: 3,
    user_id: 1,
    station_id: 2,
    rating: 5,
    comment: 'Xuất sắc! Sạch sẽ và hiện đại',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    feedback_id: 4,
    user_id: 1,
    station_id: 2,
    rating: 5,
    comment: 'Rất hài lòng',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    feedback_id: 5,
    user_id: 1,
    station_id: 3,
    rating: 4,
    comment: 'Tốt, giá hợp lý',
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    feedback_id: 6,
    user_id: 1,
    station_id: 3,
    rating: 5,
    comment: 'Nhiều chỗ, không phải chờ',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    feedback_id: 7,
    user_id: 1,
    station_id: 4,
    rating: 4,
    comment: 'Tiện lợi, gần trung tâm',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    feedback_id: 8,
    user_id: 1,
    station_id: 5,
    rating: 4,
    comment: 'Giá rẻ nhất khu vực',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock Notifications (Sent by Admin)
export const mockNotifications = [
  {
    notification_id: 1,
    title: 'Thông báo bảo trì hệ thống',
    message: 'Hệ thống sẽ bảo trì từ 2h-4h sáng ngày 26/11/2024. Vui lòng hoàn tất các giao dịch trước thời gian này.',
    type: 'system',
    recipients: 'all',
    recipientCount: 1234,
    sentAt: '2024-11-25T14:30:00',
    sentBy: 'Admin System',
    status: 'sent'
  },
  {
    notification_id: 2,
    title: 'Khuyến mãi giảm 20% cuối tuần',
    message: 'Giảm 20% cho tất cả booking trong tuần này (23-29/11). Áp dụng cho tất cả trạm sạc. Mã: WEEKEND20',
    type: 'promotion',
    recipients: 'all',
    recipientCount: 1234,
    sentAt: '2024-11-24T10:15:00',
    sentBy: 'Admin System',
    status: 'sent'
  },
  {
    notification_id: 3,
    title: 'Cập nhật phương thức thanh toán mới',
    message: 'Đã thêm phương thức thanh toán mới qua ví điện tử MoMo và ZaloPay. Trải nghiệm thanh toán nhanh chóng và tiện lợi hơn!',
    type: 'payment',
    recipients: 'specific',
    recipientCount: 156,
    sentAt: '2024-11-23T16:45:00',
    sentBy: 'Admin System',
    status: 'sent'
  },
  {
    notification_id: 4,
    title: 'Nhắc nhở booking sắp tới',
    message: 'Bạn có booking vào lúc 15:00 hôm nay tại Trạm sạc Hải Châu. Vui lòng đến đúng giờ để tránh mất slot.',
    type: 'booking',
    recipients: 'specific',
    recipientCount: 45,
    sentAt: '2024-11-23T09:00:00',
    sentBy: 'Admin System',
    status: 'sent'
  },
  {
    notification_id: 5,
    title: 'Trạm sạc mới tại Liên Chiểu',
    message: 'Chúng tôi vừa khai trương trạm sạc mới tại Liên Chiểu với 10 cổng sạc nhanh. Giá ưu đãi 2.900đ/kWh trong tháng đầu!',
    type: 'system',
    recipients: 'all',
    recipientCount: 1234,
    sentAt: '2024-11-22T08:30:00',
    sentBy: 'Admin System',
    status: 'sent'
  }
];

// Helper to get next ID
export const getNextId = (array: any[], idField: string) => {
  return Math.max(...array.map(item => item[idField]), 0) + 1;
};
