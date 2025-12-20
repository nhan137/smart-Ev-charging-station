const Favorite = require('../models/Favorite');
const Station = require('../models/Station');
const Feedback = require('../models/Feedback');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Add station to favorites
 * POST /api/favorites
 */
exports.addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const { station_id } = req.body;

    // Verify station exists
    const station = await Station.findByPk(station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Check if already saved
    const existingFavorite = await Favorite.findOne({
      where: {
        user_id: userId,
        station_id: station_id
      }
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Station already in favorites'
      });
    }

    // Add to favorites
    await Favorite.create({
      user_id: userId,
      station_id: station_id
    });

    res.status(201).json({
      success: true,
      message: 'Đã lưu trạm yêu thích'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove station from favorites
 * DELETE /api/favorites/:station_id
 */
exports.removeFavorite = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const stationId = parseInt(req.params.station_id);

    // Check if favorite exists
    const favorite = await Favorite.findOne({
      where: {
        user_id: userId,
        station_id: stationId
      }
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Station not found in favorites'
      });
    }

    // Remove from favorites
    await Favorite.destroy({
      where: {
        user_id: userId,
        station_id: stationId
      }
    });

    res.status(200).json({
      success: true,
      message: 'Đã xóa trạm khỏi yêu thích'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's favorite stations
 * GET /api/favorites/my
 */
exports.getMyFavorites = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    // Query favorites with station info and ratings
    const favorites = await Favorite.findAll({
      where: {
        user_id: userId
      },
      include: [
        {
          model: Station,
          as: 'station',
          attributes: [
            'station_id',
            'station_name',
            'address',
            'latitude',
            'longitude',
            'price_per_kwh',
            'station_type',
            'total_slots',
            'available_slots',
            'charging_power',
            'connector_types',
            'opening_hours',
            'avatar_url',
            'contact_phone',
            'status',
            'created_at'
          ],
          required: true
        }
      ],
      order: [['added_at', 'DESC']]
    });

    // Get ratings for each station
    const stationIds = favorites.length > 0 
      ? favorites.map(fav => fav.station.station_id)
      : [];
    
    let ratingsData = [];
    if (stationIds.length > 0) {
      ratingsData = await Feedback.findAll({
        where: {
          station_id: {
            [Sequelize.Op.in]: stationIds
          }
        },
        attributes: [
          'station_id',
          [Sequelize.fn('AVG', Sequelize.col('rating')), 'avg_rating'],
          [Sequelize.fn('COUNT', Sequelize.col('feedback_id')), 'feedback_count']
        ],
        group: ['station_id'],
        raw: true
      });
    }

    // Create a map of station_id to ratings
    const ratingsMap = {};
    ratingsData.forEach(rating => {
      ratingsMap[rating.station_id] = {
        avg_rating: parseFloat(rating.avg_rating) || 0,
        feedback_count: parseInt(rating.feedback_count) || 0
      };
    });

    // Format response
    const formattedFavorites = favorites.map(favorite => {
      const station = favorite.station;
      const stationId = station.station_id;
      const ratings = ratingsMap[stationId] || { avg_rating: 0, feedback_count: 0 };

      return {
        station_id: station.station_id,
        station_name: station.station_name,
        address: station.address,
        latitude: station.latitude ? parseFloat(station.latitude) : null,
        longitude: station.longitude ? parseFloat(station.longitude) : null,
        price_per_kwh: station.price_per_kwh ? parseFloat(station.price_per_kwh) : null,
        station_type: station.station_type,
        total_slots: station.total_slots,
        available_slots: station.available_slots,
        charging_power: station.charging_power ? parseFloat(station.charging_power) : null,
        connector_types: station.connector_types,
        opening_hours: station.opening_hours,
        avatar_url: station.avatar_url,
        contact_phone: station.contact_phone,
        status: station.status,
        avg_rating: ratings.avg_rating,
        feedback_count: ratings.feedback_count,
        added_at: favorite.added_at
      };
    });

    res.status(200).json({
      success: true,
      data: formattedFavorites
    });
  } catch (error) {
    next(error);
  }
};

