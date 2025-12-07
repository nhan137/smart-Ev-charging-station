const Booking = require('../models/Booking');
const Station = require('../models/Station');
const Promotion = require('../models/Promotion');
const Notification = require('../models/Notification');
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

