const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateFeedback } = require('../middleware/validation');
const { createFeedback } = require('../controllers/feedbackController');

/**
 * POST /api/feedbacks
 * Create feedback/rating for a station
 * Auth: Required (JWT)
 */
router.post('/', authenticate, validateFeedback, createFeedback);

module.exports = router;

