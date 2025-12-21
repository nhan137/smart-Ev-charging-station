const Feedback = require('../models/Feedback');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { validationResult } = require('express-validator');

/**
 * Create feedback/rating for a station
 * POST /api/feedbacks
 */
exports.createFeedback = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[FeedbackController] Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.user_id;
    const { station_id, booking_id, rating, comment } = req.body;

    // Verify station exists
    const station = await Station.findByPk(station_id);
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // If booking_id is provided, verify user completed booking at this station
    if (booking_id) {
      const booking = await Booking.findOne({
        where: {
          booking_id: booking_id,
          user_id: userId,
          station_id: station_id,
          status: 'completed'
        }
      });

      if (!booking) {
        return res.status(403).json({
          success: false,
          message: 'You can only rate stations where you have completed a charging session'
        });
      }
    }

    // Create feedback
    const feedback = await Feedback.create({
      user_id: userId,
      station_id: station_id,
      booking_id: booking_id || null,
      rating: rating,
      comment: comment || null
    });

    // Return response with station name
    res.status(201).json({
      success: true,
      data: {
        feedback_id: feedback.feedback_id,
        station_name: station.station_name,
        rating: feedback.rating,
        comment: feedback.comment,
        created_at: feedback.created_at
      }
    });
  } catch (error) {
    console.error('[FeedbackController] Error creating feedback:', error);
    next(error);
  }
};

