const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * ChargingSession Model
 * Matches the charging_sessions table structure from SQL schema
 */
const ChargingSession = sequelize.define('charging_sessions', {
  session_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  start_battery_percent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  end_battery_percent: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  energy_consumed: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  actual_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ended_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'charging_sessions',
  timestamps: false
});

module.exports = ChargingSession;

