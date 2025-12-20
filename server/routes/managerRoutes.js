const express = require('express');
const router = express.Router();

// Controllers
const dashboard = require('../controllers/managerDashboardController');
const stations = require('../controllers/managerStationController');
const bookings = require('../controllers/managerBookingController');

// Middlewares
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Global Middleware cho Manager
 * Áp dụng cho toàn bộ các route trong file này
 */
router.use(authenticate, authorize('manager'));

// ========== 📊 DASHBOARD ==========
router.get('/dashboard', dashboard.getDashboardOverview);

// ========== 🔌 STATION MANAGEMENT ==========
router.route('/stations')
  .get(stations.getManagerStations);

router.route('/stations/:id')
  .get(stations.getStationDetail);

router.put('/stations/:id/status', stations.updateStationStatus);

// ========== 📅 BOOKING MANAGEMENT ==========

// 1. Xem danh sách & lịch sử
router.get('/bookings/history', bookings.getBookingHistory);
router.get('/stations/:id/bookings', bookings.getStationBookings);

// 2. Xử lý Booking (Sửa lại path để đồng nhất với /api/manager)
// Thay vì đặt ở /api/bookings, ta giữ tại đây nhưng dùng route rõ ràng
router.prefix('/bookings/:booking_id', (sub) => {
  sub.put('/confirm', bookings.confirmBooking);
  sub.put('/cancel', bookings.cancelBooking);
});

module.exports = router;

/**
 * 💡 Mẹo nhỏ: Để dùng được hàm .prefix() như trên, 
 * bạn có thể thêm một đoạn code nhỏ vào file app.js hoặc dùng 
 * cách khai báo truyền thống như dưới đây nếu không muốn cài thêm lib:
 */
// router.put('/bookings/:booking_id/confirm', bookings.confirmBooking);
// router.put('/bookings/:booking_id/cancel', bookings.cancelBooking);