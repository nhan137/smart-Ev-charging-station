const Notification = require('../models/Notification');
const { Op } = require('sequelize');

/**
 * Get unread notifications for current user
 * GET /api/notifications/unread
 * 
 * Mục đích: Hiển thị thông báo chưa đọc sau khi user đăng nhập (Modal popup)
 */
exports.getUnreadNotifications = async (req, res, next) => {
  try {
    const userId = req.user.user_id; // Từ JWT token

    // Lấy thông báo chưa đọc của user:
    // 1. Thông báo gửi riêng cho user (user_id = userId)
    // 2. Thông báo gửi cho tất cả (user_id = NULL)
    const notifications = await Notification.findAll({
      where: {
        status: 'unread',
        [Op.or]: [
          { user_id: userId },
          { user_id: null } // System-wide notifications
        ]
      },
      order: [['created_at', 'DESC']],
      limit: 10 // Lấy 10 thông báo mới nhất
    });

    // Format response
    const formattedNotifications = notifications.map(notif => ({
      id: notif.notification_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      status: notif.status,
      created_at: notif.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unread_count: formattedNotifications.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification history for current user
 * GET /api/notifications
 * 
 * Mục đích: Hiển thị lịch sử thông báo (trang "Thông báo" của user)
 * Query params: type, status, page, limit
 */
exports.getNotificationHistory = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { type, status, page = 1, limit = 10 } = req.query;

    // Build WHERE clause
    const where = {
      [Op.or]: [
        { user_id: userId },
        { user_id: null } // System-wide notifications
      ]
    };

    // Filter by type
    if (type && type !== 'all') {
      where.type = type;
    }

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get notifications with pagination
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Get unread count (for UI display: "Bạn có 5 thông báo chưa đọc")
    const unreadCount = await Notification.count({
      where: {
        status: 'unread',
        [Op.or]: [
          { user_id: userId },
          { user_id: null } // System-wide notifications
        ]
      }
    });

    // Format response
    const formattedNotifications = notifications.map(notif => ({
      id: notif.notification_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      status: notif.status,
      created_at: notif.created_at
    }));

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotifications,
        unread_count: unreadCount, // Để hiển thị "Bạn có 5 thông báo chưa đọc"
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:notification_id/read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { notification_id } = req.params;

    const notification = await Notification.findByPk(notification_id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to user or is system-wide
    if (notification.user_id !== null && notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this notification'
      });
    }

    // Update status to read
    await notification.update({ status: 'read' });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Update all unread notifications for user
    await Notification.update(
      { status: 'read' },
      {
        where: {
          status: 'unread',
          [Op.or]: [
            { user_id: userId },
            { user_id: null } // System-wide notifications
          ]
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:notification_id
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { notification_id } = req.params;

    const notification = await Notification.findByPk(notification_id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if notification belongs to user or is system-wide
    if (notification.user_id !== null && notification.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this notification'
      });
    }

    // Delete notification
    await notification.destroy();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

