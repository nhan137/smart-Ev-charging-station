const express = require('express');
const router = express.Router();
const userNotificationController = require('../controllers/userNotificationController');
const { authenticate } = require('../middleware/auth');

/**
 * User Notification Routes
 * Base path: /api/notifications
 * All routes require authentication
 */

// GET /api/notifications/unread - Get unread notifications (for modal after login)
router.get('/unread', authenticate, userNotificationController.getUnreadNotifications);

// GET /api/notifications - Get notification history with filters
router.get('/', authenticate, userNotificationController.getNotificationHistory);

// PUT /api/notifications/:notification_id/read - Mark notification as read
router.put('/:notification_id/read', authenticate, userNotificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', authenticate, userNotificationController.markAllAsRead);

module.exports = router;

