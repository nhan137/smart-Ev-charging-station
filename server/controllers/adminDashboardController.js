const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Station = require('../models/Station');
const ChargingSession = require('../models/ChargingSession');
const Notification = require('../models/Notification');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get dashboard overview statistics
 * GET /api/admin/dashboard/overview
 */
exports.getOverview = async (req, res, next) => {
  try {
    const { type = 'month' } = req.query; // 'month' or 'year'

    // Calculate date range
    const now = new Date();
    let startDate, endDate;
    
    if (type === 'year') {
      // Current year
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else {
      // Current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // 1. Total Users (role_id = 1)
    const totalUsers = await User.count({
      where: { role_id: 1 }
    });

    // 2. Total Bookings (with date filter)
    const totalBookings = await Booking.count({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // 3. Total Revenue (successful payments with date filter)
    const revenueResult = await Payment.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue']
      ],
      where: {
        status: 'success',
        payment_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      raw: true
    });
    const totalRevenue = parseFloat(revenueResult[0]?.total_revenue || 0);

    // 4. Total kWh (from charging_sessions with date filter)
    const kWhResult = await ChargingSession.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('energy_consumed')), 'total_kwh']
      ],
      where: {
        started_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      raw: true
    });
    const totalKwh = parseFloat(kWhResult[0]?.total_kwh || 0);

    // Format response để khớp với UI (Hình Dashboard)
    res.status(200).json({
      success: true,
      data: {
        total_users: totalUsers,           // ← "1,234 Khách hàng"
        total_users_display: totalUsers.toLocaleString('vi-VN'), // Format: "1,234"
        total_bookings: totalBookings,     // ← "567 Đặt lịch"
        total_bookings_display: totalBookings.toLocaleString('vi-VN'), // Format: "567"
        total_revenue: totalRevenue,       // ← "125.0M Tháng này"
        total_revenue_display: totalRevenue >= 1000000 
          ? `${(totalRevenue / 1000000).toFixed(1)}M` 
          : `${(totalRevenue / 1000).toFixed(1)}K`, // Format: "125.0M" hoặc "125.0K"
        total_kwh: totalKwh,               // ← "8,450 Năng lượng tiêu thụ"
        total_kwh_display: totalKwh.toLocaleString('vi-VN') // Format: "8,450"
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard highlights
 * GET /api/admin/dashboard/highlights
 */
exports.getHighlights = async (req, res, next) => {
  try {
    // 1. Top Station (most bookings)
    const topStationResult = await sequelize.query(`
      SELECT s.station_name, COUNT(b.booking_id) as total_bookings
      FROM stations s
      LEFT JOIN bookings b ON s.station_id = b.station_id
      GROUP BY s.station_id, s.station_name
      ORDER BY total_bookings DESC
      LIMIT 1
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const topStation = topStationResult.length > 0 ? {
      station_name: topStationResult[0].station_name || null,
      total_bookings: parseInt(topStationResult[0].total_bookings || 0)
    } : {
      station_name: null,
      total_bookings: 0
    };

    // 2. Top Spender (user chi tiêu nhiều nhất)
    const topSpenderResult = await sequelize.query(`
      SELECT u.full_name, SUM(p.amount) as total_spent
      FROM users u
      INNER JOIN payments p ON u.user_id = p.user_id
      WHERE p.status = 'success'
      GROUP BY u.user_id, u.full_name
      ORDER BY total_spent DESC
      LIMIT 1
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const topSpender = topSpenderResult.length > 0 ? {
      full_name: topSpenderResult[0].full_name || null,
      total_spent: parseFloat(topSpenderResult[0].total_spent || 0)
    } : {
      full_name: null,
      total_spent: 0
    };

    // 3. Cancel Rate (Tỷ lệ hủy booking)
    const totalBookings = await Booking.count();
    const cancelledBookings = await Booking.count({
      where: { status: 'cancelled' }
    });
    const cancelRate = totalBookings > 0 
      ? ((cancelledBookings / totalBookings) * 100).toFixed(1)
      : '0.0';

    // 4. Maintenance Stations (Trạm đang bảo trì)
    const maintenanceStations = await Station.count({
      where: { status: 'maintenance' }
    });

    // Format response để khớp với UI
    res.status(200).json({
      success: true,
      data: {
        top_station: {
          ...topStation,
          display: topStation.station_name 
            ? `${topStation.station_name} - ${topStation.total_bookings} booking`
            : 'Chưa có dữ liệu'
        }, // ← "Trạm sạc Hải Châu - 250 booking"
        top_spender: {
          ...topSpender,
          display: topSpender.full_name
            ? `${topSpender.full_name} - ${parseFloat(topSpender.total_spent).toLocaleString('vi-VN')}₫`
            : 'Chưa có dữ liệu'
        }, // ← "Nguyễn Văn A - 5,000,000₫"
        cancel_rate: parseFloat(cancelRate), // ← "5.2%"
        cancel_rate_display: `${cancelRate}%`, // Format: "5.2%"
        cancel_rate_status: parseFloat(cancelRate) > 5 ? 'Cần cải thiện' : 'Tốt', // ← "Cần cải thiện"
        maintenance_stations: maintenanceStations, // ← "2 Trạm"
        maintenance_stations_display: `${maintenanceStations} Trạm` // Format: "2 Trạm"
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get revenue chart data (last 6 months)
 * GET /api/admin/dashboard/charts/revenue
 */
exports.getRevenueChart = async (req, res, next) => {
  try {
    const months = [];
    const now = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = `T${date.getMonth() + 1}`; // T7, T8, T9, T10, T11, T12
      months.push({
        month: monthName,
        startDate: new Date(date.getFullYear(), date.getMonth(), 1),
        endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
      });
    }

    // Get revenue for each month
    const revenueData = await Promise.all(
      months.map(async ({ month, startDate, endDate }) => {
        const result = await Payment.findAll({
          attributes: [
            [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
          ],
          where: {
            status: 'success',
            payment_date: {
              [Op.between]: [startDate, endDate]
            }
          },
          raw: true
        });
        return {
          month,
          revenue: parseFloat(result[0]?.revenue || 0)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get booking trend chart (current week: Monday to Sunday)
 * GET /api/admin/dashboard/charts/booking-trend
 */
exports.getBookingTrendChart = async (req, res, next) => {
  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay === 0 ? 6 : currentDay - 1)); // Get Monday
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Day names in Vietnamese (mapping: 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7)
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      days.push({
        day: dayNames[dayDate.getDay()],
        startDate: dayStart,
        endDate: dayEnd
      });
    }

    // Get booking count for each day
    const bookingData = await Promise.all(
      days.map(async ({ day, startDate, endDate }) => {
        const count = await Booking.count({
          where: {
            created_at: {
              [Op.between]: [startDate, endDate]
            }
          }
        });
        return {
          day,
          count
        };
      })
    );

    res.status(200).json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get station types chart (pie chart)
 * GET /api/admin/dashboard/charts/station-types
 */
exports.getStationTypesChart = async (req, res, next) => {
  try {
    const stationTypes = await Station.findAll({
      attributes: [
        'station_type',
        [sequelize.fn('COUNT', sequelize.col('station_id')), 'count']
      ],
      group: ['station_type'],
      raw: true
    });

    // Map station_type to Vietnamese labels
    const typeMap = {
      'xe_may': 'Xe máy',
      'oto': 'Ô tô',
      'ca_hai': 'Cả hai'
    };

    const totalStations = stationTypes.reduce((sum, item) => sum + parseInt(item.count), 0);

    const chartData = stationTypes.map(item => {
      const typeLabel = typeMap[item.station_type] || item.station_type;
      const count = parseInt(item.count);
      const percentage = totalStations > 0 ? Math.round((count / totalStations) * 100) : 0;
      
      return {
        type: typeLabel,
        value: percentage,
        count: count
      };
    });

    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activities (notifications & activities)
 * GET /api/admin/dashboard/recent-activities
 * 
 * Mục đích: Populate 2 phần trong sidebar bên phải Dashboard:
 * 1. "Thông báo hệ thống" (System Notifications) - 3 thông báo mới nhất
 * 2. "Hoạt động gần đây" (Recent Activities) - 5 hoạt động mới nhất (bookings + payments)
 * 
 * Response format:
 * {
 *   notifications: [
 *     { id, title, message, type, created_at }
 *   ],
 *   activities: [
 *     { id, type: 'booking'|'payment', user_name, description, status, created_at }
 *   ]
 * }
 */
exports.getRecentActivities = async (req, res, next) => {
  try {
    // ============================================
    // PHẦN 1: System Notifications (Thông báo hệ thống)
    // ============================================
    // Lấy 3 thông báo hệ thống mới nhất
    // Ví dụ: "Có 3 booking đang chờ xác nhận", "Doanh thu tháng này tăng 15%", ...
    const notifications = await Notification.findAll({
      where: {
        type: 'system' // Chỉ lấy thông báo hệ thống
      },
      attributes: ['notification_id', 'title', 'message', 'type', 'created_at'],
      order: [['created_at', 'DESC']], // Mới nhất trước
      limit: 3 // Chỉ lấy 3 cái
    });

    // ============================================
    // PHẦN 2: Recent Activities (Hoạt động gần đây)
    // ============================================
    // Lấy 5 bookings mới nhất
    const recentBookings = await Booking.findAll({
      attributes: ['booking_id', 'user_id', 'status', 'created_at'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['full_name'],
        required: true
      }],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Lấy 5 payments thành công mới nhất
    const recentPayments = await Payment.findAll({
      attributes: ['payment_id', 'user_id', 'amount', 'status', 'payment_date'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['full_name'],
        required: true
      }],
      where: {
        status: 'success' // Chỉ lấy thanh toán thành công
      },
      order: [['payment_date', 'DESC']],
      limit: 5
    });

    // Format notifications
    const formattedNotifications = notifications.map(notif => ({
      id: notif.notification_id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      created_at: notif.created_at
    }));

    // Format activities: Kết hợp bookings và payments, sắp xếp theo thời gian
    // Ví dụ: 
    // - "Nguyễn Văn A đặt lịch tại Trạm Hải Châu" (booking)
    // - "Trần Thị B thanh toán 150,000₫" (payment)
    // - "Lê Văn C hủy booking #1234" (booking cancelled)
    const activities = [
      // Chuyển bookings thành activities
      ...recentBookings.map(booking => {
        const bookingData = booking.toJSON();
        let description = '';
        if (bookingData.status === 'pending') {
          description = `${bookingData.user?.full_name || 'User'} đặt lịch`;
        } else if (bookingData.status === 'cancelled') {
          description = `${bookingData.user?.full_name || 'User'} hủy booking #${bookingData.booking_id}`;
        } else {
          description = `${bookingData.user?.full_name || 'User'} đặt lịch`;
        }
        return {
          id: bookingData.booking_id,
          type: 'booking',
          user_name: bookingData.user?.full_name || null,
          description: description,
          status: bookingData.status,
          created_at: bookingData.created_at
        };
      }),
      // Chuyển payments thành activities
      ...recentPayments.map(payment => {
        const paymentData = payment.toJSON();
        return {
          id: paymentData.payment_id,
          type: 'payment',
          user_name: paymentData.user?.full_name || null,
          description: `${paymentData.user?.full_name || 'User'} thanh toán ${parseFloat(paymentData.amount).toLocaleString('vi-VN')}₫`,
          status: paymentData.status,
          created_at: paymentData.payment_date
        };
      })
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sắp xếp theo thời gian (mới nhất trước)
      .slice(0, 5); // Chỉ lấy 5 hoạt động mới nhất

    // Format time ago (ví dụ: "5 phút trước", "1 giờ trước")
    const formatTimeAgo = (date) => {
      const now = new Date();
      const diffMs = now - new Date(date);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return `${diffDays} ngày trước`;
    };

    // Thêm time_ago vào notifications và activities
    const formattedNotificationsWithTime = formattedNotifications.map(notif => ({
      ...notif,
      time_ago: formatTimeAgo(notif.created_at)
    }));

    const activitiesWithTime = activities.map(activity => ({
      ...activity,
      time_ago: formatTimeAgo(activity.created_at)
    }));

    res.status(200).json({
      success: true,
      data: {
        notifications: formattedNotificationsWithTime, // 3 thông báo hệ thống (có time_ago)
        activities: activitiesWithTime // 5 hoạt động gần đây (bookings + payments, có time_ago)
      }
    });
  } catch (error) {
    next(error);
  }
};

