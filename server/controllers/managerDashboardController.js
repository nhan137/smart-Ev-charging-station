const { Op, fn, col, literal } = require('sequelize');
const { User, Station, Booking, sequelize } = require('../models');

// --- UTILS ---
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const DashboardController = {
  getOverview: async (req, res, next) => {
    try {
      const managerId = req.user.user_id;
      const { start, end } = getTodayRange();

      // 1. Fetch Manager & Base Station Data cùng lúc
      const [manager, allStations] = await Promise.all([
        User.findByPk(managerId, { attributes: ['full_name'] }),
        Station.findAll({
          where: { manager_id: managerId },
          attributes: ['station_id', 'station_name', 'status', 'total_slots', 'available_slots', 'created_at'],
          raw: true
        })
      ]);

      if (!manager) return res.status(404).json({ success: false, message: 'Manager Not Found' });

      // Short-circuit nếu không có trạm nào
      if (!allStations.length) {
        return res.json({
          success: true,
          data: { manager_name: manager.full_name, stats: {}, recent_bookings: [], capacity: { percent: 0 } }
        });
      }

      const stationIds = allStations.map(s => s.station_id);

      // 2. Fetch Bookings Stats & Recent Bookings song song
      const [bookingAgg, recentBookings] = await Promise.all([
        // Tổng hợp stats trong ngày
        Booking.findOne({
          where: {
            station_id: { [Op.in]: stationIds },
            created_at: { [Op.between]: [start, end] }
          },
          attributes: [
            [fn('COUNT', col('booking_id')), 'count'],
            [fn('SUM', literal("CASE WHEN status = 'completed' THEN total_cost ELSE 0 END")), 'revenue']
          ],
          raw: true
        }),
        // 5 Booking mới nhất
        Booking.findAll({
          where: { station_id: { [Op.in]: stationIds } },
          include: [
            { model: User, as: 'user', attributes: ['full_name'] },
            { model: Station, as: 'station', attributes: ['station_name'] }
          ],
          attributes: ['booking_id', 'start_time', 'status', 'total_cost'],
          order: [['created_at', 'DESC']],
          limit: 5
        })
      ]);

      // 3. Tính toán Logic (Utilization & Aggregates)
      const stats = {
        total_stations: allStations.length,
        active_stations: allStations.filter(s => s.status === 'active').length,
        today_bookings: +(bookingAgg?.count || 0),
        today_revenue: +(bookingAgg?.revenue || 0)
      };

      const capacity = allStations.reduce((acc, s) => {
        acc.total += (s.total_slots || 0);
        acc.available += (s.available_slots || 0);
        return acc;
      }, { total: 0, available: 0 });

      const usedSlots = Math.max(capacity.total - capacity.available, 0);

      // 4. Response Mapping
      res.json({
        success: true,
        data: {
          manager_name: manager.full_name,
          summary: stats,
          capacity: {
            ...capacity,
            used: usedSlots,
            utilization_rate: capacity.total > 0 ? +((usedSlots / capacity.total) * 100).toFixed(2) : 0
          },
          // Format danh sách trạm phụ trách
          stations: allStations.slice(0, 5).map(s => ({
            id: s.station_id,
            name: s.station_name,
            slots: `${s.total_slots - s.available_slots}/${s.total_slots}`,
            load: s.total_slots > 0 ? +(((s.total_slots - s.available_slots) / s.total_slots) * 100).toFixed(0) : 0
          })),
          // Format booking gần đây
          recent_bookings: recentBookings.map(b => ({
            id: b.booking_id,
            customer: b.user?.full_name,
            station: b.station?.station_name,
            time: b.start_time,
            status: b.status,
            amount: +(b.total_cost || 0)
          }))
        }
      });

    } catch (e) {
      next(e);
    }
  }
};

module.exports = DashboardController;