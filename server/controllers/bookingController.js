const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Promotion = require('../models/Promotion');
const Notification = require('../models/Notification');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

// Define Promotion association if not already defined
if (!Booking.associations.promotion) {
  Booking.belongsTo(Promotion, { foreignKey: 'promo_id', as: 'promotion' });
}

// Battery capacity mapping (kWh)
const BATTERY_CAPACITY = {
  'xe_may_usb': 5,
  'xe_may_ccs': 5,
  'oto_ccs': 50
};

/**
 * Create new booking
 * POST /api/bookings
 */
exports.createBooking = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { station_id, vehicle_type, start_time, end_time, promo_code } = req.body;
    const user_id = req.user.user_id;

    // Validate time range
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    // Check if end time is after start time (with at least 1 minute difference)
    const timeDiff = endDate.getTime() - startDate.getTime();
    if (timeDiff <= 0 || timeDiff < 60000) { // At least 1 minute (60000ms)
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time (minimum 1 minute)'
      });
    }

    if (startDate < new Date()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Start time cannot be in the past'
      });
    }

    // 0. Check if user already has pending or confirmed booking (prevent spam)
    const existingActiveBooking = await Booking.findOne({
      where: {
        user_id: user_id,
        status: { [Op.in]: ['pending', 'confirmed', 'charging'] }
      },
      transaction
    });

    if (existingActiveBooking) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có lịch đặt đang chờ xử lý hoặc đã được xác nhận. Vui lòng hủy lịch hiện tại hoặc đợi lịch đó hoàn thành trước khi đặt lịch mới.'
      });
    }

    // 1. Check station exists & has available slots (include manager_id)
    const station = await Station.findOne({
      where: {
        station_id: station_id,
        available_slots: { [Op.gt]: 0 },
        status: 'active'
      },
      attributes: ['station_id', 'station_name', 'price_per_kwh', 'station_type', 'manager_id'],
      transaction
    });

    if (!station) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Station not found or no slots available'
      });
    }

    // 2. Validate vehicle_type matches station_type
    const vehicleTypeMap = {
      'xe_may_usb': 'xe_may',
      'xe_may_ccs': 'xe_may',
      'oto_ccs': 'oto'
    };

    const requiredStationType = vehicleTypeMap[vehicle_type];
    
    if (!requiredStationType) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle type. Allowed: xe_may_usb, xe_may_ccs, oto_ccs'
      });
    }

    // Check if station supports this vehicle type
    if (station.station_type !== 'ca_hai' && station.station_type !== requiredStationType) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `This station (${station.station_type}) does not support ${vehicle_type}. Please choose a compatible station.`
      });
    }

    // 3. Calculate base cost
    const batteryCapacity = BATTERY_CAPACITY[vehicle_type];
    const baseCost = batteryCapacity * parseFloat(station.price_per_kwh);
    let discountAmount = 0;
    let promoId = null;
    let totalCost = baseCost;

    // 4. Validate & apply promo code (if provided)
    if (promo_code) {
      const now = new Date();
      const promotion = await Promotion.findOne({
        where: {
          code: promo_code,
          status: 'active',
          valid_from: { [Op.lte]: now },
          valid_to: { [Op.gte]: now }
        },
        transaction
      });

      if (!promotion) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired promo code'
        });
      }

      // Check min_amount requirement
      if (promotion.min_amount && baseCost < parseFloat(promotion.min_amount)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Promo code requires minimum order of ${promotion.min_amount}`
        });
      }

      // Calculate discount
      let discount = (baseCost * promotion.discount_percent) / 100;
      
      // Apply max_discount limit
      if (promotion.max_discount && discount > parseFloat(promotion.max_discount)) {
        discount = parseFloat(promotion.max_discount);
      }

      discountAmount = discount;
      totalCost = baseCost - discountAmount;
      promoId = promotion.promo_id;
    }

    // 5. Create booking
    const booking = await Booking.create({
      user_id,
      station_id,
      promo_id: promoId,
      vehicle_type,
      start_time: startDate,
      end_time: endDate,
      total_cost: totalCost,
      status: 'pending'
    }, { transaction });

    // 6. Update station available_slots (atomic update to prevent race condition)
    await Station.update(
      { available_slots: sequelize.literal('available_slots - 1') },
      { 
        where: { station_id: station_id },
        transaction 
      }
    );

    // 7. Create notification for User
    await Notification.create({
      user_id,
      title: 'Đặt lịch thành công',
      message: `Lịch sạc của bạn đã được tạo tại ${station.station_name}`,
      type: 'booking'
    }, { transaction });

    // 8. Create notification for Manager (nếu trạm có manager)
    if (station.manager_id) {
      // Lấy thông tin user để hiển thị tên trong notification
      const user = await User.findByPk(user_id, {
        attributes: ['full_name'],
        transaction
      });
      const userName = user ? user.full_name : 'Người dùng';

      await Notification.create({
        user_id: station.manager_id,
        title: 'Có đặt lịch mới cần xác nhận',
        message: `Khách hàng ${userName} đã đặt lịch tại trạm ${station.station_name}. Vui lòng vào xác nhận.`,
        type: 'booking'
      }, { transaction });
    }

    // Commit transaction
    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking_id: booking.booking_id,
        station_name: station.station_name,
        vehicle_type: booking.vehicle_type,
        start_time: booking.start_time,
        end_time: booking.end_time,
        base_cost: parseFloat(baseCost.toFixed(2)),
        discount_amount: parseFloat(discountAmount.toFixed(2)),
        total_cost: parseFloat(totalCost.toFixed(2)),
        status: booking.status
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Get user's booking history
 * GET /api/bookings/my
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { status, from_date, to_date, station_id } = req.query;

    // Build WHERE conditions
    const whereConditions = {
      user_id: userId
    };

    // Apply status filter
    if (status && (status === 'completed' || status === 'cancelled')) {
      whereConditions.status = status;
    }

    // Apply station_id filter
    if (station_id) {
      whereConditions.station_id = parseInt(station_id);
    }

    // Build date filter
    const dateFilter = {};
    if (from_date) {
      dateFilter[Op.gte] = new Date(from_date);
    }
    if (to_date) {
      dateFilter[Op.lte] = new Date(to_date + ' 23:59:59');
    }
    if (Object.keys(dateFilter).length > 0) {
      whereConditions.start_time = dateFilter;
    }

    // Query with JOINs using Sequelize
    const bookings = await Booking.findAll({
      where: whereConditions,
      include: [
        {
          model: Station,
          as: 'station',
          attributes: ['station_name', 'address', 'price_per_kwh'],
          required: true
        },
        {
          model: ChargingSession,
          as: 'chargingSession',
          required: false,
          attributes: ['start_battery_percent', 'end_battery_percent', 'energy_consumed', 'actual_cost', 'started_at', 'ended_at']
        },
        {
          model: Payment,
          as: 'payment',
          required: false,
          attributes: ['method', 'status', 'payment_date']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Format response
    const formattedBookings = bookings.map(booking => {
      const station = booking.station;
      const chargingSession = booking.chargingSession;
      const payment = booking.payment;

      // Calculate duration
      let duration = null;
      if (booking.actual_start && booking.actual_end) {
        const start = new Date(booking.actual_start);
        const end = new Date(booking.actual_end);
        const diffMinutes = Math.floor((end - start) / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      }

      // Format battery range (format: "20% - 80%" để match UI)
      let batteryRange = null;
      if (chargingSession) {
        const startBattery = chargingSession.start_battery_percent || 0;
        const endBattery = chargingSession.end_battery_percent || startBattery;
        batteryRange = `${startBattery}% - ${endBattery}%`;
      }

      // Get total cost (prefer actual_cost, fallback to booking.total_cost)
      const totalCost = chargingSession?.actual_cost 
        ? parseFloat(chargingSession.actual_cost) 
        : (booking.total_cost ? parseFloat(booking.total_cost) : null);

      // Format charging date (use actual_start if available, else start_time)
      let chargingDate = null;
      const dateToFormat = booking.actual_start || booking.start_time;
      if (dateToFormat) {
        const date = new Date(dateToFormat);
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        chargingDate = `${day}/${month}/${year}`;
      }

      // Format vehicle type for display
      const vehicleTypeMap = {
        'xe_may_usb': 'Xe máy USB',
        'xe_may_ccs': 'Xe máy CCS',
        'oto_ccs': 'Ô tô CCS'
      };
      const vehicleTypeDisplay = vehicleTypeMap[booking.vehicle_type] || booking.vehicle_type;

      // Format payment method (uppercase)
      const paymentMethodDisplay = payment?.method ? payment.method.toUpperCase() : null;

      // Format payment status for display
      const paymentStatusMap = {
        'success': 'Thành công',
        'pending': 'Đang xử lý',
        'failed': 'Thất bại'
      };
      const paymentStatusDisplay = payment?.status ? paymentStatusMap[payment.status] || payment.status : null;

      // Format booking status for display
      const bookingStatusMap = {
        'completed': 'Hoàn thành',
        'charging': 'Đang sạc',
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'cancelled': 'Đã hủy'
      };
      const bookingStatusDisplay = bookingStatusMap[booking.status] || booking.status;

      return {
        booking_id: booking.booking_id,
        station_name: station?.station_name || null,
        station_address: station?.address || null,
        vehicle_type: booking.vehicle_type,
        vehicle_type_display: vehicleTypeDisplay,
        start_time: booking.start_time,
        end_time: booking.end_time,
        actual_start: booking.actual_start,
        actual_end: booking.actual_end,
        charging_date: chargingDate,
        duration: duration,
        battery_range: batteryRange,
        energy_consumed: chargingSession?.energy_consumed 
          ? parseFloat(chargingSession.energy_consumed) 
          : null,
        total_cost: totalCost,
        payment_method: payment?.method || null,
        payment_method_display: paymentMethodDisplay,
        payment_status: payment?.status || null,
        payment_status_display: paymentStatusDisplay,
        payment_date: payment?.payment_date || null,
        booking_status: booking.status,
        booking_status_display: bookingStatusDisplay,
        created_at: booking.created_at
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
 * Get booking detail by ID (for user)
 * GET /api/bookings/:booking_id
 * 
 * Mục đích: Lấy chi tiết booking để hiển thị modal "Chi tiết đặt lịch"
 */
exports.getBookingById = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { booking_id } = req.params;

    const booking = await Booking.findOne({
      where: {
        booking_id: parseInt(booking_id),
        user_id: userId // Chỉ lấy booking của chính user đó
      },
      include: [
        {
          model: Station,
          as: 'station',
          attributes: ['station_id', 'station_name', 'address'],
          required: true
        },
        {
          model: ChargingSession,
          as: 'chargingSession',
          required: false,
          attributes: ['start_battery_percent', 'end_battery_percent', 'energy_consumed', 'actual_cost', 'started_at', 'ended_at']
        },
        {
          model: Payment,
          as: 'payment',
          required: false,
          attributes: ['payment_id', 'method', 'status', 'amount', 'payment_date']
        },
        {
          model: Promotion,
          as: 'promotion',
          required: false,
          attributes: ['promo_id', 'code', 'title', 'discount_percent']
        }
      ]
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to view this booking'
      });
    }

    const bookingData = booking.toJSON();
    const station = bookingData.station;
    const chargingSession = bookingData.chargingSession;
    const payment = bookingData.payment;
    const promotion = bookingData.promotion;

    // Calculate duration
    let duration = null;
    if (bookingData.actual_start && bookingData.actual_end) {
      const start = new Date(bookingData.actual_start);
      const end = new Date(bookingData.actual_end);
      const diffMinutes = Math.floor((end - start) / (1000 * 60));
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }

    // Format vehicle type
    const vehicleTypeMap = {
      'xe_may_usb': 'Xe máy USB',
      'xe_may_ccs': 'Xe máy CCS',
      'oto_ccs': 'Ô tô CCS'
    };
    const vehicleTypeDisplay = vehicleTypeMap[bookingData.vehicle_type] || bookingData.vehicle_type;

    // Format payment method
    const paymentMethodDisplay = payment?.method ? payment.method.toUpperCase() : null;

    // Format payment status
    const paymentStatusMap = {
      'success': 'Thành công',
      'pending': 'Đang xử lý',
      'failed': 'Thất bại'
    };
    const paymentStatusDisplay = payment?.status ? paymentStatusMap[payment.status] || payment.status : null;

    // Format dates
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

    // Get total cost (prefer actual_cost, fallback to booking.total_cost)
    const totalCost = chargingSession?.actual_cost 
      ? parseFloat(chargingSession.actual_cost) 
      : (bookingData.total_cost ? parseFloat(bookingData.total_cost) : null);

    // Format response to match UI modal
    const formattedResponse = {
      // Thông tin trạm
      station_info: {
        station_name: station?.station_name || null,
        address: station?.address || null,
        vehicle_type: vehicleTypeDisplay
      },
      // Thời gian sạc
      charging_time: {
        start: formatDateTime(bookingData.actual_start || bookingData.start_time),
        end: formatDateTime(bookingData.actual_end || bookingData.end_time),
        duration: duration
      },
      // Năng lượng
      energy_info: {
        start_battery: chargingSession?.start_battery_percent || null,
        end_battery: chargingSession?.end_battery_percent || null,
        energy_consumed: chargingSession?.energy_consumed 
          ? parseFloat(chargingSession.energy_consumed) 
          : null
      },
      // Thanh toán
      payment_info: {
        method: paymentMethodDisplay,
        status: paymentStatusDisplay,
        status_raw: payment?.status || null,
        discount_code: promotion?.code || null,
        total_amount: totalCost
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
 * Get user's booking list (for "Lịch sử đặt lịch" screen)
 * GET /api/bookings/my-bookings
 * 
 * Khác với getMyBookings: API này dùng cho màn hình "Lịch sử đặt lịch" (Hình 13)
 * - Hiển thị tất cả bookings (pending, confirmed, completed, cancelled)
 * - Có checkin_code để user nhập vào modal
 * - Không cần charging session và payment details
 */
exports.getMyBookingList = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { status, startDate, endDate, stationId } = req.query;

    // Build WHERE conditions
    const whereConditions = {
      user_id: userId
    };

    // Apply status filter (nếu có)
    if (status && status !== 'all' && status !== '') {
      whereConditions.status = status;
    }

    // Apply date range filter
    if (startDate || endDate) {
      whereConditions.start_time = {};
      if (startDate) {
        // Start of day for startDate
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereConditions.start_time[Op.gte] = start;
      }
      if (endDate) {
        // End of day for endDate
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereConditions.start_time[Op.lte] = end;
      }
    }

    // Build include conditions for station filter
    const includeConditions = [
      {
        model: Station,
        as: 'station',
        attributes: ['station_id', 'station_name', 'address'],
        required: true
      }
    ];

    // Apply station filter
    if (stationId) {
      includeConditions[0].where = {
        station_id: parseInt(stationId)
      };
    }

    // Query bookings with station info
    const bookings = await Booking.findAll({
      where: whereConditions,
      include: includeConditions,
      order: [['created_at', 'DESC']]
    });

    // Format response
    const formattedBookings = bookings.map(booking => {
      const station = booking.station;

      // Format vehicle type for display
      const vehicleTypeMap = {
        'xe_may_usb': 'Xe máy USB',
        'xe_may_ccs': 'Xe máy CCS',
        'oto_ccs': 'Ô tô CCS'
      };
      const vehicleTypeDisplay = vehicleTypeMap[booking.vehicle_type] || booking.vehicle_type;

      // Format booking status for display
      const bookingStatusMap = {
        'completed': 'Hoàn thành',
        'charging': 'Đang sạc',
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'cancelled': 'Đã hủy'
      };
      const bookingStatusDisplay = bookingStatusMap[booking.status] || booking.status;

      // Format dates
      const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const formatTime = (date) => {
        if (!date) return null;
        const d = new Date(date);
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      return {
        booking_id: booking.booking_id,
        station_name: station?.station_name || null,
        station_address: station?.address || null,
        vehicle_type: booking.vehicle_type,
        vehicle_type_display: vehicleTypeDisplay,
        booking_date: formatDate(booking.created_at),
        start_time: booking.start_time, // Return raw datetime for frontend parsing
        end_time: booking.end_time, // Return raw datetime for frontend parsing
        created_at: booking.created_at,
        status: booking.status,
        booking_status: booking.status,
        booking_status_display: bookingStatusDisplay,
        checkin_code: booking.checkin_code || null, // Có checkin_code để nhập vào modal
        // Removed total_cost - not needed in booking history list
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
 * Verify check-in code for a booking
 * POST /api/bookings/:booking_id/verify-checkin
 * 
 * Flow: User nhập mã check-in → Verify → Nếu đúng → Cho phép bắt đầu sạc
 */
exports.verifyCheckinCode = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { booking_id } = req.params;
    const { checkin_code } = req.body;

    // Validate input
    if (!checkin_code) {
      return res.status(400).json({
        success: false,
        message: 'Mã check-in là bắt buộc'
      });
    }

    // Find booking
    const booking = await Booking.findOne({
      where: {
        booking_id: parseInt(booking_id),
        user_id: userId // Chỉ user sở hữu booking mới verify được
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch đặt hoặc bạn không có quyền truy cập'
      });
    }

    // Check if booking is in correct status
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: `Lịch đặt này không thể bắt đầu sạc. Trạng thái hiện tại: ${booking.status}`
      });
    }

    // Verify check-in code (case-insensitive)
    if (!booking.checkin_code || booking.checkin_code.toUpperCase() !== checkin_code.toUpperCase().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã check-in không đúng. Vui lòng kiểm tra lại.'
      });
    }

    // Code is valid - Start charging by updating booking status
    const ChargingSession = require('../models/ChargingSession');
    const { sequelize } = require('../config/database');
    const transaction = await sequelize.transaction();

    try {
      // Update booking status to 'charging'
      await booking.update({
        status: 'charging',
        actual_start: new Date()
      }, { transaction });

      // Create charging session if it doesn't exist
      let chargingSession = await ChargingSession.findOne({
        where: { booking_id: booking.booking_id },
        transaction
      });

      if (!chargingSession) {
        chargingSession = await ChargingSession.create({
          booking_id: booking.booking_id,
          start_battery_percent: null, // Will be set by first IoT update
          energy_consumed: 0,
          started_at: new Date()
        }, { transaction });
      }

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Mã check-in hợp lệ. Bắt đầu sạc...',
        data: {
          booking_id: booking.booking_id,
          status: 'charging',
          can_start_charging: true,
          station_id: booking.station_id
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status (for testing purposes)
 * PUT /api/bookings/:booking_id/status
 * 
 * Flow: Cập nhật status booking để test thanh toán
 * Body: { "status": "completed" | "charging" }
 */
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { booking_id } = req.params;
    const { status } = req.body;

    // Validate status
    const allowedStatuses = ['pending', 'confirmed', 'charging', 'completed', 'cancelled'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status phải là một trong: ${allowedStatuses.join(', ')}`
      });
    }

    // Find booking
    const booking = await Booking.findOne({
      where: {
        booking_id: parseInt(booking_id),
        user_id: userId // Chỉ user sở hữu booking mới cập nhật được
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch đặt hoặc bạn không có quyền cập nhật'
      });
    }

    // Store old status before update
    const oldStatus = booking.status;

    // Update status
    await booking.update({
      status: status
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái thành công',
      data: {
        booking_id: booking.booking_id,
        old_status: oldStatus,
        new_status: status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel booking by user
 * PUT /api/bookings/:booking_id/cancel-by-user
 * 
 * Flow: User nhấn nút "Hủy" → Hủy booking → Restore slots → Notify manager
 */
exports.cancelBookingByUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const userId = req.user.user_id;
    const { booking_id } = req.params;

    // Find booking
    const booking = await Booking.findOne({
      where: {
        booking_id: parseInt(booking_id),
        user_id: userId // Chỉ user sở hữu booking mới hủy được
      },
      transaction
    });

    if (!booking) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lịch đặt hoặc bạn không có quyền hủy'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Lịch đặt này đã được hủy trước đó'
      });
    }

    if (booking.status === 'completed') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy lịch đặt đã hoàn thành'
      });
    }

    if (booking.status === 'charging') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Không thể hủy lịch đặt đang trong quá trình sạc'
      });
    }

    // Store old status for slot restoration
    const oldStatus = booking.status;

    // Update booking status
    await booking.update({
      status: 'cancelled'
    }, { transaction });

    // Restore available_slots if booking was pending or confirmed
    if (oldStatus === 'pending' || oldStatus === 'confirmed') {
      await Station.update(
        {
          available_slots: sequelize.literal(`
            CASE 
              WHEN available_slots < total_slots 
              THEN available_slots + 1 
              ELSE total_slots 
            END
          `)
        },
        {
          where: { station_id: booking.station_id },
          transaction
        }
      );
    }

    // Get station and manager info for notification
    const station = await Station.findByPk(booking.station_id, { transaction });
    const user = await User.findByPk(userId, { transaction });

    // Notify manager (if station has manager)
    if (station && station.manager_id) {
      await Notification.create({
        user_id: station.manager_id,
        title: 'Lịch đặt đã bị hủy',
        message: `Người dùng ${user?.full_name || 'N/A'} đã hủy lịch đặt #${booking.booking_id} tại trạm ${station.station_name}.`,
        type: 'system',
        status: 'unread'
      }, { transaction });
    }

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: 'Đã hủy lịch đặt sạc thành công'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

