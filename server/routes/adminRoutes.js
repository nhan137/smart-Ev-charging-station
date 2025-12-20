const express = require('express');
const router = express.Router();

// Controllers
const dashboard = require('../controllers/adminDashboardController');
const notify = require('../controllers/adminNotificationController');
const users = require('../controllers/adminUserController');
const stations = require('../controllers/adminStationController');
const bookings = require('../controllers/adminBookingController');
const payments = require('../controllers/adminPaymentController');

// Middlewares
const { authenticate, authorize } = require('../middleware/auth');
const v = require('../middleware/validation');

/**
 * 💡 MẸO: Vì TẤT CẢ các route dưới đây đều yêu cầu Admin, 
 * ta dùng router.use để áp dụng middleware cho toàn bộ file này 1 lần duy nhất.
 */
router.use(authenticate, authorize('admin'));

// --- 📊 DASHBOARD ---
router.get('/dashboard/overview', dashboard.getOverview);
router.get('/dashboard/highlights', dashboard.getHighlights);
router.get('/dashboard/recent-activities', dashboard.getRecentActivities);

// Nhóm các route biểu đồ
router.prefix('/dashboard/charts', (sub) => {
  sub.get('/revenue', dashboard.getRevenueChart);
  sub.get('/booking-trend', dashboard.getBookingTrendChart);
  sub.get('/station-types', dashboard.getStationTypesChart);
});

// --- 🔔 NOTIFICATIONS ---
router.post('/notifications', notify.sendNotification);
router.get('/notifications/history', notify.getHistory);

// --- 👥 USER MANAGEMENT ---
router.get('/users/stats', users.getUserStats);

router.route('/users')
  .get(users.getUsers)
  .post(v.validateUser, users.createUser);

router.route('/users/:user_id')
  .get(users.getUserById)
  .put(v.validateAdminUserUpdate, users.updateUser)
  .delete(users.deleteUser);

router.put('/users/:user_id/status', v.validateUserStatus, users.updateUserStatus);

// --- 🔌 STATION MANAGEMENT ---
router.get('/stations/stats', stations.getStationStats);

router.route('/stations')
  .get(stations.getStations)
  .post(v.validateStation, stations.createStation);

router.route('/stations/:station_id')
  .get(stations.getStationById)
  .put(v.validateStationUpdate, stations.updateStation)
  .delete(stations.deleteStation);

// --- 📅 BOOKING MANAGEMENT ---
router.get('/bookings/stats', bookings.getBookingStats);
router.get('/bookings', bookings.getBookings);

router.route('/bookings/:booking_id')
  .get(bookings.getBookingById);

router.put('/bookings/:booking_id/confirm', bookings.confirmBooking);
router.put('/bookings/:booking_id/cancel', bookings.cancelBooking);

// --- 💰 PAYMENT MANAGEMENT ---
router.get('/payments/stats', payments.getPaymentStats);
router.get('/payments/export', payments.exportPayments); // Đặt trước route có tham số :id

router.route('/payments')
  .get(payments.getPayments);

router.route('/payments/:payment_id')
  .get(payments.getPaymentById);

module.exports = router;