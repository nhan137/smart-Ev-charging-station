const Booking = require('../models/Booking');
const Station = require('../models/Station');
const ChargingSession = require('../models/ChargingSession');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Get charging status for a booking
 * GET /api/bookings/:booking_id/charging/status
 */
exports.getChargingStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.booking_id;
    const userId = req.user.user_id;

    // 1. Verify user owns this booking
    const booking = await Booking.findOne({
      where: {
        booking_id: bookingId,
        user_id: userId
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or you do not have permission to view this booking'
      });
    }

    // 2. Get charging session data
    let chargingSession = await ChargingSession.findOne({
      where: { booking_id: bookingId }
    });

    // If no session exists, create one (when charging starts)
    if (!chargingSession && booking.status === 'charging') {
      chargingSession = await ChargingSession.create({
        booking_id: bookingId,
        start_battery_percent: null,
        energy_consumed: 0,
        started_at: booking.actual_start || new Date()
      });
    }

    // Get station info
    const station = await Station.findByPk(booking.station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    const pricePerKwh = parseFloat(station.price_per_kwh);
    
    const currentBatteryPercent = chargingSession?.start_battery_percent || null;
    const energyConsumed = chargingSession ? parseFloat(chargingSession.energy_consumed || 0) : 0;
    const estimatedCost = energyConsumed * pricePerKwh;

    // Calculate time remaining (from now to end_time)
    let timeRemaining = null;
    if (booking.end_time) {
      const endTime = new Date(booking.end_time);
      const now = new Date();
      const remaining = endTime - now;
      
      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining = `${hours} giờ ${minutes} phút`;
      } else {
        timeRemaining = '0 giờ 0 phút';
      }
    }

    // Socket.IO room identifier
    const socketRoom = `booking_${bookingId}`;

    res.status(200).json({
      success: true,
      data: {
        booking_id: booking.booking_id,
        station_name: station.station_name,
        status: booking.status,
        current_battery_percent: currentBatteryPercent,
        energy_consumed: parseFloat(energyConsumed.toFixed(3)),
        estimated_cost: parseFloat(estimatedCost.toFixed(2)),
        time_remaining: timeRemaining,
        socket_room: socketRoom,
        socket_url: process.env.SOCKET_URL || 'http://localhost:3000'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Internal API: Receive charging update from IoT Simulator
 * POST /internal/charging-update/:booking_id
 */
exports.receiveChargingUpdate = async (req, res, next) => {
  try {
    const bookingId = req.params.booking_id;
    const { energy_consumed, current_battery_percent } = req.body;

    // Validate input
    if (energy_consumed === undefined || current_battery_percent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'energy_consumed and current_battery_percent are required'
      });
    }

    // Get booking info
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get or create charging session
    let chargingSession = await ChargingSession.findOne({
      where: { booking_id: bookingId }
    });

    if (!chargingSession) {
      chargingSession = await ChargingSession.create({
        booking_id: bookingId,
        start_battery_percent: current_battery_percent,
        energy_consumed: energy_consumed,
        started_at: new Date()
      });
    } else {
      // Update existing session
      await chargingSession.update({
        start_battery_percent: current_battery_percent,
        energy_consumed: energy_consumed
      });
    }

    // Get station info
    const station = await Station.findByPk(booking.station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    const pricePerKwh = parseFloat(station.price_per_kwh);
    const estimatedCost = energy_consumed * pricePerKwh;

    // Calculate time remaining (from now to end_time)
    let timeRemaining = null;
    if (booking.end_time) {
      const endTime = new Date(booking.end_time);
      const now = new Date();
      const remaining = endTime - now;
      
      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        timeRemaining = `${hours} giờ ${minutes} phút`;
      } else {
        timeRemaining = '0 giờ 0 phút';
      }
    }

    // Prepare data for Socket.IO push
    const updateData = {
      booking_id: parseInt(bookingId),
      station_name: station.station_name,
      status: 'charging',
      current_battery_percent: current_battery_percent,
      energy_consumed: parseFloat(energy_consumed.toFixed(3)),
      estimated_cost: parseFloat(estimatedCost.toFixed(2)),
      time_remaining: timeRemaining
    };

    // Emit Socket.IO event to the booking room
    const io = req.app.get('io');
    if (io) {
      const socketRoom = `booking_${bookingId}`;
      io.to(socketRoom).emit('charging_update', updateData);
      console.log(`[Socket.IO] Emitted charging_update to room: ${socketRoom}`);
    }

    res.status(200).json({
      success: true,
      message: 'Charging update received and broadcasted',
      data: updateData
    });
  } catch (error) {
    next(error);
  }
};

