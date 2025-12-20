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

// POST /api/auth/manager/login - Manager login (role_id = 2)
router.post('/manager/login', validateLogin, authController.managerLogin);

// POST /api/auth/admin/login - Admin login (role_id = 3)
router.post('/admin/login', validateLogin, authController.adminLogin);

// GET /api/auth/me - Get current user (protected)
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/logout - Logout (áp dụng cho cả User / Manager / Admin)
// FE chỉ cần xoá token sau khi nhận response success.
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/forgot-password - Request password reset
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', validateResetPassword, authController.resetPassword);

module.exports = router;

