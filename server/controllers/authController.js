const User = require('../models/User');
const { validationResult } = require('express-validator');
const { generateToken } = require('../middleware/auth');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sendPasswordResetEmail } = require('../utils/emailService');

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
 * Manager Login
 * POST /api/auth/manager/login
 */
exports.managerLogin = async (req, res, next) => {
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

    // Check if user is Manager (role_id = 2)
    if (user.role_id !== 2) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản không có quyền Manager'
      });
    }

    // Generate JWT token
    const token = generateToken(user.user_id);

    res.status(200).json({
      success: true,
      message: 'Manager login successful',
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
 * Admin Login
 * POST /api/auth/admin/login
 */
exports.adminLogin = async (req, res, next) => {
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

    // Check if user is Admin (role_id = 3)
    if (user.role_id !== 3) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản không có quyền Admin'
      });
    }

    // Generate JWT token
    const token = generateToken(user.user_id);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
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

/**
 * Logout user (all roles)
 * POST /api/auth/logout
 *
 * Lưu ý:
 * - Hệ thống dùng JWT stateless, nên backend không giữ session.
 * - Logout thực tế = FE xoá token (localStorage/cookies) + chuyển về màn hình login.
 * - Endpoint này chỉ để FE gọi cho đúng flow và hiển thị thông báo thành công.
 */
exports.logout = async (req, res, next) => {
  try {
    // Nếu cần triển khai blacklist token trong tương lai, có thể thêm logic tại đây.
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - Send reset token to email
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });

    // Always return success message (security best practice - don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Set token expiry (1 hour from now)
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1);

    // Save token to database
    await user.update({
      reset_password_token: resetTokenHash,
      reset_password_expires: resetTokenExpires
    });

    // Generate reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Send email with reset link
    try {
      await sendPasswordResetEmail(user.email, resetUrl, user.full_name);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError.message);
      // Continue anyway - don't expose email sending failure to user
    }

    // Always log to console for development
    console.log('=== PASSWORD RESET EMAIL ===');
    console.log(`To: ${user.email}`);
    console.log(`Reset Link: ${resetUrl}`);
    console.log('============================');

    res.status(200).json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.',
      // In development, return the reset URL for testing
      ...(process.env.NODE_ENV === 'development' && {
        resetUrl: resetUrl,
        token: resetToken
      })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { token, password, newPassword } = req.body;
    // Accept both 'password' and 'newPassword' for flexibility
    const finalPassword = newPassword || password;

    // Hash the token to compare with database
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      where: {
        reset_password_token: resetTokenHash,
        reset_password_expires: {
          [Op.gt]: new Date() // Token not expired
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    user.password = finalPassword; // Will be hashed by beforeUpdate hook
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

