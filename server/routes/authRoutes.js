const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateForgotPassword, validateResetPassword } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

/**
 * Auth Routes
 * Base path: /api/auth
 */

// POST /api/auth/register - Register new user
router.post('/register', validateRegister, authController.register);

// POST /api/auth/login - Login user
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;

