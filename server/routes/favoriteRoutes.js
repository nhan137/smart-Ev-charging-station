const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateFavorite } = require('../middleware/validation');
const { addFavorite, removeFavorite, getMyFavorites } = require('../controllers/favoriteController');

/**
 * POST /api/favorites
 * Add station to favorites
 * Auth: Required (JWT)
 */
router.post('/', authenticate, validateFavorite, addFavorite);

/**
 * DELETE /api/favorites/:station_id
 * Remove station from favorites
 * Auth: Required (JWT)
 */
router.delete('/:station_id', authenticate, removeFavorite);

/**
 * GET /api/favorites/my
 * Get user's favorite stations
 * Auth: Required (JWT)
 */
router.get('/my', authenticate, getMyFavorites);

module.exports = router;

