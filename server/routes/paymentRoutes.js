const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

/**
 * Payment Routes
 * Base path: /api/payments
 */

// POST /api/payments/vnpay-init - Initialize VNPay payment (protected)
router.post('/vnpay-init', authenticate, paymentController.vnpayInit);

// GET /api/payments/vnpay-callback - Handle VNPay callback (public, no auth)
router.get('/vnpay-callback', paymentController.vnpayCallback);

module.exports = router;

