const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Feedback = require('./Feedback');

/**
 * Station Model
 * Matches the stations table structure from SQL schema
 */
const Station = sequelize.define('stations', {
  station_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  station_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Station name is required'
      }
    }
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    validate: {
      min: {
        args: [-90],
        msg: 'Latitude must be between -90 and 90'
      },
      max: {
        args: [90],
        msg: 'Latitude must be between -90 and 90'
      }
    }
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    validate: {
      min: {
        args: [-180],
        msg: 'Longitude must be between -180 and 180'
      },
      max: {
        args: [180],
        msg: 'Longitude must be between -180 and 180'
      }
    }
  },
  price_per_kwh: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: [0],
        msg: 'Price must be greater than or equal to 0'
      }
    }
  },
  station_type: {
    type: DataTypes.ENUM('xe_may', 'oto', 'ca_hai'),
    allowNull: false
  },
  total_slots: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: [1],
        msg: 'Total slots must be at least 1'
      }
    }
  },
  available_slots: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: [0],
        msg: 'Available slots cannot be negative'
      }
    }
  },
  charging_power: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  connector_types: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  opening_hours: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stations',
  timestamps: false
});

// Define associations
Station.hasMany(Feedback, {
  foreignKey: 'station_id',
  as: 'feedbacks'
});

Feedback.belongsTo(Station, {
  foreignKey: 'station_id',
  as: 'station'
});

module.exports = Station;

