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
    start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
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

export const mockManagerNotifications = [
  {
    notification_id: 1,
    title: 'Chào mừng Manager',
    message: 'Bạn có thể theo dõi các báo cáo và lịch sử xử lý tại đây.',
    type: 'system',
    recipients: 'specific',
    recipientCount: 1,
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Admin System',
    status: 'sent',
    target_manager_id: 2
  }
];

// Mock Reports (User report history)
export const mockReports = [
  {
    report_id: 'REP-1001',
    user_id: 1,
    user_name: 'Nguyễn Văn A',
    station_id: 2,
    station_name: 'Trạm sạc Sơn Trà Premium',
    title: 'Cổng sạc số 3 không nhận xe',
    description:
      'Mình cắm sạc vào cổng số 3 nhưng hệ thống không nhận, đèn báo không sáng. Thử nhiều lần vẫn không được.',
    status: 'pending',
    reported_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_update_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    images: [
      'https://images.unsplash.com/photo-1617704548623-340376564e68?w=800',
      'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=800'
    ],
    status_history: [
      {
        status: 'pending',
        at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Báo cáo đã được tạo'
      }
    ]
  },
  {
    report_id: 'REP-1002',
    user_id: 1,
    user_name: 'Nguyễn Văn A',
    station_id: 1,
    station_name: 'Trạm sạc Hải Châu',
    title: 'Khu vực sạc bị mất điện tạm thời',
    description:
      'Khoảng 19:30 khu vực sạc bị mất điện, màn hình hiển thị tắt và không thể bắt đầu phiên sạc. Mong được kiểm tra sớm.',
    status: 'resolved',
    reported_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    last_update_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    images: ['https://images.unsplash.com/photo-1621361365424-06f0e1eb5c49?w=800'],
    status_history: [
      {
        status: 'pending',
        at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Báo cáo đã được tạo'
      },
      {
        status: 'resolved',
        at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        note: 'Manager đã kiểm tra và khôi phục nguồn điện'
      }
    ]
  }
];

export const mockAdminReports = [
  {
    report_id: 'REP-2001',
    station_id: 1,
    station_name: 'Trạm sạc Hải Châu',
    title: 'Thiết bị đo điện năng sai số bất thường',
    status: 'pending_admin',
    reported_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    report_id: 'REP-2002',
    station_id: 2,
    station_name: 'Trạm sạc Sơn Trà Premium',
    title: 'Lỗi đồng bộ trạng thái cổng sạc với app',
    status: 'admin_handled',
    reported_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockManagerReportsForAdmin = [
  {
    report_id: 'MREP-3001',
    station_name: 'Trạm sạc Hải Châu',
    manager_id: 3,
    manager_name: 'Manager Hải Châu',
    title: 'Đề nghị thay thế đầu sạc bị hư',
    description:
      'Đầu sạc #2 có dấu hiệu cháy nhẹ ở phần tiếp xúc. Đề nghị tạm ngưng cổng sạc này và thay thế linh kiện để đảm bảo an toàn cho người dùng.',
    images: ['https://images.unsplash.com/photo-1555480320-86e7f17f1733?w=800'],
    status: 'pending',
    reported_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    report_id: 'MREP-3002',
    station_name: 'Trạm sạc Sơn Trà Premium',
    manager_id: 4,
    manager_name: 'Manager Sơn Trà',
    title: 'Sự cố mất kết nối hệ thống giám sát',
    description:
      'Hệ thống giám sát bị mất kết nối gián đoạn, dữ liệu trạng thái trụ cập nhật chậm. Đã kiểm tra router và reset modem; cần admin kiểm tra cấu hình server log.',
    images: [
      'https://images.unsplash.com/photo-1581091870627-3c66e9a5b3f1?w=800',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800'
    ],
    status: 'resolved',
reported_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to get next ID
export const getNextId = (array: any[], idField: string) => {
  return Math.max(...array.map(item => item[idField]), 0) + 1;
};