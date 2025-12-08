const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Booking = require('./Booking');

/**
 * Payment Model
 * Matches the payments table structure from SQL schema
 */
const Payment = sequelize.define('payments', {
  payment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  booking_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true // 1 booking = 1 payment
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Amount must be greater than or equal to 0' }
    }
  },
  method: {
    type: DataTypes.ENUM('qr', 'bank'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'success', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payments',
  timestamps: false
});

// Define associations
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });
Booking.hasOne(Payment, { foreignKey: 'booking_id', as: 'payment' });

module.exports = Payment;

