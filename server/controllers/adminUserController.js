const { User, Role, Booking, Payment } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

// --- CONSTANTS & TRANSFORMERS ---
const MAPS = {
  ROLES: { 1: 'User', 2: 'Manager', 3: 'Admin' },
  STATUS: {
    active: { label: 'Hoạt động', color: 'green' },
    locked: { label: 'Đã khóa', color: 'red' }
  }
};

/**
 * Hàm biến đổi dữ liệu User trả về cho Frontend (Hình 1 & 8)
 */
const transformUser = (user) => {
  const data = user instanceof Object ? (user.toJSON ? user.toJSON() : user) : user;
  const roleInfo = MAPS.ROLES[data.role_id] || 'Unknown';
  const statusInfo = MAPS.STATUS[data.status] || { label: data.status, color: 'gray' };

  return {
    id: data.user_id,
    key: `#${data.user_id}`,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone || 'N/A',
    role: {
      id: data.role_id,
      name: roleInfo,
      badge: roleInfo // Dùng cho UI hiển thị
    },
    status: {
      code: data.status,
      label: statusInfo.label,
      color: statusInfo.color
    },
    createdAt: data.created_at,
    createdDate: new Date(data.created_at).toLocaleDateString('vi-VN')
  };
};

// --- CONTROLLER OBJECT ---
const AdminUserController = {
  /**
   * Lấy thống kê nhanh
   */
  getUserStats: async (req, res, next) => {
    try {
      const stats = await User.findAll({
        attributes: [
          'status',
          [User.sequelize.fn('COUNT', User.sequelize.col('user_id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      const result = {
        total: stats.reduce((acc, curr) => acc + parseInt(curr.count), 0),
        active: parseInt(stats.find(s => s.status === 'active')?.count || 0),
        locked: parseInt(stats.find(s => s.status === 'locked')?.count || 0)
      };

      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  },

  /**
   * Danh sách người dùng + Filter + Search
   */
  getUsers: async (req, res, next) => {
    try {
      const { role_id, status, search, page = 1, limit = 10 } = req.query;
      
      const filter = {
        ...(role_id && { role_id: +role_id }),
        ...(status && { status }),
        ...(search && {
          [Op.or]: [
            { full_name: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } }
          ]
        })
      };

      const { count, rows } = await User.findAndCountAll({
        where: filter,
        include: [{ model: Role, as: 'role', attributes: ['role_name'] }],
        attributes: { exclude: ['password'] },
        order: [['created_at', 'DESC']],
        limit: +limit,
        offset: (page - 1) * limit
      });

      res.json({
        success: true,
        data: {
          users: rows.map(transformUser),
          pagination: { total: count, page: +page, totalPages: Math.ceil(count / limit) }
        }
      });
    } catch (e) { next(e); }
  },

  /**
   * Tạo người dùng mới
   */
  createUser: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

      const { full_name, email, password, phone, role_id } = req.body;

      // Check trùng lặp bằng Op.or để tối ưu 1 lần query
      const existing = await User.findOne({ 
        where: { [Op.or]: [{ email }, ...(phone ? [{ phone }] : [])] } 
      });
      
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: existing.email === email ? 'Email already exists' : 'Phone already exists' 
        });
      }

      const user = await User.create({
        full_name, email, password, phone: phone || null,
        role_id: role_id || 1,
        status: 'active'
      });

      res.status(201).json({ success: true, data: transformUser(user) });
    } catch (e) { next(e); }
  },

  /**
   * Cập nhật thông tin
   */
  updateUser: async (req, res, next) => {
    try {
      const { user_id } = req.params;
      const { full_name, email, phone, role_id } = req.body;

      if (+role_id === 3) throw new Error('Cannot manually assign Admin role');

      const user = await User.findByPk(user_id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Cập nhật thông tin
      await user.update({
        full_name,
        email,
        role_id,
        phone: phone || null
      });

      res.json({ success: true, data: transformUser(user) });
    } catch (e) { next(e); }
  },

  /**
   * Khóa / Mở khóa
   */
  updateUserStatus: async (req, res, next) => {
    try {
      const { user_id } = req.params;
      const { status } = req.body;

      const user = await User.findByPk(user_id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      await user.update({ status });
      res.json({ success: true, message: `User status changed to ${status}` });
    } catch (e) { next(e); }
  },

  /**
   * Xóa người dùng (Soft check)
   */
  deleteUser: async (req, res, next) => {
    try {
      const { user_id } = req.params;

      // Kiểm tra quan hệ dữ liệu trước khi xóa
      const [bookings, payments] = await Promise.all([
        Booking.count({ where: { user_id } }),
        Payment.count({ where: { user_id } })
      ]);

      if (bookings > 0 || payments > 0) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đang ràng buộc với giao dịch. Vui lòng chọn "Khóa tài khoản" thay vì xóa.'
        });
      }

      await User.destroy({ where: { user_id } });
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (e) { next(e); }
  }
};

module.exports = AdminUserController;