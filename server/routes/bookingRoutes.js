const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const chargingController = require('../controllers/chargingController');
const { validateBooking } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

/**
 * Booking Routes
 * Base path: /api/bookings
 */

// POST /api/bookings - Create new booking (protected)
router.post('/', authenticate, validateBooking, bookingController.createBooking);

// GET /api/bookings/my - Get user's booking history (for "Lịch sử sạc & thanh toán") (protected)
router.get('/my', authenticate, bookingController.getMyBookings);

// GET /api/bookings/my-bookings - Get user's booking list (for "Lịch sử đặt lịch") (protected)
router.get('/my-bookings', authenticate, bookingController.getMyBookingList);

// GET /api/bookings/:booking_id/charging/status - Get charging status (protected) - MUST be before /:booking_id
router.get('/:booking_id/charging/status', authenticate, chargingController.getChargingStatus);

// POST /api/bookings/:booking_id/verify-checkin - Verify check-in code (protected) - MUST be before /:booking_id
router.post('/:booking_id/verify-checkin', authenticate, bookingController.verifyCheckinCode);

// PUT /api/bookings/:booking_id/cancel-by-user - Cancel booking by user (protected) - MUST be before /:booking_id
router.put('/:booking_id/cancel-by-user', authenticate, bookingController.cancelBookingByUser);

// PUT /api/bookings/:booking_id/status - Update booking status (for testing) (protected) - MUST be before /:booking_id
router.put('/:booking_id/status', authenticate, bookingController.updateBookingStatus);

// GET /api/bookings/:booking_id - Get booking detail by ID (protected)
router.get('/:booking_id', authenticate, bookingController.getBookingById);

// POST /api/bookings/:booking_id/charging/complete - Complete charging manually (protected)
router.post('/:booking_id/charging/complete', authenticate, chargingController.completeCharging);

// Manager-only routes (require manager role)
const managerBookingController = require('../controllers/managerBookingController');
const { authorize } = require('../middleware/auth');

// PUT /api/bookings/:booking_id/confirm - Confirm booking (generate check-in code) - Manager only
router.put('/:booking_id/confirm', authenticate, authorize('manager'), managerBookingController.confirmBooking);

// PUT /api/bookings/:booking_id/cancel - Cancel booking - Manager only
router.put('/:booking_id/cancel', authenticate, authorize('manager'), managerBookingController.cancelBooking);

module.exports = router;

