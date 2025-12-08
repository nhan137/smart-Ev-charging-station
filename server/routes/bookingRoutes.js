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

// GET /api/bookings/:booking_id/charging/status - Get charging status (protected)
router.get('/:booking_id/charging/status', authenticate, chargingController.getChargingStatus);

module.exports = router;

