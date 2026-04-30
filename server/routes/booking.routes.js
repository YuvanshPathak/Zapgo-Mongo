const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const {
  createBooking,
  getBookingStats,
  getBookingsByUser,
  getAllBookings,
  addChargingStop
} = require('../controllers/booking.controller');

// POST /api/bookings — Create a booking (regular user, Firebase token)
router.post('/', verifyToken, createBooking);

// GET /api/bookings/stats — Aggregation stats (admin only)
// CRITICAL: Must be defined BEFORE /user/:uid and /:id to avoid Express route conflict
router.get('/stats', verifyAdmin, getBookingStats);

// GET /api/bookings/user/:uid — Get bookings for a specific user (Firebase token)
router.get('/user/:uid', verifyToken, getBookingsByUser);

// GET /api/bookings — Get all bookings (admin only)
router.get('/', verifyAdmin, getAllBookings);

// PATCH /api/bookings/:id/stop — Add a charging stop (Firebase token)
router.patch('/:id/stop', verifyToken, addChargingStop);

module.exports = router;
