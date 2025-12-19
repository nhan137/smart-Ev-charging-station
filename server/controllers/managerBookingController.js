const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const crypto = require('crypto');

/**
 * Generate unique 6-character check-in code
 * Format: Uppercase Letters + Numbers (e.g., "X9A2B1")
 * 
 * @returns {string} - 6-character alphanumeric code
 */
function generateCheckinCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate 6 random characters
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

/**
 * Get Booking List for a Station
 * GET /api/manager/stations/:id/bookings
 * 
 * Mục đích: Lấy danh sách booking của trạm sạc (cho Booking Management View)
 */
exports.getStationBookings = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;
    const { id: stationId } = req.params;
    const { status, start_date, end_date } = req.query;

    // Verify manager owns this station
    const station = await Station.findByPk(stationId);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    if (station.manager_id !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this station'
      });
    }

    // Build WHERE clause
    const whereConditions = {
      station_id: parseInt(stationId)
    };

    // Filter by status
    if (status && ['pending', 'confirmed', 'charging', 'completed', 'cancelled'].includes(status)) {
      whereConditions.status = status;
    }

    // Filter by date range
    if (start_date && end_date) {
      whereConditions.start_time = {
        [Op.between]: [
          new Date(start_date),
          new Date(end_date + ' 23:59:59')
        ]
      };
    } else if (start_date) {
      whereConditions.start_time = {
        [Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      whereConditions.start_time = {
        [Op.lte]: new Date(end_date + ' 23:59:59')
      };
    }

    // Get bookings with user info
    const bookings = await Booking.findAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['full_name', 'phone'],
          required: true
        }
      ],
      attributes: [
        'booking_id',
        'user_id',
        'station_id',
        'vehicle_type',
        'start_time',
        'end_time',
        'status',
        'checkin_code',
        'total_cost',
        'created_at'
      ],
      order: [['created_at', 'DESC']]
    });

    // Format response để khớp với UI (Hình 5)
    const vehicleTypeMap = {
      'xe_may_usb': 'Xe máy USB',
      'xe_may_ccs': 'Xe máy CCS',
      'oto_ccs': 'Ô tô CCS'
    };

    const statusMap = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'charging': 'Đang sạc',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy'
    };

    const formattedBookings = bookings.map(booking => {
      const bookingData = booking.toJSON();
      
      // Format thời gian
      const startTime = new Date(bookingData.start_time);
      const endTime = new Date(bookingData.end_time);
      const startTimeStr = startTime.toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const endTimeStr = endTime.toLocaleString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      return {
        booking_id: bookingData.booking_id,
        booking_code: `#${bookingData.booking_id}`, // MÃ BOOKING: #1, #2
        customer_name: bookingData.user?.full_name || null,
        customer_phone: bookingData.user?.phone || null,
        vehicle_type: bookingData.vehicle_type,
        vehicle_type_display: vehicleTypeMap[bookingData.vehicle_type] || bookingData.vehicle_type,
        start_time: bookingData.start_time,
        start_time_display: startTimeStr, // Format: 14:00:00 20/1/2025
        end_time: bookingData.end_time,
        end_time_display: endTimeStr, // Format: 16:00:00 20/1/2025
        status: bookingData.status,
        status_label: statusMap[bookingData.status] || bookingData.status,
        checkin_code: bookingData.checkin_code,
        total_cost: bookingData.total_cost ? parseFloat(bookingData.total_cost) : null,
        total_cost_display: bookingData.total_cost ? `$ ${parseFloat(bookingData.total_cost).toLocaleString('vi-VN')}₫` : null, // Format: $ 105,000₫
        created_at: bookingData.created_at
      };
    });

    res.status(200).json({
      success: true,
      data: formattedBookings,
      count: formattedBookings.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm Booking (Approval & Code Generation)
 * PUT /api/bookings/:booking_id/confirm
 * 
 * Mục đích: Manager xác nhận booking và tạo mã check-in
 * 
 * Logic:
 * 1. Verify manager owns the station
 * 2. Check if status is 'pending'
 * 3. Generate unique 6-character check-in code
 * 4. Update booking status and checkin_code
 * 5. Create notification for user
 */
exports.confirmBooking = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;
    const { booking_id } = req.params;

    // Find booking with station info
    const booking = await Booking.findByPk(booking_id, {
      include: [
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name', 'manager_id'],
          required: true
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify manager owns the station
    if (booking.station.manager_id !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to confirm this booking'
      });
    }

    // Check if current status is 'pending'
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking. Current status is '${booking.status}'. Only 'pending' bookings can be confirmed.`
      });
    }

    // Generate unique 6-character check-in code
    // Retry up to 10 times to ensure uniqueness
    let checkinCode = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!checkinCode && attempts < maxAttempts) {
      const generatedCode = generateCheckinCode();
      
      // Check if code already exists
      const existingBooking = await Booking.findOne({
        where: { checkin_code: generatedCode }
      });

      if (!existingBooking) {
        checkinCode = generatedCode;
      }
      
      attempts++;
    }

    if (!checkinCode) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique check-in code. Please try again.'
      });
    }

    // Update booking: Set status = 'confirmed' AND checkin_code = generated_code
    await booking.update({
      status: 'confirmed',
      checkin_code: checkinCode
    });

    // Create Notification for the user
    // Title: "Đặt lịch thành công"
    // Message: "Trạm [Station Name] đã xác nhận. Mã check-in: [CODE]. Vui lòng đưa mã này khi đến sạc."
    await Notification.create({
      user_id: booking.user_id,
      title: 'Đặt lịch thành công',
      message: `Trạm ${booking.station.station_name} đã xác nhận. Mã check-in: ${checkinCode}. Vui lòng đưa mã này khi đến sạc.`,
      type: 'booking',
      status: 'unread'
    });

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: {
        booking_id: booking.booking_id,
        status: 'confirmed',
        checkin_code: checkinCode,
        station_name: booking.station.station_name
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Manager Booking History
 * GET /api/manager/bookings/history
 * 
 * Mục đích: Manager xem lịch sử đặt lịch tại TẤT CẢ các trạm mình quản lý
 * 
 * Query params:
 * - search: Tìm theo tên, email, trạm
 * - status: Filter theo trạng thái
 * - from_date, to_date: Filter theo khoảng thời gian
 * 
 * Response:
 * - overview: { total, completed, pending, revenue }
 * - bookings: Danh sách booking với đầy đủ thông tin
 */
exports.getBookingHistory = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;
    const { search, status, from_date, to_date, page = 1, limit = 10 } = req.query;

    // 1. Lấy danh sách station_id mà manager quản lý
    const stations = await Station.findAll({
      where: { manager_id: managerId },
      attributes: ['station_id', 'station_name']
    });

    if (stations.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          overview: {
            total: 0,
            completed: 0,
            pending: 0,
            revenue: 0
          },
          bookings: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        }
      });
    }

    const stationIds = stations.map(s => s.station_id);

    // 2. Build WHERE clause cho bookings
    // Lịch sử chỉ hiển thị booking đã finalized: cancelled, confirmed (approved), completed
    // EXCLUDE: pending, charging
    const whereConditions = {
      station_id: { [Op.in]: stationIds },
      status: { [Op.in]: ['confirmed', 'cancelled', 'completed'] } // Only finalized statuses
    };

    // Filter by status (nếu có) - chỉ cho phép finalized statuses
    if (status && status !== 'all' && status !== '') {
      if (['confirmed', 'cancelled', 'completed'].includes(status)) {
        whereConditions.status = status;
      }
      // Ignore pending and charging filters - not shown in history
    }

    // Filter by date range
    if (from_date || to_date) {
      whereConditions.start_time = {};
      if (from_date) {
        const startDate = new Date(from_date);
        startDate.setHours(0, 0, 0, 0);
        whereConditions.start_time[Op.gte] = startDate;
      }
      if (to_date) {
        const endDate = new Date(to_date);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.start_time[Op.lte] = endDate;
      }
    }

    // 3. Calculate overview stats (chỉ tính các finalized bookings)
    const allHistoryBookings = await Booking.findAll({
      where: {
        station_id: { [Op.in]: stationIds },
        status: { [Op.in]: ['confirmed', 'cancelled', 'completed'] }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['full_name', 'email'],
          required: true
        },
        {
          model: Station,
          as: 'station',
          attributes: ['station_name'],
          required: true
        }
      ],
      attributes: ['booking_id', 'status', 'total_cost']
    });

    const overview = {
      total: allHistoryBookings.length,
      completed: allHistoryBookings.filter(b => b.status === 'completed').length,
      pending: 0, // No pending in history view
      revenue: allHistoryBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (parseFloat(b.total_cost) || 0), 0)
    };

    // 4. Build search conditions (if provided)
    // Search in user name, email, station name, or booking ID
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Use Sequelize.literal for complex search across related tables
      const { sequelize } = require('../config/database');
      whereConditions[Op.or] = [
        sequelize.literal(`user.full_name LIKE '%${searchTerm.replace(/'/g, "''")}%'`),
        sequelize.literal(`user.email LIKE '%${searchTerm.replace(/'/g, "''")}%'`),
        sequelize.literal(`station.station_name LIKE '%${searchTerm.replace(/'/g, "''")}%'`),
        sequelize.literal(`CAST(Booking.booking_id AS CHAR) LIKE '%${searchTerm.replace(/'/g, "''")}%'`)
      ];
    }

    // 5. Get bookings with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'email'],
          required: true
        },
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name'],
          required: true
        }
      ],
      attributes: [
        'booking_id',
        'vehicle_type',
        'start_time',
        'end_time',
        'status',
        'total_cost',
        'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      distinct: true // Important for accurate count with includes
    });

    // 6. Format response
    const formattedBookings = bookings.map(booking => {
      const bookingData = booking.toJSON();
      
      // Map vehicle_type to display name
      const vehicleTypeMap = {
        'xe_may_usb': 'Xe máy USB',
        'xe_may_ccs': 'Xe máy CCS',
        'oto_ccs': 'Ô tô CCS'
      };

      // Map status to display name (only finalized statuses in history)
      const statusMap = {
        'confirmed': 'Đã xác nhận',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
      };

      // Format date
      const startTime = new Date(bookingData.start_time);
      const endTime = new Date(bookingData.end_time);
      const dateStr = startTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = `${startTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}-${endTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

      return {
        booking_id: bookingData.booking_id,
        booking_code: `#${bookingData.booking_id}`,
        customer: {
          name: bookingData.user?.full_name || 'N/A',
          email: bookingData.user?.email || 'N/A'
        },
        station: {
          id: bookingData.station?.station_id,
          name: bookingData.station?.station_name || 'N/A'
        },
        vehicle_type: vehicleTypeMap[bookingData.vehicle_type] || bookingData.vehicle_type,
        time: {
          date: dateStr,
          range: timeStr,
          full: `${dateStr} ${timeStr}`
        },
        status: bookingData.status,
        status_label: statusMap[bookingData.status] || bookingData.status,
        total_cost: bookingData.total_cost ? parseFloat(bookingData.total_cost) : 0,
        created_at: bookingData.created_at
      };
    });

    res.status(200).json({
      success: true,
      data: {
        overview,
        bookings: formattedBookings,
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
 * Cancel Booking
 * PUT /api/bookings/:booking_id/cancel
 * 
 * Mục đích: Manager hủy booking
 * 
 * Logic:
 * 1. Verify manager permission
 * 2. Update booking status to 'cancelled'
 * 3. Restore slot: available_slots = available_slots + 1 (ensure it doesn't exceed total_slots)
 * 4. Create notification for user
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;
    const { booking_id } = req.params;

    // Find booking with station info
    const booking = await Booking.findByPk(booking_id, {
      include: [
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name', 'manager_id', 'total_slots', 'available_slots'],
          required: true
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify manager owns the station
    if (booking.station.manager_id !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this booking'
      });
    }

    // Check if booking can be cancelled (not already completed or cancelled)
    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed booking'
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    // Save old status BEFORE updating (to check if we need to restore slot)
    const oldStatus = booking.status;

    // Update booking status to 'cancelled'
    await booking.update({ status: 'cancelled' });

    // Restore slot: available_slots = available_slots + 1
    // Only restore if booking was in pending, confirmed, or charging status
    if (['pending', 'confirmed', 'charging'].includes(oldStatus)) {
      const { sequelize } = require('../config/database');
      const stationId = booking.station.station_id;
      
      // Atomic update: increment available_slots but don't exceed total_slots
      // Use CASE to ensure available_slots doesn't exceed total_slots
      await Station.update(
        { 
          available_slots: sequelize.literal(`CASE WHEN available_slots + 1 > total_slots THEN total_slots ELSE available_slots + 1 END`)
        },
        { 
          where: { station_id: stationId }
        }
      );
    }

    // Create Notification for the user
    // Title: "Lịch đặt đã bị hủy"
    // Message: "Lịch đặt tại trạm [Station Name] đã bị hủy bởi quản lý."
    await Notification.create({
      user_id: booking.user_id,
      title: 'Lịch đặt đã bị hủy',
      message: `Lịch đặt tại trạm ${booking.station.station_name} đã bị hủy bởi quản lý.`,
      type: 'booking',
      status: 'unread'
    });

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking_id: booking.booking_id,
        status: 'cancelled',
        station_name: booking.station.station_name
      }
    });
  } catch (error) {
    next(error);
  }
};

