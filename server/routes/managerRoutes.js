const express = require('express');
const router = express.Router();
const managerStationController = require('../controllers/managerStationController');
const managerBookingController = require('../controllers/managerBookingController');
const managerDashboardController = require('../controllers/managerDashboardController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Manager Routes
 * Base path: /api/manager
 * All routes require authentication and manager role
 */

// ========== Dashboard API ==========

// GET /api/manager/dashboard - Manager overview stats
router.get(
  '/dashboard',
  authenticate,
  authorize('manager'),
  managerDashboardController.getDashboardOverview
);

// ========== Station Management APIs ==========

// GET /api/manager/stations - Get manager's station list
router.get('/stations', authenticate, authorize('manager'), managerStationController.getManagerStations);

// GET /api/manager/stations/:id - Get station detail & reviews
router.get('/stations/:id', authenticate, authorize('manager'), managerStationController.getStationDetail);

// PUT /api/manager/stations/:id/status - Update station status
router.put('/stations/:id/status', authenticate, authorize('manager'), managerStationController.updateStationStatus);

// ========== Booking Management APIs ==========

// GET /api/manager/bookings/history - Get booking history for all stations managed by manager
router.get('/bookings/history', authenticate, authorize('manager'), managerBookingController.getBookingHistory);

// GET /api/manager/stations/:id/bookings - Get booking list for a station
router.get('/stations/:id/bookings', authenticate, authorize('manager'), managerBookingController.getStationBookings);

// Note: These routes are registered at /api/manager, but the actual endpoints should be:
// PUT /api/bookings/:booking_id/confirm
// PUT /api/bookings/:booking_id/cancel
// They are handled here because only managers can access them

module.exports = router;

