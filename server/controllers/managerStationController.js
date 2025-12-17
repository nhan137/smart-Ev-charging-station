const Station = require('../models/Station');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get Manager's Station List
 * GET /api/manager/stations
 * 
 * Mục đích: Lấy danh sách trạm sạc mà manager quản lý (cho Dashboard Table)
 */
exports.getManagerStations = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;
    const { status } = req.query;

    // Build WHERE clause
    const whereConditions = {
      manager_id: managerId
    };

    // Filter by status if provided
    if (status && ['active', 'maintenance', 'inactive'].includes(status)) {
      whereConditions.status = status;
    }

    // Get stations
    const stations = await Station.findAll({
      where: whereConditions,
      attributes: [
        'station_id',
        'station_name',
        'address',
        'price_per_kwh',
        'total_slots',
        'available_slots',
        'status'
      ],
      order: [['created_at', 'DESC']]
    });

    // Format response để FE dễ hiển thị
    const formattedStations = stations.map(station => {
      const stationData = station.toJSON();
      return {
        station_id: stationData.station_id,
        station_code: `#${stationData.station_id}`, // MÃ TRẠM: #1, #2
        station_name: stationData.station_name,
        address: stationData.address,
        price_per_kwh: parseFloat(stationData.price_per_kwh) || 0,
        price_display: `${parseFloat(stationData.price_per_kwh || 0).toLocaleString('vi-VN')} đ/kWh`, // Format: 3,500 đ/kWh
        total_slots: stationData.total_slots,
        available_slots: stationData.available_slots,
        slots_display: `${stationData.available_slots}/${stationData.total_slots}`, // Format: 3/6
        status: stationData.status,
        status_label: stationData.status === 'active' ? 'Hoạt động' : 
                     stationData.status === 'maintenance' ? 'Bảo trì' : 'Ngừng hoạt động'
      };
    });

    res.status(200).json({
      success: true,
      data: formattedStations,
      count: formattedStations.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Station Detail & Reviews
 * GET /api/manager/stations/:id
 * 
 * Mục đích: Lấy chi tiết trạm sạc và đánh giá (cho Station Detail View)
 */
exports.getStationDetail = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;
    const { id } = req.params;

    // Find station and verify ownership
    const station = await Station.findByPk(id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Verify manager owns this station
    if (station.manager_id !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this station'
      });
    }

    // Calculate average rating and total reviews
    const ratingStats = await Feedback.findOne({
      where: { station_id: id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating'],
        [sequelize.fn('COUNT', sequelize.col('feedback_id')), 'total_reviews']
      ],
      raw: true
    });

    const averageRating = ratingStats?.average_rating 
      ? parseFloat(ratingStats.average_rating).toFixed(1) 
      : null;
    const totalReviews = ratingStats?.total_reviews || 0;

    // Get recent 5 reviews with user info
    const recentReviews = await Feedback.findAll({
      where: { station_id: id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['full_name'],
          required: false
        }
      ],
      attributes: ['feedback_id', 'rating', 'comment', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    // Format reviews
    const formattedReviews = recentReviews.map(review => ({
      user_name: review.user?.full_name || 'Anonymous',
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at
    }));

    // Format station data để khớp với UI (Hình 4)
    const stationData = station.toJSON();
    
    // Map status to display label
    const statusMap = {
      'active': 'Hoạt động',
      'maintenance': 'Bảo trì',
      'inactive': 'Ngừng hoạt động'
    };

    // Format price
    const priceDisplay = `${parseFloat(stationData.price_per_kwh || 0).toLocaleString('vi-VN')} đ/kWh`;

    // Format slots
    const slotsDisplay = `${stationData.available_slots}/${stationData.total_slots} chỗ trống`;

    const response = {
      ...stationData,
      status_label: statusMap[stationData.status] || stationData.status,
      price_display: priceDisplay, // Format: 3,500 đ/kWh
      slots_display: slotsDisplay, // Format: 3/6 chỗ trống
      average_rating: averageRating ? parseFloat(averageRating) : null,
      total_reviews: parseInt(totalReviews),
      rating_display: averageRating ? `${averageRating} (${totalReviews} đánh giá)` : `0 (${totalReviews} đánh giá)`,
      recent_reviews: formattedReviews
    };

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Station Status
 * PUT /api/manager/stations/:id/status
 * 
 * Mục đích: Cập nhật trạng thái trạm sạc (Quick Action)
 */
exports.updateStationStatus = async (req, res, next) => {
  try {
    const managerId = req.user.user_id;
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['active', 'maintenance', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: active, maintenance, or inactive'
      });
    }

    // Find station and verify ownership
    const station = await Station.findByPk(id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Verify manager owns this station
    if (station.manager_id !== managerId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this station'
      });
    }

    // Update status
    await station.update({ status });

    res.status(200).json({
      success: true,
      message: 'Station status updated successfully',
      data: {
        station_id: station.station_id,
        station_name: station.station_name,
        status: station.status
      }
    });
  } catch (error) {
    next(error);
  }
};

