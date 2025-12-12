const Booking = require('../models/Booking');
const User = require('../models/User');
const Station = require('../models/Station');
const Payment = require('../models/Payment');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

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
        pending,
        charging,
        completed
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

    // If search is provided, filter by user full_name or booking_id
    if (search) {
      const searchNum = parseInt(search);
      if (!isNaN(searchNum) && searchNum.toString() === search.trim()) {
        // Search by booking_id (exact match)
        where.booking_id = searchNum;
      } else {
        // Search by user full_name
        userInclude.where = {
          full_name: { [Op.like]: `%${search}%` }
        };
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
        user_name: bookingData.user?.full_name || null,
        user_phone: bookingData.user?.phone || null,
        station_id: bookingData.station_id,
        station_name: bookingData.station?.station_name || null,
        vehicle_type: bookingData.vehicle_type,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        actual_start: bookingData.actual_start,
        actual_end: bookingData.actual_end,
        status: bookingData.status,
        total_cost: bookingData.total_cost,
        created_at: bookingData.created_at,
        payment_method: bookingData.payment?.method || null,
        payment_status: bookingData.payment?.status || null
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

    const bookingData = booking.toJSON();

    // Format response to match UI modal
    const formattedResponse = {
      booking_info: {
        booking_id: bookingData.booking_id,
        booking_code: `#${bookingData.booking_id}`,
        status: bookingData.status,
        vehicle_type: bookingData.vehicle_type,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        actual_start: bookingData.actual_start,
        actual_end: bookingData.actual_end,
        total_cost: bookingData.total_cost,
        created_at: bookingData.created_at
      },
      customer_info: {
        user_id: bookingData.user_id,
        full_name: bookingData.user?.full_name || null,
        phone: bookingData.user?.phone || null,
        email: bookingData.user?.email || null
      },
      station_info: {
        station_id: bookingData.station_id,
        station_name: bookingData.station?.station_name || null,
        address: bookingData.station?.address || null
      },
      payment_info: {
        payment_id: bookingData.payment?.payment_id || null,
        method: bookingData.payment?.method || null,
        status: bookingData.payment?.status || null,
        amount: bookingData.payment?.amount || null,
        payment_date: bookingData.payment?.payment_date || null
      },
      system_info: {
        created_at: bookingData.created_at,
        updated_at: bookingData.created_at // Assuming no updated_at field
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
      total_cost: bookingData.total_cost,
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

