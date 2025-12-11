const Station = require('../models/Station');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const ChargingSession = require('../models/ChargingSession');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get station statistics
 * GET /api/admin/stations/stats
 */
exports.getStationStats = async (req, res, next) => {
  try {
    const total_stations = await Station.count();
    const active_stations = await Station.count({ where: { status: 'active' } });
    
    // Calculate total_slots and available_slots using SUM
    const stats = await Station.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_slots')), 'total_slots'],
        [sequelize.fn('SUM', sequelize.col('available_slots')), 'available_slots']
      ],
      raw: true
    });

    const total_slots = parseInt(stats[0]?.total_slots || 0);
    const available_slots = parseInt(stats[0]?.available_slots || 0);

    res.status(200).json({
      success: true,
      data: {
        total_stations,
        active_stations,
        total_slots,
        available_slots
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all stations with filters
 * GET /api/admin/stations
 */
exports.getStations = async (req, res, next) => {
  try {
    const { type, status, search, page = 1, limit = 10 } = req.query;
    
    // Build WHERE clause
    const where = {};
    
    if (type && type !== 'all') {
      where.station_type = type;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (search) {
      where[Op.or] = [
        { station_name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get stations with manager info
    const { count, rows: stations } = await Station.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'manager',
        attributes: ['user_id', 'full_name', 'email'],
        required: false
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Format response to match UI
    const formattedStations = stations.map(station => {
      const stationData = station.toJSON();
      return {
        ...stationData,
        manager_name: stationData.manager?.full_name || null,
        manager_email: stationData.manager?.email || null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        stations: formattedStations,
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
 * Create new station
 * POST /api/admin/stations
 */
exports.createStation = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      station_name,
      address,
      latitude,
      longitude,
      price_per_kwh,
      station_type,
      total_slots,
      charging_power,
      connector_types,
      opening_hours,
      status,
      manager_id
    } = req.body;

    // Create station
    // Set available_slots = total_slots initially (all slots are free)
    const station = await Station.create({
      station_name,
      address,
      latitude: latitude || null,
      longitude: longitude || null,
      price_per_kwh,
      station_type,
      total_slots,
      available_slots: total_slots, // Initially all slots are available
      charging_power: charging_power || null,
      connector_types: connector_types || null,
      opening_hours: opening_hours || null,
      status: status || 'active',
      manager_id: manager_id || null
    });

    // Get station with manager info
    const stationWithManager = await Station.findByPk(station.station_id, {
      include: [{
        model: User,
        as: 'manager',
        attributes: ['user_id', 'full_name', 'email'],
        required: false
      }]
    });

    const stationData = stationWithManager.toJSON();
    const formattedStation = {
      ...stationData,
      manager_name: stationData.manager?.full_name || null,
      manager_email: stationData.manager?.email || null
    };

    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: formattedStation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get station by ID with statistics
 * GET /api/admin/stations/:station_id
 */
exports.getStationById = async (req, res, next) => {
  try {
    const { station_id } = req.params;

    const station = await Station.findByPk(station_id, {
      include: [{
        model: User,
        as: 'manager',
        attributes: ['user_id', 'full_name', 'email'],
        required: false
      }]
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Calculate statistics
    // 1. Total bookings
    const totalBookings = await Booking.count({
      where: { station_id }
    });

    // 2. Completed bookings
    const completedBookings = await Booking.count({
      where: {
        station_id,
        status: 'completed'
      }
    });

    // 3. Total revenue (from successful payments for this station)
    const revenueResult = await sequelize.query(`
      SELECT COALESCE(SUM(p.amount), 0) as total_revenue
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.booking_id
      WHERE b.station_id = :station_id
      AND p.status = 'success'
    `, {
      replacements: { station_id },
      type: sequelize.QueryTypes.SELECT
    });
    const totalRevenue = parseFloat(revenueResult[0]?.total_revenue || 0);

    // 4. Total KWH supplied (from charging sessions for this station)
    const kwhResult = await sequelize.query(`
      SELECT COALESCE(SUM(cs.energy_consumed), 0) as total_kwh
      FROM charging_sessions cs
      INNER JOIN bookings b ON cs.booking_id = b.booking_id
      WHERE b.station_id = :station_id
      AND cs.energy_consumed IS NOT NULL
    `, {
      replacements: { station_id },
      type: sequelize.QueryTypes.SELECT
    });
    const totalKwh = parseFloat(kwhResult[0]?.total_kwh || 0);

    const stationData = station.toJSON();
    const formattedStation = {
      ...stationData,
      manager_name: stationData.manager?.full_name || null,
      manager_email: stationData.manager?.email || null,
      // Statistics
      statistics: {
        total_bookings: totalBookings,
        completed_bookings: completedBookings,
        total_revenue: totalRevenue,
        total_kwh_supplied: totalKwh
      }
    };

    res.status(200).json({
      success: true,
      data: formattedStation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update station
 * PUT /api/admin/stations/:station_id
 */
exports.updateStation = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { station_id } = req.params;
    const {
      station_name,
      address,
      latitude,
      longitude,
      price_per_kwh,
      station_type,
      total_slots,
      charging_power,
      connector_types,
      opening_hours,
      status,
      manager_id
    } = req.body;

    // Find station
    const station = await Station.findByPk(station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Build update object
    // Các trường có dấu * trong UI là required, phải có giá trị
    const updateData = {
      station_name,
      address,
      latitude: latitude !== undefined ? latitude : station.latitude,
      longitude: longitude !== undefined ? longitude : station.longitude,
      price_per_kwh,
      station_type,
      connector_types, // Required trong UI
      charging_power: charging_power !== undefined ? charging_power : station.charging_power,
      opening_hours: opening_hours !== undefined ? opening_hours : station.opening_hours,
      status: status !== undefined ? status : station.status,
      manager_id: manager_id !== undefined ? manager_id : station.manager_id
    };

    // If total_slots changes, recalculate available_slots
    if (total_slots !== undefined && total_slots !== station.total_slots) {
      const difference = total_slots - station.total_slots;
      updateData.total_slots = total_slots;
      // Adjust available_slots by the difference
      updateData.available_slots = Math.max(0, station.available_slots + difference);
    } else {
      // Nếu total_slots không thay đổi, vẫn cần set nó
      updateData.total_slots = total_slots !== undefined ? total_slots : station.total_slots;
    }

    // Update station
    await station.update(updateData);

    // Get updated station with manager info
    const updatedStation = await Station.findByPk(station_id, {
      include: [{
        model: User,
        as: 'manager',
        attributes: ['user_id', 'full_name', 'email'],
        required: false
      }]
    });

    const stationData = updatedStation.toJSON();
    const formattedStation = {
      ...stationData,
      manager_name: stationData.manager?.full_name || null,
      manager_email: stationData.manager?.email || null
    };

    res.status(200).json({
      success: true,
      message: 'Station updated successfully',
      data: formattedStation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete station
 * DELETE /api/admin/stations/:station_id
 */
exports.deleteStation = async (req, res, next) => {
  try {
    const { station_id } = req.params;

    // Find station
    const station = await Station.findByPk(station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Check if station has active bookings
    const activeBookingCount = await Booking.count({
      where: {
        station_id,
        status: {
          [Op.in]: ['pending', 'confirmed', 'charging']
        }
      }
    });

    // If station has active bookings, prevent deletion
    if (activeBookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete station with active bookings. Please set status to \'Maintenance\' instead.'
      });
    }

    // Delete station
    await station.destroy();

    res.status(200).json({
      success: true,
      message: 'Station deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

