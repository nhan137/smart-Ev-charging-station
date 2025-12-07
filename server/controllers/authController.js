const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { full_name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists. Please use a different email.'
      });
    }

    // Create new user
    const user = await User.create({
      full_name,
      email,
      password,
      phone: phone || null,
      role_id: 1, // Default to User role
      status: 'active'
    });

    // Generate JWT token
    const token = generateToken(user.user_id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user, // Password is automatically excluded by toJSON()
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email (include password for comparison)
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is locked. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.user_id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user, // Password is automatically excluded by toJSON()
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user (protected route)
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    // User is already attached to req by authenticate middleware
    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

