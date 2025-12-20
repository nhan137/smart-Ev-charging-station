const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request object
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

    // Get user from token (use user_id or id)
    const userId = decoded.user_id || decoded.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    next(error);
  }
};

/**
 * Authorization middleware
 * Checks if user has required role(s)
 * @param {...string} roles - Roles allowed to access the route
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check role_id (1=User, 2=Manager, 3=Admin)
    const roleMap = { 'user': 1, 'manager': 2, 'admin': 3 };
    const userRoleId = req.user.role_id;
    const allowedRoleIds = roles.map(role => roleMap[role.toLowerCase()]);
    
    console.log(`[authorize] User ID: ${req.user.user_id}, Role ID: ${userRoleId}, Required roles: ${roles.join(', ')}, Allowed role IDs: ${allowedRoleIds.join(', ')}`);
    
    if (!allowedRoleIds.includes(userRoleId)) {
      console.log(`[authorize] Access denied for user ${req.user.user_id} (role_id: ${userRoleId}). Required: ${allowedRoleIds.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    console.log(`[authorize] Access granted for user ${req.user.user_id} (role_id: ${userRoleId})`);
    next();
  };
};

/**
 * Generate JWT token
 * @param {number} userId - User ID
 * @returns {string} - JWT token
 */
exports.generateToken = (userId) => {
  return jwt.sign(
    { user_id: userId, id: userId }, // Support both user_id and id for compatibility
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    { expiresIn: '7d' }
  );
};

