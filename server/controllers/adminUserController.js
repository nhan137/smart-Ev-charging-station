const User = require('../models/User');
const Role = require('../models/Role');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

/**
 * Get user statistics
 * GET /api/admin/users/stats
 */
exports.getUserStats = async (req, res, next) => {
  try {
    const total = await User.count();
    const active = await User.count({ where: { status: 'active' } });
    const locked = await User.count({ where: { status: 'locked' } });

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        locked
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with filters
 * GET /api/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { role_id, status, search, page = 1, limit = 10 } = req.query;
    
    // Build WHERE clause
    const where = {};
    
    if (role_id) {
      where.role_id = parseInt(role_id);
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get users with role
    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_name']
      }],
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Format response để khớp với UI (Hình 1)
    const roleMap = {
      1: { name: 'User', label: 'User' },
      2: { name: 'Manager', label: 'Manager' },
      3: { name: 'Admin', label: 'Admin' }
    };

    const statusMap = {
      'active': { label: 'Hoạt động', color: 'green' },
      'locked': { label: 'Đã khóa', color: 'red' }
    };

    const formattedUsers = users.map(user => {
      const userData = user.toJSON();
      const role = roleMap[userData.role_id] || { name: 'Unknown', label: 'Unknown' };
      const status = statusMap[userData.status] || { label: userData.status, color: 'gray' };

      // Format ngày tạo
      const createdDate = new Date(userData.created_at);
      const createdDateStr = createdDate.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      return {
        user_id: userData.user_id,
        user_code: `#${userData.user_id}`, // ID: #1, #2
        full_name: userData.full_name, // Họ tên
        email: userData.email, // Email
        phone: userData.phone || 'N/A', // SĐT
        role_id: userData.role_id,
        role_name: role.name, // Vai trò: User, Manager, Admin
        role_label: role.label, // Để hiển thị badge
        status: userData.status,
        status_label: status.label, // Trạng thái: Hoạt động, Đã khóa
        status_color: status.color, // Để hiển thị màu badge
        created_at: userData.created_at,
        created_date: createdDateStr, // Ngày tạo: 15/1/2025
        role: userData.role // Giữ nguyên để tương thích
      };
    });

    res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * POST /api/admin/users
 */
exports.createUser = async (req, res, next) => {
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

    const { full_name, email, password, phone, role_id } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await User.findOne({ where: { phone } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Create user (password will be hashed by beforeCreate hook)
    const user = await User.create({
      full_name,
      email,
      password,
      phone: phone || null,
      role_id: role_id || 1,
      status: 'active'
    });

    // Get user with role (without password)
    const userWithRole = await User.findByPk(user.user_id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_name']
      }],
      attributes: { exclude: ['password'] }
    });

    // Format response để khớp với UI
    const userData = userWithRole.toJSON();
    const roleMap = {
      1: { name: 'User', label: 'User' },
      2: { name: 'Manager', label: 'Manager' },
      3: { name: 'Admin', label: 'Admin' }
    };

    const role = roleMap[userData.role_id] || { name: 'Unknown', label: 'Unknown' };
    const createdDate = new Date(userData.created_at);
    const createdDateStr = createdDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const formattedUser = {
      user_id: userData.user_id,
      user_code: `#${userData.user_id}`,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone || 'N/A',
      role_id: userData.role_id,
      role_name: role.name,
      role_label: role.label,
      status: userData.status,
      status_label: userData.status === 'active' ? 'Hoạt động' : 'Đã khóa',
      created_at: userData.created_at,
      created_date: createdDateStr,
      role: userData.role
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: formattedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * GET /api/admin/users/:user_id
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    const user = await User.findByPk(user_id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_name']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Format response để khớp với UI (Hình 2 - Chi tiết người dùng)
    const userData = user.toJSON();
    const roleMap = {
      1: 'User',
      2: 'Manager',
      3: 'Admin'
    };

    const formattedUser = {
      user_id: userData.user_id,
      user_code: `#${userData.user_id}`, // ID: #1
      email: userData.email, // Email
      full_name: userData.full_name, // Họ tên
      phone: userData.phone || 'N/A', // Số điện thoại
      role_id: userData.role_id,
      role_name: roleMap[userData.role_id] || 'Unknown', // Vai trò: User, Manager, Admin
      status: userData.status,
      created_at: userData.created_at,
      role: userData.role // Giữ nguyên để tương thích
    };

    res.status(200).json({
      success: true,
      data: formattedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/admin/users/:user_id
 */
exports.updateUser = async (req, res, next) => {
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

    const { user_id } = req.params;
    const { full_name, email, phone, role_id } = req.body;

    // Check if trying to assign Admin role (role_id = 3)
    if (role_id === 3) {
      return res.status(400).json({
        success: false,
        message: 'Không thể phân quyền Admin. Chỉ có thể phân quyền User (1) hoặc Manager (2).'
      });
    }

    // Find user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email duplicates another user (if email is being updated)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        where: {
          email,
          user_id: { [Op.ne]: user_id }
        }
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Check if phone duplicates another user (if phone is being updated)
    if (phone !== undefined && phone !== null && phone !== '' && phone !== user.phone) {
      const existingPhone = await User.findOne({
        where: {
          phone,
          user_id: { [Op.ne]: user_id }
        }
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Phone number already exists'
        });
      }
    }

    // Build update object
    const updateData = {
      full_name,
      email,
      role_id
    };

    // Only update phone if provided (allow null/empty to clear phone)
    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    // Update user
    await user.update(updateData);

    // Get updated user with role (without password)
    const updatedUser = await User.findByPk(user_id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_name']
      }],
      attributes: { exclude: ['password'] }
    });

    // Format response để khớp với UI
    const userData = updatedUser.toJSON();
    const roleMap = {
      1: { name: 'User', label: 'User' },
      2: { name: 'Manager', label: 'Manager' },
      3: { name: 'Admin', label: 'Admin' }
    };

    const role = roleMap[userData.role_id] || { name: 'Unknown', label: 'Unknown' };
    const createdDate = new Date(userData.created_at);
    const createdDateStr = createdDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const formattedUser = {
      user_id: userData.user_id,
      user_code: `#${userData.user_id}`,
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone || 'N/A',
      role_id: userData.role_id,
      role_name: role.name,
      role_label: role.label,
      status: userData.status,
      status_label: userData.status === 'active' ? 'Hoạt động' : 'Đã khóa',
      created_at: userData.created_at,
      created_date: createdDateStr,
      role: userData.role
    };

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: formattedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user status (lock/unlock)
 * PUT /api/admin/users/:user_id/status
 */
exports.updateUserStatus = async (req, res, next) => {
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

    const { user_id } = req.params;
    const { status } = req.body;

    // Find user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update status
    await user.update({ status });

    // Get updated user with role (without password)
    const updatedUser = await User.findByPk(user_id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['role_id', 'role_name']
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      message: `User ${status === 'active' ? 'unlocked' : 'locked'} successfully`,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/admin/users/:user_id
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { user_id } = req.params;

    // Find user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has bookings
    const bookingCount = await Booking.count({
      where: { user_id }
    });

    // Check if user has payments
    const paymentCount = await Payment.count({
      where: { user_id }
    });

    // If user has related data, prevent deletion
    if (bookingCount > 0 || paymentCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing transactions. Please Lock the user instead.'
      });
    }

    // Delete user (database will auto-cascade delete favorites/notifications)
    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

