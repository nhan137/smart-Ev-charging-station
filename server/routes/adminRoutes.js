const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboardController');
const adminNotificationController = require('../controllers/adminNotificationController');
const adminUserController = require('../controllers/adminUserController');
const adminStationController = require('../controllers/adminStationController');
const adminBookingController = require('../controllers/adminBookingController');
const adminPaymentController = require('../controllers/adminPaymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUser, validateAdminUserUpdate, validateUserStatus, validateStation, validateStationUpdate } = require('../middleware/validation');

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require Admin authentication (role_id = 3)
 */

// Dashboard Routes
// GET /api/admin/dashboard/overview - Get overview statistics
router.get('/dashboard/overview', authenticate, authorize('admin'), adminDashboardController.getOverview);

// GET /api/admin/dashboard/highlights - Get highlight statistics
router.get('/dashboard/highlights', authenticate, authorize('admin'), adminDashboardController.getHighlights);

// GET /api/admin/dashboard/charts/revenue - Get revenue chart data
router.get('/dashboard/charts/revenue', authenticate, authorize('admin'), adminDashboardController.getRevenueChart);

// GET /api/admin/dashboard/charts/booking-trend - Get booking trend chart data
router.get('/dashboard/charts/booking-trend', authenticate, authorize('admin'), adminDashboardController.getBookingTrendChart);

// GET /api/admin/dashboard/charts/station-types - Get station types chart data
router.get('/dashboard/charts/station-types', authenticate, authorize('admin'), adminDashboardController.getStationTypesChart);

// GET /api/admin/dashboard/recent-activities - Get recent activities
router.get('/dashboard/recent-activities', authenticate, authorize('admin'), adminDashboardController.getRecentActivities);

// Notification Routes
// POST /api/admin/notifications - Send notification
router.post('/notifications', authenticate, authorize('admin'), adminNotificationController.sendNotification);

// GET /api/admin/notifications/history - Get notification history
router.get('/notifications/history', authenticate, authorize('admin'), adminNotificationController.getHistory);

// User Management Routes
// GET /api/admin/users/stats - Get user statistics
router.get('/users/stats', authenticate, authorize('admin'), adminUserController.getUserStats);

// GET /api/admin/users - Get all users with filters
router.get('/users', authenticate, authorize('admin'), adminUserController.getUsers);

// POST /api/admin/users - Create new user
router.post('/users', authenticate, authorize('admin'), validateUser, adminUserController.createUser);

// GET /api/admin/users/:user_id - Get user by ID
router.get('/users/:user_id', authenticate, authorize('admin'), adminUserController.getUserById);

// PUT /api/admin/users/:user_id - Update user
router.put('/users/:user_id', authenticate, authorize('admin'), validateAdminUserUpdate, adminUserController.updateUser);

// PUT /api/admin/users/:user_id/status - Update user status (lock/unlock)
router.put('/users/:user_id/status', authenticate, authorize('admin'), validateUserStatus, adminUserController.updateUserStatus);

// DELETE /api/admin/users/:user_id - Delete user
router.delete('/users/:user_id', authenticate, authorize('admin'), adminUserController.deleteUser);

// Station Management Routes
// GET /api/admin/stations/stats - Get station statistics
router.get('/stations/stats', authenticate, authorize('admin'), adminStationController.getStationStats);

// GET /api/admin/stations - Get all stations with filters
router.get('/stations', authenticate, authorize('admin'), adminStationController.getStations);

// POST /api/admin/stations - Create new station
router.post('/stations', authenticate, authorize('admin'), validateStation, adminStationController.createStation);

// GET /api/admin/stations/:station_id - Get station by ID
router.get('/stations/:station_id', authenticate, authorize('admin'), adminStationController.getStationById);

// PUT /api/admin/stations/:station_id - Update station
router.put('/stations/:station_id', authenticate, authorize('admin'), validateStationUpdate, adminStationController.updateStation);

// DELETE /api/admin/stations/:station_id - Delete station
router.delete('/stations/:station_id', authenticate, authorize('admin'), adminStationController.deleteStation);

// Booking Management Routes
// GET /api/admin/bookings/stats - Get booking statistics
router.get('/bookings/stats', authenticate, authorize('admin'), adminBookingController.getBookingStats);

// GET /api/admin/bookings - Get all bookings with filters
router.get('/bookings', authenticate, authorize('admin'), adminBookingController.getBookings);

// GET /api/admin/bookings/:booking_id - Get booking by ID
router.get('/bookings/:booking_id', authenticate, authorize('admin'), adminBookingController.getBookingById);

// PUT /api/admin/bookings/:booking_id/confirm - Confirm booking
router.put('/bookings/:booking_id/confirm', authenticate, authorize('admin'), adminBookingController.confirmBooking);

// PUT /api/admin/bookings/:booking_id/cancel - Cancel booking
router.put('/bookings/:booking_id/cancel', authenticate, authorize('admin'), adminBookingController.cancelBooking);

// Payment Management Routes
// GET /api/admin/payments/stats - Get payment statistics
router.get('/payments/stats', authenticate, authorize('admin'), adminPaymentController.getPaymentStats);

// GET /api/admin/payments - Get all payments with filters
router.get('/payments', authenticate, authorize('admin'), adminPaymentController.getPayments);

// GET /api/admin/payments/export - Export payments to CSV/Excel (MUST be before /:payment_id)
router.get('/payments/export', authenticate, authorize('admin'), adminPaymentController.exportPayments);

// GET /api/admin/payments/:payment_id - Get payment by ID
router.get('/payments/:payment_id', authenticate, authorize('admin'), adminPaymentController.getPaymentById);

module.exports = router;

