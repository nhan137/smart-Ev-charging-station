const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Notification Model
 * Matches the notifications table structure from SQL schema
 */
const Notification = sequelize.define('notifications', {
  notification_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('system', 'payment', 'promotion', 'booking'),
    allowNull: false,
    defaultValue: 'system'
  },
  status: {
    type: DataTypes.ENUM('unread', 'read'),
    allowNull: false,
    defaultValue: 'unread'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;

