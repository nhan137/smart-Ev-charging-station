const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Station = require('./Station');

/**
 * Booking Model
 * Matches the bookings table structure from SQL schema
 */
const Booking = sequelize.define('bookings', {
  booking_id: {
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
  promo_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  vehicle_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_start: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_end: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'charging', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  total_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'bookings',
  timestamps: false
});

// Define associations
Booking.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
Station.hasMany(Booking, { foreignKey: 'station_id', as: 'bookings' });

module.exports = Booking;

