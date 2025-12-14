const Notification = require('../models/Notification');
const User = require('../models/User');
const { sequelize } = require('../config/database');

const ALLOWED_TYPES = ['system', 'payment', 'promotion', 'booking'];

/**
 * POST /api/admin/notifications
 * Body: { title, message, type, send_to: 'all' | 'selected', user_ids?: number[] }
 * 
 * Lưu ý: Chỉ gửi thông báo cho User (role_id = 1), không gửi cho Manager (role_id = 2) hoặc Admin (role_id = 3)
 */
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, send_to, user_ids } = req.body;

    // Basic validation
    if (!title || !message || !type || !send_to) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    const now = new Date();

    // send_to = all -> user_id null (gửi cho tất cả user role_id = 1 và manager role_id = 2)
    if (send_to === 'all') {
      await Notification.create({
        user_id: null,
        title,
        message,
        type,
        created_at: now
      });
    } else if (send_to === 'selected') {
      if (!Array.isArray(user_ids) || user_ids.length === 0) {
        return res.status(400).json({ success: false, message: 'user_ids required when send_to = selected' });
      }

      // Validate: Chỉ cho phép gửi cho User (role_id = 1) và Manager (role_id = 2)
      const users = await User.findAll({
        where: {
          user_id: user_ids,
          role_id: [1, 2] // Cho phép gửi cho User và Manager
        },
        attributes: ['user_id']
      });

      const validUserIds = users.map(u => u.user_id);
      const invalidUserIds = user_ids.filter(id => !validUserIds.includes(id));

      if (invalidUserIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot send notification to Admin users. Invalid user_ids: ${invalidUserIds.join(', ')}`
        });
      }

      if (validUserIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid users found. Only users with role_id = 1 (User) or role_id = 2 (Manager) can receive notifications.'
        });
      }

      const rows = validUserIds.map(id => ({
        user_id: id,
        title,
        message,
        type,
        created_at: now
      }));
      await Notification.bulkCreate(rows);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid send_to' });
    }

    res.status(200).json({ success: true, message: 'Notification queued.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/notifications/history
 * Query: limit? default 20
 */
exports.getHistory = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const rows = await sequelize.query(
      `
      SELECT
        title,
        message,
        type,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as created_minute,
        MIN(created_at) as created_at,
        CASE
          WHEN SUM(user_id IS NULL) > 0 THEN 'all'
          ELSE 'selected'
        END as send_to_type,
        COUNT(*) as recipient_count
      FROM notifications
      WHERE type IN ('system','promotion','payment','booking')
      GROUP BY title, message, type, created_minute
      ORDER BY created_at DESC
      LIMIT :limit
      `,
      {
        replacements: { limit },
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.status(200).json({
      success: true,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

