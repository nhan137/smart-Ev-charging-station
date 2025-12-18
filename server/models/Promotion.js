const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Promotion Model
 * Matches the promotions table structure from SQL schema
 */
const Promotion = sequelize.define('promotions', {
  promo_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  discount_percent: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  min_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  max_discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false
  },
  valid_to: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'expired'),
    allowNull: false,
    defaultValue: 'active'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'promotions',
  timestamps: false
});

module.exports = Promotion;

