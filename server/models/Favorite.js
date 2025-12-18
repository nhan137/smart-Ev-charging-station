const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Station = require('./Station');

/**
 * Favorite Model
 * Matches the favorites table structure from SQL schema
 * Composite primary key: (user_id, station_id)
 */
const Favorite = sequelize.define('favorites', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  station_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  added_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'favorites',
  timestamps: false
});

// Define associations
Favorite.belongsTo(Station, {
  foreignKey: 'station_id',
  as: 'station'
});

module.exports = Favorite;

