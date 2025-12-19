const Booking = require('../models/Booking');
const Station = require('../models/Station');
const ChargingSession = require('../models/ChargingSession');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const chargingMonitor = require('../utils/chargingMonitor');

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
    
    // Get battery percent (use current from session or from latest update)
    // For active charging, use start_battery_percent as current if no end_battery_percent
    const currentBatteryPercent = chargingSession 
      ? (chargingSession.end_battery_percent || chargingSession.start_battery_percent || null)
      : null;
    
    const energyConsumed = chargingSession ? parseFloat(chargingSession.energy_consumed || 0) : 0;
    const estimatedCost = energyConsumed * pricePerKwh;
    // Calculate actual_cost: if session has actual_cost (completed), use it; otherwise calculate from energy_consumed
    let actualCost = null;
    if (chargingSession) {
      if (chargingSession.actual_cost !== null && chargingSession.actual_cost !== undefined) {
        actualCost = parseFloat(chargingSession.actual_cost);
      } else {
        // Still charging, calculate from current energy
        actualCost = parseFloat((energyConsumed * pricePerKwh).toFixed(2));
      }
    } else {
      // No session, calculate from current energy
      actualCost = parseFloat((energyConsumed * pricePerKwh).toFixed(2));
    }

    // Calculate time remaining based on battery % and charging rate
    let timeRemaining = null;
    const now = new Date();
    
    // If charging is complete, show 0
    if (booking.status === 'completed' || (currentBatteryPercent && currentBatteryPercent >= 100)) {
      timeRemaining = '0 giờ 0 phút';
    } else if (chargingSession && chargingSession.started_at && currentBatteryPercent && currentBatteryPercent > 0) {
      // Calculate based on charging rate
      const startBattery = chargingSession.start_battery_percent || 0;
      const batteryIncrease = currentBatteryPercent - startBattery;
      
      if (batteryIncrease > 0) {
        const timeElapsed = (now - new Date(chargingSession.started_at)) / 1000; // seconds
        const batteryPerSecond = batteryIncrease / timeElapsed; // % per second
        const batteryRemaining = 100 - currentBatteryPercent;
        const secondsRemaining = batteryRemaining / batteryPerSecond;
        
        if (secondsRemaining > 0 && isFinite(secondsRemaining)) {
          const hours = Math.floor(secondsRemaining / 3600);
          const minutes = Math.floor((secondsRemaining % 3600) / 60);
          timeRemaining = `${hours} giờ ${minutes} phút`;
        } else {
          timeRemaining = 'Đang tính toán...';
        }
      } else {
        // Fallback to booking end_time if no charging progress yet
        if (booking.end_time) {
          const endTime = new Date(booking.end_time);
          const remaining = endTime - now;
          if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = `${hours} giờ ${minutes} phút`;
          } else {
            timeRemaining = '0 giờ 0 phút';
          }
        } else {
          timeRemaining = 'Đang tính toán...';
        }
      }
    } else {
      // No charging session yet, use booking end_time
      if (booking.end_time) {
        const endTime = new Date(booking.end_time);
        const remaining = endTime - now;
        if (remaining > 0) {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          timeRemaining = `${hours} giờ ${minutes} phút`;
        } else {
          timeRemaining = '0 giờ 0 phút';
        }
      } else {
        timeRemaining = 'Đang tính toán...';
      }
    }

    // Socket.IO room identifier
    const socketRoom = `booking_${bookingId}`;

    const isCompleted = booking.status === 'completed' || chargingSession?.ended_at !== null;

    res.status(200).json({
      success: true,
      data: {
        booking_id: booking.booking_id,
        station_name: station.station_name,
        status: booking.status,
        current_battery_percent: currentBatteryPercent,
        start_battery_percent: chargingSession?.start_battery_percent || null,
        end_battery_percent: chargingSession?.end_battery_percent || null,
        energy_consumed: parseFloat(energyConsumed.toFixed(3)),
        estimated_cost: parseFloat(estimatedCost.toFixed(2)),
        actual_cost: actualCost ? parseFloat(parseFloat(actualCost).toFixed(2)) : null,
        time_remaining: timeRemaining,
        started_at: chargingSession?.started_at || null,
        ended_at: chargingSession?.ended_at || null,
        is_completed: isCompleted,
        socket_room: socketRoom,
        socket_url: process.env.SOCKET_URL || 'http://localhost:3000',
        vehicle_type: booking.vehicle_type || null,
        actual_cost: actualCost || null // Include actual_cost in response
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
    const bookingIdRaw = req.params.booking_id;
    const bookingId = parseInt(bookingIdRaw);
    const { energy_consumed, current_battery_percent } = req.body;

    // Validate input
    if (energy_consumed === undefined || current_battery_percent === undefined) {
      return res.status(400).json({
        success: false,
        message: 'energy_consumed and current_battery_percent are required'
      });
    }

    // Validate booking_id
    if (!bookingIdRaw || isNaN(bookingId) || bookingId <= 0) {
      console.error(`[ChargingController] ❌ Invalid booking_id received: ${bookingIdRaw} (parsed: ${bookingId})`);
      return res.status(400).json({
        success: false,
        message: `Invalid booking_id: ${bookingIdRaw}. Must be a positive integer.`
      });
    }

    console.log(`[ChargingController] ✅ Received update for booking ${bookingId}: battery=${current_battery_percent}%, energy=${energy_consumed}kWh`);

    // Get booking info with vehicle_type
    const booking = await Booking.findByPk(bookingId, {
      attributes: ['booking_id', 'user_id', 'station_id', 'vehicle_type', 'status', 'start_time', 'end_time', 'actual_start', 'actual_end']
    });

    if (!booking) {
      console.error(`[ChargingController] ❌ Booking ${bookingId} NOT FOUND in database`);
      console.error(`[ChargingController] 💡 Please check: SELECT * FROM bookings WHERE booking_id = ${bookingId};`);
      return res.status(404).json({
        success: false,
        message: `Booking ${bookingId} not found. Please ensure the booking exists in database with status 'confirmed' or 'charging'.`
      });
    }

    // Validate booking status
    if (booking.status !== 'confirmed' && booking.status !== 'charging' && booking.status !== 'completed') {
      console.warn(`[ChargingController] ⚠️  Booking ${bookingId} has status '${booking.status}', expected 'confirmed' or 'charging'`);
    } else {
      console.log(`[ChargingController] ✅ Booking ${bookingId} found with status: ${booking.status}`);
    }

    // Get or create charging session
    let chargingSession = await ChargingSession.findOne({
      where: { booking_id: bookingId }
    });

    // Get station info
    const station = await Station.findByPk(booking.station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    const pricePerKwh = parseFloat(station.price_per_kwh);

    // Check if battery is already at 100% (prevent charging if already full)
    if (current_battery_percent >= 100 && chargingSession && !chargingSession.ended_at) {
      // Auto-complete if battery is already at 100%
      const now = new Date();
      await chargingSession.update({
        end_battery_percent: 100,
        ended_at: now,
        actual_cost: parseFloat(chargingSession.energy_consumed || 0) * pricePerKwh
      });
      await booking.update({
        status: 'completed',
        actual_end: now
      });

      // Emit completion event
      const io = req.app.get('io');
      if (io) {
        const socketRoom = `booking_${bookingId}`;
        io.to(socketRoom).emit('charging_completed', {
          booking_id: parseInt(bookingId),
          status: 'completed',
          current_battery_percent: 100,
          is_completed: true,
          message: 'Battery is already at 100%. Charging cannot continue.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Battery is already at 100%. Charging cannot continue.',
        data: {
          is_completed: true,
          current_battery_percent: 100
        }
      });
    }

    // Check if charging is completed
    const now = new Date();
    const isChargingComplete = 
      current_battery_percent >= 100 || 
      (booking.end_time && new Date(booking.end_time) <= now) ||
      booking.status === 'completed';

    // Ensure booking status is 'charging' when receiving updates
    if (booking.status === 'confirmed') {
      await booking.update({
        status: 'charging',
        actual_start: booking.actual_start || now
      });
    }

    if (!chargingSession) {
      // Create new session
      const sessionData = {
        booking_id: bookingId,
        start_battery_percent: current_battery_percent,
        energy_consumed: energy_consumed,
        started_at: booking.actual_start || now
      };

      // If charging is already complete, set end values
      if (isChargingComplete) {
        sessionData.end_battery_percent = current_battery_percent;
        sessionData.ended_at = now;
        sessionData.actual_cost = energy_consumed * pricePerKwh;
      }

      chargingSession = await ChargingSession.create(sessionData);
    } else {
      // Update existing session
      const updateData = {
        energy_consumed: energy_consumed
      };

      // Only update start_battery_percent if it's null (first update)
      if (chargingSession.start_battery_percent === null) {
        updateData.start_battery_percent = current_battery_percent;
      }

      // If charging is complete and not already ended, set end values
      if (isChargingComplete && !chargingSession.ended_at) {
        updateData.end_battery_percent = current_battery_percent;
        updateData.ended_at = now;
        updateData.actual_cost = energy_consumed * pricePerKwh;
      }

      await chargingSession.update(updateData);
    }

    // CRITICAL: Update booking status to 'completed' if charging is complete
    // This MUST happen before emitting Socket.IO events to ensure DB is updated
    if (isChargingComplete) {
      // Force update booking status to 'completed' regardless of current status
      await booking.update({
        status: 'completed',
        actual_end: now
      });
      // Also ensure charging session is marked as ended
      if (chargingSession && !chargingSession.ended_at) {
        await chargingSession.update({
          end_battery_percent: current_battery_percent,
          ended_at: now,
          actual_cost: energy_consumed * pricePerKwh
        });
      }
      // Remove from monitoring when completed
      chargingMonitor.removeTracking(bookingId);
      console.log(`[ChargingController] Updated booking ${bookingId} to COMPLETED status (battery: ${current_battery_percent}%)`);
    }

    const estimatedCost = energy_consumed * pricePerKwh;
    // Calculate actual cost based on actual energy consumed
    // CRITICAL: actual_cost should always be calculated from energy_consumed, not estimated
    let actualCost = null;
    if (chargingSession) {
      // If charging is complete, use actual_cost from session (already calculated)
      if (isChargingComplete && chargingSession.actual_cost !== null && chargingSession.actual_cost !== undefined) {
        actualCost = parseFloat(chargingSession.actual_cost);
      } else {
        // If still charging, calculate from current energy_consumed
        actualCost = parseFloat((energy_consumed * pricePerKwh).toFixed(2));
      }
    } else {
      // No session yet, calculate from current energy_consumed
      actualCost = parseFloat((energy_consumed * pricePerKwh).toFixed(2));
    }

    // Calculate time remaining based on battery % and charging rate
    let timeRemaining = null;
    
    // If charging is complete, show 0
    if (isChargingComplete || current_battery_percent >= 100) {
      timeRemaining = '0 giờ 0 phút';
    } else if (chargingSession && chargingSession.started_at && current_battery_percent > 0) {
      // Calculate based on charging rate
      const startBattery = chargingSession.start_battery_percent || 0;
      const batteryIncrease = current_battery_percent - startBattery;
      
      if (batteryIncrease > 0) {
        const timeElapsed = (now - new Date(chargingSession.started_at)) / 1000; // seconds
        const batteryPerSecond = batteryIncrease / timeElapsed; // % per second
        const batteryRemaining = 100 - current_battery_percent;
        const secondsRemaining = batteryRemaining / batteryPerSecond;
        
        if (secondsRemaining > 0 && isFinite(secondsRemaining)) {
          const hours = Math.floor(secondsRemaining / 3600);
          const minutes = Math.floor((secondsRemaining % 3600) / 60);
          timeRemaining = `${hours} giờ ${minutes} phút`;
        } else {
          timeRemaining = 'Đang tính toán...';
        }
      } else {
        // Fallback to booking end_time if no charging progress yet
        if (booking.end_time) {
          const endTime = new Date(booking.end_time);
          const remaining = endTime - now;
          if (remaining > 0) {
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = `${hours} giờ ${minutes} phút`;
          } else {
            timeRemaining = '0 giờ 0 phút';
          }
        } else {
          timeRemaining = 'Đang tính toán...';
        }
      }
    } else {
      // No charging session yet, use booking end_time
      if (booking.end_time) {
        const endTime = new Date(booking.end_time);
        const remaining = endTime - now;
        if (remaining > 0) {
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          timeRemaining = `${hours} giờ ${minutes} phút`;
        } else {
          timeRemaining = '0 giờ 0 phút';
        }
      } else {
        timeRemaining = 'Đang tính toán...';
      }
    }

    // Prepare data for Socket.IO push
    const updateData = {
      booking_id: parseInt(bookingId),
      station_name: station.station_name,
      status: isChargingComplete ? 'completed' : 'charging',
      current_battery_percent: current_battery_percent,
      start_battery_percent: chargingSession.start_battery_percent || null,
      end_battery_percent: isChargingComplete ? current_battery_percent : (chargingSession.end_battery_percent || null),
      energy_consumed: parseFloat(parseFloat(energy_consumed).toFixed(3)),
      estimated_cost: parseFloat(parseFloat(estimatedCost).toFixed(2)),
      actual_cost: actualCost ? parseFloat(parseFloat(actualCost).toFixed(2)) : null, // Always include actual_cost when available
      time_remaining: timeRemaining,
      is_completed: isChargingComplete,
      vehicle_type: booking.vehicle_type || null
    };

    // Record update timestamp for monitoring
    chargingMonitor.recordUpdate(bookingId);

    // Emit Socket.IO event to the booking room
    const io = req.app.get('io');
    if (io) {
      const socketRoom = `booking_${bookingId}`;
      const socketsInRoom = await io.in(socketRoom).fetchSockets();
      const roomClientsCount = socketsInRoom.length;
      
      // Always emit charging_update to the specific booking room
      io.to(socketRoom).emit('charging_update', updateData);
      console.log(`[Socket.IO] ✅ Emitted charging_update to room: ${socketRoom}`, {
        booking_id: updateData.booking_id,
        battery: updateData.current_battery_percent,
        energy: updateData.energy_consumed,
        cost: updateData.estimated_cost,
        actual_cost: updateData.actual_cost,
        status: updateData.status,
        room_clients: roomClientsCount
      });
      
      // CRITICAL: If charging is complete, also emit charging_completed event
      if (isChargingComplete) {
        io.to(socketRoom).emit('charging_completed', updateData);
        console.log(`[Socket.IO] ✅ Emitted charging_completed to room: ${socketRoom} (battery: ${current_battery_percent}%)`);
      }
      
      // Fallback: If no clients in room, broadcast to all (frontend will filter by booking_id)
      if (roomClientsCount === 0) {
        console.warn(`[Socket.IO] ⚠️  No clients in room ${socketRoom}, broadcasting to all sockets as fallback`);
        io.emit('charging_update_all', { ...updateData, booking_id: parseInt(bookingId) });
        if (isChargingComplete) {
          io.emit('charging_completed_all', { ...updateData, booking_id: parseInt(bookingId) });
        }
      }
    } else {
      console.error('[Socket.IO] ❌ io instance not found in receiveChargingUpdate!');
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

/**
 * Handle charging stop signal from IoT Simulator
 * POST /internal/charging-stop/:booking_id
 * 
 * Called when IoT Simulator is stopped (Ctrl+C or natural completion)
 */
exports.handleChargingStop = async (req, res, next) => {
  try {
    const bookingId = req.params.booking_id;
    const { reason, final_battery_percent, final_energy_consumed } = req.body;

    // Get booking info
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Only process if booking is currently charging
    if (booking.status !== 'charging') {
      return res.status(200).json({
        success: true,
        message: 'Booking is not in charging status',
        data: { status: booking.status }
      });
    }

    // Get charging session
    let chargingSession = await ChargingSession.findOne({
      where: { booking_id: bookingId }
    });

    // Get station info
    const station = await Station.findByPk(booking.station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    const pricePerKwh = parseFloat(station.price_per_kwh);

    const now = new Date();
    
    // Use provided final values or current session values
    const endBatteryPercent = final_battery_percent !== null && final_battery_percent !== undefined
      ? final_battery_percent
      : (chargingSession?.end_battery_percent || chargingSession?.start_battery_percent || 0);
    const energyConsumed = final_energy_consumed !== null && final_energy_consumed !== undefined
      ? parseFloat(final_energy_consumed)
      : parseFloat(chargingSession?.energy_consumed || 0);
    const actualCost = parseFloat((energyConsumed * pricePerKwh).toFixed(2));

    // Update or create charging session
    if (!chargingSession) {
      chargingSession = await ChargingSession.create({
        booking_id: bookingId,
        start_battery_percent: endBatteryPercent,
        end_battery_percent: endBatteryPercent,
        energy_consumed: energyConsumed,
        started_at: booking.actual_start || now,
        ended_at: now,
        actual_cost: actualCost
      });
    } else {
      // Update existing session with final values
      await chargingSession.update({
        end_battery_percent: endBatteryPercent,
        ended_at: now,
        actual_cost: actualCost,
        energy_consumed: energyConsumed
      });
    }

    // Update booking status to 'completed'
    await booking.update({
      status: 'completed',
      actual_end: now
    });

    // Prepare Socket.IO update
    const updateData = {
      booking_id: parseInt(bookingId),
      station_name: station.station_name,
      status: 'completed',
      current_battery_percent: endBatteryPercent,
      end_battery_percent: endBatteryPercent,
      energy_consumed: parseFloat(parseFloat(energyConsumed).toFixed(3)),
      estimated_cost: parseFloat(parseFloat(actualCost).toFixed(2)),
      actual_cost: parseFloat(parseFloat(actualCost).toFixed(2)),
      time_remaining: '0 giờ 0 phút',
      is_completed: true,
      ended_at: now,
      stop_reason: reason || 'simulator_stopped'
    };

    // Remove from monitoring (charging is done)
    chargingMonitor.removeTracking(bookingId);

    // Emit Socket.IO events
    const io = req.app.get('io');
    if (io) {
      const socketRoom = `booking_${bookingId}`;
      // Emit both events for compatibility
      io.to(socketRoom).emit('charging_stopped', updateData);
      io.to(socketRoom).emit('charging_completed', updateData);
      console.log(`[Socket.IO] Emitted charging_stopped to room: ${socketRoom} (reason: ${reason || 'simulator_stopped'})`, updateData);
    } else {
      console.error('[Socket.IO] io instance not found in handleChargingStop!');
    }

    res.status(200).json({
      success: true,
      message: 'Charging stopped successfully',
      data: updateData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete charging manually (called by Frontend when user clicks "Stop" button)
 * POST /api/bookings/:booking_id/charging/complete
 */
exports.completeCharging = async (req, res, next) => {
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
        message: 'Booking not found or you do not have permission'
      });
    }

    // 2. Get charging session
    let chargingSession = await ChargingSession.findOne({
      where: { booking_id: bookingId }
    });

    if (!chargingSession) {
      return res.status(404).json({
        success: false,
        message: 'Charging session not found. Please start charging first.'
      });
    }

    // 3. Check if already completed
    if (chargingSession.ended_at) {
      return res.status(400).json({
        success: false,
        message: 'Charging session already completed'
      });
    }

    // 4. Get station info
    const station = await Station.findByPk(booking.station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    const pricePerKwh = parseFloat(station.price_per_kwh);

    // 5. Get current values from last update
    const endBatteryPercent = chargingSession.start_battery_percent || chargingSession.end_battery_percent || 0;
    const energyConsumed = parseFloat(chargingSession.energy_consumed || 0);
    const now = new Date();
    const actualCost = parseFloat((energyConsumed * pricePerKwh).toFixed(2));

    // 6. Update charging session
    await chargingSession.update({
      end_battery_percent: endBatteryPercent,
      ended_at: now,
      actual_cost: actualCost
    });

    // 7. Update booking status
    await booking.update({
      status: 'completed',
      actual_end: now
    });

    // 8. Prepare Socket.IO update
    const updateData = {
      booking_id: parseInt(bookingId),
      station_name: station.station_name,
      status: 'completed',
      current_battery_percent: endBatteryPercent,
      end_battery_percent: endBatteryPercent,
      energy_consumed: parseFloat(energyConsumed.toFixed(3)),
      estimated_cost: parseFloat(actualCost.toFixed(2)),
      actual_cost: parseFloat(actualCost.toFixed(2)),
      time_remaining: '0 giờ 0 phút',
      is_completed: true,
      ended_at: now
    };

    // 9. Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      const socketRoom = `booking_${bookingId}`;
      io.to(socketRoom).emit('charging_update', updateData);
      io.to(socketRoom).emit('charging_completed', updateData);
      console.log(`[Socket.IO] Emitted charging_completed to room: ${socketRoom}`);
    }

    res.status(200).json({
      success: true,
      message: 'Charging completed successfully',
      data: updateData
    });
  } catch (error) {
    next(error);
  }
};

