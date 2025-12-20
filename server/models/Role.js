const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Role Model
 * Matches the roles table structure from SQL schema
 */
const Role = sequelize.define('roles', {
  role_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Role name is required'
      }
    }
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'roles',
  timestamps: false
});

module.exports = Role;

