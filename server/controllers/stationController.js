const Station = require('../models/Station');
const Feedback = require('../models/Feedback');
const { Sequelize, Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get all stations with filters and distance calculation
 * GET /api/stations
 */
exports.getAllStations = async (req, res, next) => {
  try {
    const {
      station_type,
      min_price = 0,
      max_price = 10000,
      lat,
      lng,
      radius = 50
    } = req.query;

    // Build where conditions
    const whereConditions = {
      status: 'active'
    };

    // Filter by station_type
    if (station_type && ['xe_may', 'oto', 'ca_hai'].includes(station_type)) {
      whereConditions.station_type = station_type;
    }

    // Filter by price range
    whereConditions.price_per_kwh = {
      [Op.between]: [parseFloat(min_price), parseFloat(max_price)]
    };

    // Check if lat/lng provided for distance calculation
    const hasLocation = lat && lng;
    const userLat = hasLocation ? parseFloat(lat) : null;
    const userLng = hasLocation ? parseFloat(lng) : null;
    const radiusKm = hasLocation ? parseFloat(radius) : null;

    // Build attributes
    const attributes = [
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
      'created_at',
      [
        Sequelize.fn('COALESCE', 
          Sequelize.fn('AVG', Sequelize.col('feedbacks.rating')), 
          0
        ),
        'avg_rating'
      ],
      [
        Sequelize.fn('COUNT', Sequelize.col('feedbacks.feedback_id')),
        'feedback_count'
      ]
    ];

    // Add distance calculation if lat/lng provided
    if (hasLocation) {
      attributes.push([
        Sequelize.literal(
          `6371 * acos(
            cos(radians(${userLat})) * 
            cos(radians(\`stations\`.\`latitude\`)) * 
            cos(radians(\`stations\`.\`longitude\`) - radians(${userLng})) + 
            sin(radians(${userLat})) * 
            sin(radians(\`stations\`.\`latitude\`))
          )`
        ),
        'distance'
      ]);
    }

    // Build query options
    const queryOptions = {
      attributes,
      where: whereConditions,
      include: [{
        model: Feedback,
        as: 'feedbacks',
        attributes: [], // Don't include feedback details, just for aggregation
        required: false // LEFT JOIN
      }],
      group: [Sequelize.col('stations.station_id')],
      raw: false // Keep as false to use Sequelize instance methods
    };

    // Add having clause for distance if provided
    if (hasLocation) {
      queryOptions.having = Sequelize.literal(
        `6371 * acos(
          cos(radians(${userLat})) * 
          cos(radians(\`stations\`.\`latitude\`)) * 
          cos(radians(\`stations\`.\`longitude\`) - radians(${userLng})) + 
          sin(radians(${userLat})) * 
          sin(radians(\`stations\`.\`latitude\`))
        ) < ${radiusKm}`
      );
    }

    // Add order by
    if (hasLocation) {
      queryOptions.order = [
        [Sequelize.literal('distance'), 'ASC']
      ];
    } else {
      queryOptions.order = [['created_at', 'DESC']];
    }

    // Execute query using raw SQL for complex aggregation
    let stations;
    let radiusExpanded = false;
    let originalRadius = radiusKm;
    let expandedRadius = radiusKm;

    if (hasLocation) {
      // Use raw query for distance calculation with HAVING
      const sqlQuery = `
        SELECT 
          s.station_id,
          s.station_name,
          s.address,
          s.latitude,
          s.longitude,
          s.price_per_kwh,
          s.station_type,
          s.total_slots,
          s.available_slots,
          s.charging_power,
          s.connector_types,
          s.opening_hours,
          s.avatar_url,
          s.contact_phone,
          s.status,
          s.created_at,
          COALESCE(AVG(f.rating), 0) as avg_rating,
          COUNT(f.feedback_id) as feedback_count,
          6371 * acos(
            cos(radians(:userLat)) * 
            cos(radians(s.latitude)) * 
            cos(radians(s.longitude) - radians(:userLng)) + 
            sin(radians(:userLat)) * 
            sin(radians(s.latitude))
          ) as distance
        FROM stations s
        LEFT JOIN feedbacks f ON s.station_id = f.station_id
        WHERE s.status = 'active'
          ${station_type ? `AND s.station_type = :stationType` : ''}
          AND s.price_per_kwh BETWEEN :minPrice AND :maxPrice
        GROUP BY s.station_id
        HAVING distance < :radius
        ORDER BY distance ASC
      `;

      const replacements = {
        userLat,
        userLng,
        minPrice: parseFloat(min_price),
        maxPrice: parseFloat(max_price),
        radius: radiusKm
      };

      if (station_type) {
        replacements.stationType = station_type;
      }

      stations = await sequelize.query(sqlQuery, {
        replacements,
        type: Sequelize.QueryTypes.SELECT
      });

      // Giải pháp 1+2: Nếu không có kết quả trong radius, tự động mở rộng
      // Nếu không có kết quả trong radius ban đầu
      if (stations.length === 0) {
        // Giải pháp 1: Thử với radius gấp đôi
        expandedRadius = radiusKm * 2;
        radiusExpanded = true;

        const expandedSqlQuery = `
          SELECT 
            s.station_id,
            s.station_name,
            s.address,
            s.latitude,
            s.longitude,
            s.price_per_kwh,
            s.station_type,
            s.total_slots,
            s.available_slots,
            s.charging_power,
            s.connector_types,
            s.opening_hours,
            s.avatar_url,
            s.contact_phone,
            s.status,
            s.created_at,
            COALESCE(AVG(f.rating), 0) as avg_rating,
            COUNT(f.feedback_id) as feedback_count,
            6371 * acos(
              cos(radians(:userLat)) * 
              cos(radians(s.latitude)) * 
              cos(radians(s.longitude) - radians(:userLng)) + 
              sin(radians(:userLat)) * 
              sin(radians(s.latitude))
            ) as distance
          FROM stations s
          LEFT JOIN feedbacks f ON s.station_id = f.station_id
          WHERE s.status = 'active'
            ${station_type ? `AND s.station_type = :stationType` : ''}
            AND s.price_per_kwh BETWEEN :minPrice AND :maxPrice
          GROUP BY s.station_id
          HAVING distance < :expandedRadius
          ORDER BY distance ASC
          LIMIT 10
        `;

        const expandedReplacements = {
          ...replacements,
          expandedRadius
        };

        stations = await sequelize.query(expandedSqlQuery, {
          replacements: expandedReplacements,
          type: Sequelize.QueryTypes.SELECT
        });

        // Giải pháp 2: Nếu vẫn không có, lấy 5 stations gần nhất (không giới hạn radius)
        if (stations.length === 0) {
          const nearestSqlQuery = `
            SELECT 
              s.station_id,
              s.station_name,
              s.address,
              s.latitude,
              s.longitude,
              s.price_per_kwh,
              s.station_type,
              s.total_slots,
              s.available_slots,
              s.charging_power,
              s.connector_types,
              s.opening_hours,
              s.avatar_url,
              s.contact_phone,
              s.status,
              s.created_at,
              COALESCE(AVG(f.rating), 0) as avg_rating,
              COUNT(f.feedback_id) as feedback_count,
              6371 * acos(
                cos(radians(:userLat)) * 
                cos(radians(s.latitude)) * 
                cos(radians(s.longitude) - radians(:userLng)) + 
                sin(radians(:userLat)) * 
                sin(radians(s.latitude))
              ) as distance
            FROM stations s
            LEFT JOIN feedbacks f ON s.station_id = f.station_id
            WHERE s.status = 'active'
              ${station_type ? `AND s.station_type = :stationType` : ''}
              AND s.price_per_kwh BETWEEN :minPrice AND :maxPrice
            GROUP BY s.station_id
            ORDER BY distance ASC
            LIMIT 5
          `;

          stations = await sequelize.query(nearestSqlQuery, {
            replacements,
            type: Sequelize.QueryTypes.SELECT
          });
        }
      }
    } else {
      // Use Sequelize for simpler queries
      stations = await Station.findAll(queryOptions);
      
      // Convert to plain objects
      stations = stations.map(station => {
        const plain = station.get({ plain: true });
        // Extract aggregated values
        if (station.dataValues) {
          plain.avg_rating = station.dataValues.avg_rating || 0;
          plain.feedback_count = station.dataValues.feedback_count || 0;
        }
        return plain;
      });
    }

    // Format response
    const formattedStations = stations.map(station => {
      const formatted = {
        station_id: station.station_id,
        station_name: station.station_name,
        address: station.address,
        latitude: station.latitude ? parseFloat(station.latitude) : null,
        longitude: station.longitude ? parseFloat(station.longitude) : null,
        price_per_kwh: parseFloat(station.price_per_kwh),
        station_type: station.station_type,
        total_slots: parseInt(station.total_slots),
        available_slots: parseInt(station.available_slots),
        charging_power: station.charging_power ? parseFloat(station.charging_power) : null,
        connector_types: station.connector_types,
        opening_hours: station.opening_hours,
        avatar_url: station.avatar_url,
        contact_phone: station.contact_phone,
        status: station.status,
        created_at: station.created_at,
        avg_rating: station.avg_rating 
          ? parseFloat(parseFloat(station.avg_rating).toFixed(2))
          : 0,
        feedback_count: parseInt(station.feedback_count) || 0
      };

      if (hasLocation && station.distance !== null && station.distance !== undefined) {
        formatted.distance = parseFloat(parseFloat(station.distance).toFixed(2));
      }

      return formatted;
    });

    // Build response
    const response = {
      success: true,
      count: formattedStations.length,
      data: formattedStations
    };

    // Thêm thông tin về radius expansion nếu có
    if (hasLocation && radiusExpanded) {
      response.radius_expanded = true;
      response.original_radius = originalRadius;
      response.expanded_radius = expandedRadius;
      
      if (formattedStations.length === 0) {
        response.message = `Không có trạm sạc trong bán kính ${originalRadius}km và ${expandedRadius}km. Hiển thị các trạm gần nhất:`;
      } else if (formattedStations.length > 0 && formattedStations[0].distance > originalRadius) {
        response.message = `Không có trạm trong bán kính ${originalRadius}km. Đã mở rộng tìm kiếm trong ${expandedRadius}km:`;
      }
    }

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single station by ID
 * GET /api/stations/:id
 */
exports.getStationById = async (req, res, next) => {
  try {
    const station = await Station.findByPk(req.params.id, {
      include: [{
        model: Feedback,
        as: 'feedbacks',
        attributes: ['feedback_id', 'user_id', 'rating', 'comment', 'created_at'],
        required: false
      }]
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Calculate average rating
    const feedbacks = station.feedbacks || [];
    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : null;

    const stationData = station.toJSON();
    stationData.avg_rating = avgRating ? parseFloat(avgRating.toFixed(2)) : null;
    stationData.feedback_count = feedbacks.length;

    res.status(200).json({
      success: true,
      data: stationData
    });
  } catch (error) {
    next(error);
  }
};
