const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Promotion = require('../models/Promotion');
const Notification = require('../models/Notification');
const ChargingSession = require('../models/ChargingSession');
const Payment = require('../models/Payment');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

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

    if (startDate >= endDate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    if (startDate < new Date()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Start time cannot be in the past'
      });
    }

    // 1. Check station exists & has available slots
    const station = await Station.findOne({
      where: {
        station_id: station_id,
        available_slots: { [Op.gt]: 0 },
        status: 'active'
      },
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

    // 6. Update station available_slots
    await station.update({
      available_slots: station.available_slots - 1
    }, { transaction });

    // 7. Create notification
    await Notification.create({
      user_id,
      title: 'Đặt lịch thành công',
      message: `Lịch sạc của bạn đã được tạo tại ${station.station_name}`,
      type: 'booking'
    }, { transaction });

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

      // Format battery range
      let batteryRange = null;
      if (chargingSession) {
        const startBattery = chargingSession.start_battery_percent || 0;
        const endBattery = chargingSession.end_battery_percent || startBattery;
        batteryRange = `${startBattery}% → ${endBattery}%`;
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

