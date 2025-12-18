const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Feedback Model
 * Matches the feedbacks table structure from SQL schema
 */
const Feedback = sequelize.define('feedbacks', {
  feedback_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: [1],
        msg: 'Rating must be at least 1'
      },
      max: {
        args: [5],
        msg: 'Rating cannot exceed 5'
      }
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'feedbacks',
  timestamps: false
});

module.exports = Feedback;

