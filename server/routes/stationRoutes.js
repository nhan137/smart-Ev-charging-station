const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

/**
 * Station Routes
 * Base path: /api/stations
 */

// GET /api/stations - Get all stations with filters
router.get('/', stationController.getAllStations);

// GET /api/stations/:id - Get station by ID
router.get('/:id', stationController.getStationById);

module.exports = router;

