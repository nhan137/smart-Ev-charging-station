const Notification = require('../models/Notification');
const User = require('../models/User');
const { sequelize } = require('../config/database');

const ALLOWED_TYPES = ['system', 'payment', 'promotion', 'booking'];

// Helper functions for formatting
const formatTypeLabel = (type) => {
  const mapping = {
    'system': 'HỆ THỐNG',
    'promotion': 'KHUYẾN MÃI',
    'payment': 'THANH TOÁN',
    'booking': 'ĐẶT LỊCH'
  };
  return mapping[type] || type.toUpperCase();
};

const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};

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

    let recipientCount = 0;
    let sendToType = send_to;

    // send_to = all -> user_id null (gửi cho tất cả user role_id = 1 và manager role_id = 2)
    if (send_to === 'all') {
      // Count total users (role_id = 1) and managers (role_id = 2)
      recipientCount = await User.count({
        where: {
          role_id: [1, 2]
        }
      });

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

      recipientCount = validUserIds.length;

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

    // Format response
    const formattedResponse = {
      notification_id: null, // Will be set by first notification if needed
      title,
      message,
      type,
      type_label: formatTypeLabel(type),
      send_to: sendToType,
      recipient_count: recipientCount,
      recipient_display: sendToType === 'all' 
        ? `Tất cả user (${recipientCount})` 
        : `${recipientCount} user`,
      created_at: now,
      created_at_display: formatDateTime(now),
      status: 'sent',
      status_label: 'Đã gửi'
    };

    res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully.',
      data: formattedResponse
    });
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

    // Format response to match UI
    const formattedRows = rows.map(row => {
      const createdDate = new Date(row.created_at);
      return {
        title: row.title, // Tiêu đề thông báo
        message: row.message, // Nội dung thông báo
        type: row.type, // system, promotion, payment, booking
        type_label: formatTypeLabel(row.type), // HỆ THỐNG, KHUYẾN MÃI, THANH TOÁN, ĐẶT LỊCH
        send_to_type: row.send_to_type, // all hoặc selected
        recipient_count: parseInt(row.recipient_count) || 0,
        recipient_display: row.send_to_type === 'all' 
          ? `Tất cả user (${row.recipient_count})` 
          : `${row.recipient_count} user`, // "Tất cả user (1234)" hoặc "156 user"
        created_at: row.created_at,
        created_at_display: formatDateTime(createdDate), // "14:30:00 25/11/2024"
        status: 'sent',
        status_label: 'Đã gửi' // Luôn "Đã gửi" với checkmark xanh
      };
    });

    // Get total count for display
    const totalCount = await sequelize.query(
      `
      SELECT COUNT(DISTINCT CONCAT(title, message, type, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i'))) as total
      FROM notifications
      WHERE type IN ('system','promotion','payment','booking')
      `,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedRows,
        total_count: parseInt(totalCount[0]?.total || 0),
        total_count_display: `${totalCount[0]?.total || 0} thông báo` // "5 thông báo"
      }
    });
  } catch (error) {
    next(error);
  }
};

