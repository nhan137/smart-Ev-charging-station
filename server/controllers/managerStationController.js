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

    res.status(200).json({
      success: true,
      data: stations,
      count: stations.length
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

    // Format station data
    const stationData = station.toJSON();
    const response = {
      ...stationData,
      average_rating: averageRating ? parseFloat(averageRating) : null,
      total_reviews: parseInt(totalReviews),
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

