const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const { getAllStations, createStation, updateStation, deleteStation } = require('../controllers/station.controller');

// GET /api/stations — Public, no auth required
router.get('/', getAllStations);

// POST /api/stations — Add a station (admin only)
router.post('/', verifyAdmin, createStation);

// PUT /api/stations/:id — Edit a station (admin only)
router.put('/:id', verifyAdmin, updateStation);

// DELETE /api/stations/:id — Delete a station (admin only)
router.delete('/:id', verifyAdmin, deleteStation);

module.exports = router;
