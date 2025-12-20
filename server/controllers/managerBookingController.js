const { Booking, Station, User, Notification, sequelize } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

// --- HELPERS & CONSTANTS ---
const MAPS = {
  VEHICLE_TYPES: {
    xe_may_usb: 'Xe máy USB',
    xe_may_ccs: 'Xe máy CCS',
    oto_ccs: 'Ô tô CCS'
  },
  STATUS_LABELS: {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    charging: 'Đang sạc',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  }
};

/**
 * Tạo mã Check-in 6 ký tự độc bản
 */
const generateCheckinCode = () => 
  Array.from({ length: 6 }, () => 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[crypto.randomInt(36)]
  ).join('');

/**
 * Hàm format dữ liệu Booking dùng chung (Presenter)
 */
const formatBookingData = (booking) => {
  const data = booking.get({ plain: true });
  const start = new Date(data.start_time);
  const end = new Date(data.end_time);

  return {
    id: data.booking_id,
    code: `#${data.booking_id}`,
    customer: {
      name: data.user?.full_name || 'N/A',
      phone: data.user?.phone || 'N/A',
      email: data.user?.email || 'N/A'
    },
    station: data.station ? { id: data.station.station_id, name: data.station.station_name } : undefined,
    vehicle: {
      key: data.vehicle_type,
      display: MAPS.VEHICLE_TYPES[data.vehicle_type] || data.vehicle_type
    },
    timing: {
      start: data.start_time,
      end: data.end_time,
      display: `${start.toLocaleTimeString('vi-VN')} ${start.toLocaleDateString('vi-VN')}`
    },
    status: {
      key: data.status,
      label: MAPS.STATUS_LABELS[data.status] || data.status
    },
    finance: {
      raw: parseFloat(data.total_cost || 0),
      display: data.total_cost ? `$ ${parseFloat(data.total_cost).toLocaleString('vi-VN')}₫` : '0₫'
    },
    checkin_code: data.checkin_code,
    created_at: data.created_at
  };
};

// --- CONTROLLER OBJECT ---
const BookingController = {
  /**
   * Lấy danh sách booking của một trạm cụ thể
   */
  getStationBookings: async (req, res, next) => {
    try {
      const { id: station_id } = req.params;
      const { status, start_date, end_date } = req.query;

      const station = await Station.findOne({ 
        where: { station_id, manager_id: req.user.user_id } 
      });

      if (!station) return res.status(403).json({ success: false, message: 'Access Denied or Not Found' });

      // Xây dựng query động bằng cách reduce
      const filter = Object.assign(
        { station_id },
        status && { status },
        (start_date || end_date) && {
          start_time: {
            ...(start_date && { [Op.gte]: new Date(start_date) }),
            ...(end_date && { [Op.lte]: new Date(end_date + ' 23:59:59') })
          }
        }
      );

      const bookings = await Booking.findAll({
        where: filter,
        include: [{ model: User, as: 'user', attributes: ['full_name', 'phone'] }],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: bookings.map(formatBookingData),
        total: bookings.length
      });
    } catch (e) { next(e); }
  },

  /**
   * Xác nhận đặt lịch và cấp mã
   */
  confirmBooking: async (req, res, next) => {
    const t = await sequelize.transaction(); // Thêm transaction cho "xịn"
    try {
      const booking = await Booking.findByPk(req.params.booking_id, {
        include: [{ model: Station, as: 'station' }]
      });

      if (!booking || booking.station.manager_id !== req.user.user_id) {
        return res.status(404).json({ success: false, message: 'Unauthorized action' });
      }

      if (booking.status !== 'pending') throw new Error('Only pending bookings can be confirmed');

      // Loop tìm code độc nhất
      let checkinCode;
      let isUnique = false;
      while (!isUnique) {
        checkinCode = generateCheckinCode();
        const exists = await Booking.findOne({ where: { checkin_code: checkinCode } });
        if (!exists) isUnique = true;
      }

      await booking.update({ status: 'confirmed', checkin_code: checkinCode }, { transaction: t });

      await Notification.create({
        user_id: booking.user_id,
        title: 'Đặt lịch thành công',
        message: `Trạm ${booking.station.station_name} đã xác nhận. Mã: ${checkinCode}`,
        type: 'booking'
      }, { transaction: t });

      await t.commit();
      res.json({ success: true, data: { checkinCode, status: 'confirmed' } });
    } catch (e) {
      await t.rollback();
      next(e);
    }
  },

  /**
   * Lịch sử đặt lịch (Search & Paginate)
   */
  getBookingHistory: async (req, res, next) => {
    try {
      const { search, status, from_date, to_date, page = 1, limit = 10 } = req.query;
      const managerId = req.user.user_id;

      // Tìm trạm trước để lấy ID
      const myStations = await Station.findAll({ where: { manager_id: managerId }, attributes: ['station_id'] });
      const stationIds = myStations.map(s => s.station_id);

      if (!stationIds.length) return res.json({ success: true, data: { bookings: [] } });

      const where = {
        station_id: { [Op.in]: stationIds },
        status: status && status !== 'all' ? status : { [Op.in]: ['confirmed', 'cancelled', 'completed'] }
      };

      // Search an toàn hơn
      if (search) {
        const query = `%${search}%`;
        where[Op.or] = [
          { '$user.full_name$': { [Op.like]: query } },
          { '$user.email$': { [Op.like]: query } },
          { '$station.station_name$': { [Op.like]: query } }
        ];
      }

      const { count, rows } = await Booking.findAndCountAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['full_name', 'email'] },
          { model: Station, as: 'station', attributes: ['station_name'] }
        ],
        limit: +limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']]
      });

      // Tính doanh thu nhanh bằng reduce trên kết quả trả về (nếu tập dữ liệu nhỏ)
      // Hoặc query riêng nếu tập dữ liệu lớn. Ở đây ta làm mẫu lấy tổng quan:
      const totalRevenue = rows.filter(r => r.status === 'completed').reduce((a, b) => a + Number(b.total_cost || 0), 0);

      res.json({
        success: true,
        data: {
          overview: { total: count, revenue: totalRevenue },
          bookings: rows.map(formatBookingData),
          pagination: { total: count, page: +page, totalPages: Math.ceil(count / limit) }
        }
      });
    } catch (e) { next(e); }
  },

  /**
   * Hủy lịch
   */
  cancelBooking: async (req, res, next) => {
    try {
      const booking = await Booking.findByPk(req.params.booking_id, {
        include: [{ model: Station, as: 'station' }]
      });

      if (!booking || booking.station.manager_id !== req.user.user_id) throw new Error('Permission denied');

      const oldStatus = booking.status;
      await booking.update({ status: 'cancelled' });

      // Atomic update slot trạm sạc
      if (['pending', 'confirmed', 'charging'].includes(oldStatus)) {
        await Station.update(
          { available_slots: sequelize.literal(`LEAST(available_slots + 1, total_slots)`) },
          { where: { station_id: booking.station.station_id } }
        );
      }

      await Notification.create({
        user_id: booking.user_id,
        title: 'Lịch đặt đã bị hủy',
        message: `Trạm ${booking.station.station_name} đã hủy lịch của bạn.`,
        type: 'booking'
      });

      res.json({ success: true, message: 'Cancelled' });
    } catch (e) { next(e); }
  }
};

module.exports = BookingController;