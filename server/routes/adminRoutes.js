const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const adminStationController = require('../controllers/adminStationController');
const adminBookingController = require('../controllers/adminBookingController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUser, validateAdminUserUpdate, validateUserStatus, validateStation, validateStationUpdate } = require('../middleware/validation');

/**
 * Admin Routes
 * Base path: /api/admin
 * All routes require Admin authentication (role_id = 3)
 */

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

// PUT /api/admin/bookings/:booking_id/cancel - Cancel booking
router.put('/bookings/:booking_id/cancel', authenticate, authorize('admin'), adminBookingController.cancelBooking);

module.exports = router;

