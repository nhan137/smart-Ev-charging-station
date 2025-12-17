const Booking = require('../models/Booking');
const User = require('../models/User');
const Station = require('../models/Station');
const Payment = require('../models/Payment');
const ChargingSession = require('../models/ChargingSession');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Helper functions for formatting
const formatVehicleType = (vehicleType) => {
  const mapping = {
    'oto_ccs': 'Ô tô CCS',
    'oto_type2': 'Ô tô Type 2',
    'xe_may_ccs': 'Xe máy CCS',
    'xe_may_usb': 'Xe máy USB'
  };
  return mapping[vehicleType] || vehicleType;
};

const formatStatus = (status) => {
  const mapping = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'charging': 'Đang sạc',
    'completed': 'Hoàn thành',
    'cancelled': 'Đã hủy'
  };
  return mapping[status] || status;
};

const formatDateTime = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
};

const formatCurrency = (amount) => {
  if (!amount) return null;
  return `$${parseFloat(amount).toLocaleString('vi-VN')}₫`;
};

/**
 * Get booking statistics
 * GET /api/admin/bookings/stats
 */
exports.getBookingStats = async (req, res, next) => {
  try {
    const total = await Booking.count();
    const pending = await Booking.count({ where: { status: 'pending' } });
    const charging = await Booking.count({ where: { status: 'charging' } });
    const completed = await Booking.count({ where: { status: 'completed' } });

    res.status(200).json({
      success: true,
      data: {
        total,
        total_display: `${total} TỔNG BOOKING`,
        pending,
        pending_display: `${pending} CHỜ XÁC NHẬN`,
        charging,
        charging_display: `${charging} ĐANG SẠC`,
        completed,
        completed_display: `${completed} HOÀN THÀNH`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all bookings with filters
 * GET /api/admin/bookings
 */
exports.getBookings = async (req, res, next) => {
  try {
    const { station_id, status, start_date, end_date, search, page = 1, limit = 10 } = req.query;
    
    // Build WHERE clause
    const where = {};
    
    if (station_id && station_id !== 'all') {
      where.station_id = parseInt(station_id);
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Date range filter
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) {
        where.created_at[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        // Set end_date to end of day
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = endDate;
      }
    }
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build include conditions
    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['user_id', 'full_name', 'phone'],
      required: true
    };

    // If search is provided, filter by booking_id, user full_name, or station name
    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum) && searchNum.toString() === search.trim()) {
        // Search by booking_id (exact match)
        where.booking_id = searchNum;
      } else {
        // Search by user full_name or station name using raw SQL
        const searchTerm = `%${search}%`;
        where[Op.or] = [
          sequelize.literal(`EXISTS (
            SELECT 1 FROM users 
            WHERE users.user_id = bookings.user_id 
            AND users.full_name LIKE ${sequelize.escape(searchTerm)}
          )`),
          sequelize.literal(`EXISTS (
            SELECT 1 FROM stations 
            WHERE stations.station_id = bookings.station_id 
            AND stations.station_name LIKE ${sequelize.escape(searchTerm)}
          )`)
        ];
      }
    }

    // Get bookings with user, station, and payment info
    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      include: [
        userInclude,
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name'],
          required: true
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['payment_id', 'method', 'status'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Format response to match UI
    const formattedBookings = bookings.map(booking => {
      const bookingData = booking.toJSON();
      return {
        booking_id: bookingData.booking_id,
        booking_code: `#${bookingData.booking_id}`, // Mã đặt lịch
        user_id: bookingData.user_id,
        user_name: bookingData.user?.full_name || null, // NGƯỜI ĐẶT
        user_phone: bookingData.user?.phone || null,
        station_id: bookingData.station_id,
        station_name: bookingData.station?.station_name || null, // TÊN TRẠM
        vehicle_type: bookingData.vehicle_type,
        vehicle_type_display: formatVehicleType(bookingData.vehicle_type), // LOẠI XE
        start_time: bookingData.start_time,
        start_time_display: formatDateTime(bookingData.start_time), // THỜI GIAN BẮT ĐẦU
        end_time: bookingData.end_time,
        end_time_display: formatDateTime(bookingData.end_time),
        actual_start: bookingData.actual_start,
        actual_end: bookingData.actual_end,
        status: bookingData.status,
        status_label: formatStatus(bookingData.status), // TRẠNG THÁI
        total_cost: bookingData.total_cost,
        total_cost_display: formatCurrency(bookingData.total_cost), // TỔNG TIỀN
        created_at: bookingData.created_at,
        payment_method: bookingData.payment?.method || null,
        payment_status: bookingData.payment?.status || null,
        // Action buttons logic (for FE to determine which buttons to show)
        can_confirm: bookingData.status === 'pending',
        can_cancel: ['pending', 'confirmed'].includes(bookingData.status),
        can_view_details: true
      };
    });

    res.status(200).json({
      success: true,
      data: {
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
 * Get booking by ID with full details
 * GET /api/admin/bookings/:booking_id
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const { booking_id } = req.params;

    const booking = await Booking.findByPk(booking_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'phone', 'email'],
          required: true
        },
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name', 'address'],
          required: true
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['payment_id', 'method', 'status', 'amount', 'payment_date'],
          required: false
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get ChargingSession if exists
    const chargingSession = await ChargingSession.findOne({
      where: { booking_id: booking_id }
    });

    const bookingData = booking.toJSON();
    const sessionData = chargingSession ? chargingSession.toJSON() : null;

    // Format response to match UI modal
    const formattedResponse = {
      booking_info: {
        booking_id: bookingData.booking_id,
        booking_code: `#${bookingData.booking_id}`, // Mã đặt lịch: #3
        status: bookingData.status,
        status_label: formatStatus(bookingData.status), // Trạng thái: Hoàn thành
        vehicle_type: bookingData.vehicle_type,
        vehicle_type_display: formatVehicleType(bookingData.vehicle_type), // Loại xe: Xe máy USB
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        actual_start: bookingData.actual_start,
        actual_end: bookingData.actual_end,
        total_cost: bookingData.total_cost,
        created_at: bookingData.created_at
      },
      customer_info: {
        user_id: bookingData.user_id,
        full_name: bookingData.user?.full_name || null, // Họ tên: Lê Văn C
        phone: bookingData.user?.phone || null,
        email: bookingData.user?.email || null
      },
      station_info: {
        station_id: bookingData.station_id,
        station_name: bookingData.station?.station_name || null, // Tên trạm: Trạm sạc Hải Châu
        address: bookingData.station?.address || null
      },
      time_info: {
        start_time: bookingData.actual_start || bookingData.start_time,
        start_time_display: formatDate(bookingData.actual_start || bookingData.start_time), // Bắt đầu: 16:00:00 19/1/2025
        end_time: bookingData.actual_end || bookingData.end_time,
        end_time_display: formatDate(bookingData.actual_end || bookingData.end_time) // Kết thúc: 17:00:00 19/1/2025
      },
      charging_info: {
        start_battery_percent: sessionData?.start_battery_percent || null, // Pin ban đầu: 20%
        start_battery_display: sessionData?.start_battery_percent ? `${sessionData.start_battery_percent}%` : null,
        end_battery_percent: sessionData?.end_battery_percent || null, // Pin sau sạc: 85%
        end_battery_display: sessionData?.end_battery_percent ? `${sessionData.end_battery_percent}%` : null,
        energy_consumed: sessionData?.energy_consumed || null, // Năng lượng tiêu thụ: 30 kWh
        energy_consumed_display: sessionData?.energy_consumed ? `${parseFloat(sessionData.energy_consumed)} kWh` : null
      },
      payment_info: {
        payment_id: bookingData.payment?.payment_id || null,
        method: bookingData.payment?.method || null, // Phương thức: QR
        method_display: bookingData.payment?.method ? bookingData.payment.method.toUpperCase() : null,
        status: bookingData.payment?.status || null,
        status_label: bookingData.payment?.status === 'success' ? 'Đã thanh toán' : null, // Đã thanh toán
        amount: bookingData.payment?.amount || bookingData.total_cost || null,
        amount_display: formatCurrency(bookingData.payment?.amount || bookingData.total_cost), // Tổng tiền: 15,000₫
        payment_date: bookingData.payment?.payment_date || null
      },
      system_info: {
        created_at: bookingData.created_at,
        created_at_display: formatDate(bookingData.created_at), // Ngày tạo: 14:00:00 18/1/2025
        updated_at: bookingData.created_at, // Assuming no updated_at field
        updated_at_display: formatDate(bookingData.created_at) // Cập nhật lần cuối: 17:00:00 19/1/2025
      }
    };

    res.status(200).json({
      success: true,
      data: formattedResponse
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Confirm booking
 * PUT /api/admin/bookings/:booking_id/confirm
 */
exports.confirmBooking = async (req, res, next) => {
  try {
    const { booking_id } = req.params;

    // Find booking
    const booking = await Booking.findByPk(booking_id, {
      include: [{
        model: Station,
        as: 'station',
        attributes: ['station_id', 'available_slots', 'total_slots'],
        required: true
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is already confirmed, completed, or cancelled
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with status '${booking.status}'. Only pending bookings can be confirmed.`
      });
    }

    const station = booking.station;

    // Check if station has available slots
    if (station.available_slots <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Station has no available slots'
      });
    }

    // Update booking status to confirmed
    await booking.update({ status: 'confirmed' });

    // Decrease available_slots (already decreased when booking was created, so no need to decrease again)
    // Actually, we should not decrease here because it was already decreased when booking was created

    // Get updated booking with relations
    const updatedBooking = await Booking.findByPk(booking_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'phone'],
          required: true
        },
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name'],
          required: true
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['payment_id', 'method', 'status'],
          required: false
        }
      ]
    });

    const bookingData = updatedBooking.toJSON();
    const formattedBooking = {
      booking_id: bookingData.booking_id,
      booking_code: `#${bookingData.booking_id}`,
      user_name: bookingData.user?.full_name || null,
      station_name: bookingData.station?.station_name || null,
      status: bookingData.status,
      status_label: formatStatus(bookingData.status),
      total_cost: bookingData.total_cost,
      total_cost_display: formatCurrency(bookingData.total_cost),
      payment_status: bookingData.payment?.status || null
    };

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: formattedBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking
 * PUT /api/admin/bookings/:booking_id/cancel
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { booking_id } = req.params;

    // Find booking
    const booking = await Booking.findByPk(booking_id, {
      include: [{
        model: Station,
        as: 'station',
        attributes: ['station_id', 'available_slots'],
        required: true
      }]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is already completed or cancelled
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status '${booking.status}'. Only pending, confirmed, or charging bookings can be cancelled.`
      });
    }

    const oldStatus = booking.status;
    const station = booking.station;

    // Update booking status to cancelled
    await booking.update({ status: 'cancelled' });

    // If booking was pending, confirmed, or charging, increase available_slots
    if (['pending', 'confirmed', 'charging'].includes(oldStatus)) {
      const newAvailableSlots = Math.min(
        station.available_slots + 1,
        station.total_slots || station.available_slots + 1
      );
      await station.update({ available_slots: newAvailableSlots });
    }

    // Get updated booking with relations
    const updatedBooking = await Booking.findByPk(booking_id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'full_name', 'phone'],
          required: true
        },
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name'],
          required: true
        },
        {
          model: Payment,
          as: 'payment',
          attributes: ['payment_id', 'method', 'status'],
          required: false
        }
      ]
    });

    const bookingData = updatedBooking.toJSON();
    const formattedBooking = {
      booking_id: bookingData.booking_id,
      booking_code: `#${bookingData.booking_id}`,
      user_name: bookingData.user?.full_name || null,
      station_name: bookingData.station?.station_name || null,
      status: bookingData.status,
      status_label: formatStatus(bookingData.status),
      total_cost: bookingData.total_cost,
      total_cost_display: formatCurrency(bookingData.total_cost),
      payment_status: bookingData.payment?.status || null
    };

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: formattedBooking
    });
  } catch (error) {
    next(error);
  }
};

