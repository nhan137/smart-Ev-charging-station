const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateUser, validateAdminUserUpdate, validateUserStatus } = require('../middleware/validation');

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

module.exports = router;

