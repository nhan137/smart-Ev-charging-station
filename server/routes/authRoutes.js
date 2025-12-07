const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
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

module.exports = router;

