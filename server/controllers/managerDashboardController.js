const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('../models/User');
const Station = require('../models/Station');
const Booking = require('../models/Booking');

/**
 * GET /api/manager/dashboard
 * Manager Dashboard Overview
 */
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;

    // 1. Manager info
    const manager = await User.findByPk(managerId, {
      attributes: ['full_name']
    });

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // 2. Stations stats
    const [stationStats] = await Promise.all([
      Station.findAll({
        where: { manager_id: managerId },
        attributes: [
          [fn('COUNT', col('station_id')), 'total_stations'],
          [
            fn('SUM', literal("CASE WHEN status = 'active' THEN 1 ELSE 0 END")),
            'active_stations'
          ]
        ],
        raw: true
      })
    ]);

    const totalStations = parseInt(stationStats?.total_stations || 0, 10) || 0;
    const activeStations = parseInt(stationStats?.active_stations || 0, 10) || 0;

    // If manager has no stations, short-circuit other stats
    if (totalStations === 0) {
      return res.json({
        success: true,
        data: {
          manager_name: manager.full_name,
          stats: {
            total_stations: 0,
            active_stations: 0,
            today_bookings: 0,
            today_revenue: 0
          },
          recent_bookings: [],
          capacity: {
            total_slots: 0,
            used_slots: 0,
            percent: 0
          }
        }
      });
    }

    // Get all station_ids for this manager (used in bookings queries)
    const managerStations = await Station.findAll({
      where: { manager_id: managerId },
      attributes: ['station_id', 'total_slots', 'available_slots'],
      raw: true
    });

    const stationIds = managerStations.map((s) => s.station_id);

    // 3. Today's bookings & revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const bookingAgg = await Booking.findAll({
      where: {
        station_id: { [Op.in]: stationIds },
        created_at: {
          [Op.between]: [todayStart, todayEnd]
        }
      },
      attributes: [
        [fn('COUNT', col('booking_id')), 'today_bookings'],
        [
          fn(
            'SUM',
            literal("CASE WHEN status = 'completed' THEN total_cost ELSE 0 END")
          ),
          'today_revenue'
        ]
      ],
      raw: true
    });

    const bookingStats = bookingAgg[0] || {};
    const todayBookings = parseInt(bookingStats.today_bookings || 0, 10) || 0;
    const todayRevenue = parseFloat(bookingStats.today_revenue || 0) || 0;

    // 4. Recent bookings (latest 5)
    const recentBookings = await Booking.findAll({
      where: {
        station_id: { [Op.in]: stationIds }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['full_name'],
          required: true
        },
        {
          model: Station,
          as: 'station',
          attributes: ['station_name'],
          required: true
        }
      ],
      attributes: [
        'booking_id',
        'start_time',
        'status',
        'total_cost',
        'created_at'
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const recent = recentBookings.map((b) => {
      const data = b.toJSON();
      return {
        id: data.booking_id,
        customer_name: data.user?.full_name || null,
        station_name: data.station?.station_name || null,
        start_time: data.start_time,
        status: data.status,
        total_cost: data.total_cost !== null ? Number(data.total_cost) : 0
      };
    });

    // 5. Capacity / Utilization
    const totalSlots = managerStations.reduce(
      (sum, s) => sum + (s.total_slots || 0),
      0
    );
    const availableSlots = managerStations.reduce(
      (sum, s) => sum + (s.available_slots || 0),
      0
    );
    const usedSlots = Math.max(totalSlots - availableSlots, 0);
    const percent =
      totalSlots > 0 ? parseFloat(((usedSlots / totalSlots) * 100).toFixed(2)) : 0;

    // 6. Get stations list for "Trạm phụ trách" section
    const stationsList = await Station.findAll({
      where: { manager_id: managerId },
      attributes: [
        'station_id',
        'station_name',
        'total_slots',
        'available_slots'
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const formattedStations = stationsList.map(s => ({
      station_id: s.station_id,
      station_name: s.station_name,
      total_slots: s.total_slots,
      available_slots: s.available_slots,
      used_slots: s.total_slots - s.available_slots
    }));

    return res.json({
      success: true,
      data: {
        manager_name: manager.full_name,
        stats: {
          total_stations: totalStations,
          active_stations: activeStations,
          today_bookings: todayBookings,
          today_revenue: Number(todayRevenue)
        },
        stations: formattedStations, // Danh sách trạm phụ trách
        recent_bookings: recent,
        capacity: {
          total_slots: totalSlots,
          used_slots: usedSlots,
          percent
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


