const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { validateUser, validateUserUpdate } = require('../middleware/validation');

/**
 * User Routes
 * Base path: /api/users
 */

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// POST /api/users - Create new user
router.post('/', validateUser, userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', validateUserUpdate, userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;

