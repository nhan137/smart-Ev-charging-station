const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validateBooking } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

/**
 * Booking Routes
 * Base path: /api/bookings
 */

// POST /api/bookings - Create new booking (protected)
router.post('/', authenticate, validateBooking, bookingController.createBooking);

module.exports = router;

