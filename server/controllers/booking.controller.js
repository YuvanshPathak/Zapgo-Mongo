const Booking = require('../models/Booking');

// POST /api/bookings — Create a new booking
const createBooking = async (req, res) => {
  try {
    const {
      uid, email, start, destination, distance, durationHours,
      initialCharge, finalCharge, rangeKm, stops
    } = req.body;

    const booking = await Booking.create({
      uid, email, start, destination, distance, durationHours,
      initialCharge, finalCharge, rangeKm,
      stops: stops || []
    });

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    console.error('createBooking error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bookings/stats — Admin aggregation stats
// IMPORTANT: Must be defined BEFORE /:id route to avoid Express conflict
const getBookingStats = async (req, res) => {
  try {
    // Pipeline 1 — overall totals
    const overallStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalDistance: {
            $sum: {
              $convert: {
                input: '$distance',
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          },
          totalHours: {
            $sum: {
              $convert: {
                input: '$durationHours',
                to: 'double',
                onError: 0,
                onNull: 0
              }
            }
          }
        }
      }
    ]);

    // Pipeline 2 — bookings per day for Chart.js
    const bookingsPerDay = await Booking.aggregate([
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overallStats: overallStats[0] || { totalBookings: 0, totalDistance: 0, totalHours: 0 },
        bookingsPerDay
      }
    });
  } catch (err) {
    console.error('getBookingStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bookings/user/:uid — Get bookings for a specific user
const getBookingsByUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const bookings = await Booking.find({ uid }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error('getBookingsByUser error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/bookings — Get all bookings (admin)
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (err) {
    console.error('getAllBookings error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/bookings/:id/stop — Add a charging stop to an existing booking
const addChargingStop = async (req, res) => {
  try {
    const { id } = req.params;
    const stop = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { $push: { stops: stop } },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (err) {
    console.error('addChargingStop error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { createBooking, getBookingStats, getBookingsByUser, getAllBookings, addChargingStop };
