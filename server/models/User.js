const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const Role = require('./Role');

/**
 * User Model
 * Matches the users table structure from SQL schema
 */
const User = sequelize.define('users', {
  user_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Full name is required'
      },
      len: {
        args: [1, 100],
        msg: 'Full name cannot exceed 100 characters'
      }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Please provide a valid email'
      },
      notEmpty: {
        msg: 'Email is required'
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: 'Password must be at least 6 characters'
      },
      notEmpty: {
        msg: 'Password is required'
      }
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Default to User role (1=User, 2=Manager, 3=Admin)
    validate: {
      isInt: {
        msg: 'Role ID must be an integer'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'locked'),
    allowNull: false,
    defaultValue: 'active'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  reset_password_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: false, // Using created_at from SQL instead
  hooks: {
    /**
     * Hash password before creating or updating
     */
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // Only hash if password is being changed
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

/**
 * Compare password method
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if passwords match
 */
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Get user without password
 * @returns {object} - User object without password field
 */
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

// Define associations
User.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role'
});

Role.hasMany(User, {
  foreignKey: 'role_id',
  as: 'users'
});

module.exports = User;
