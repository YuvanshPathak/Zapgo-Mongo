const Station = require('../models/Station');

// GET /api/stations — Get all stations (public)
const getAllStations = async (req, res) => {
  try {
    const stations = await Station.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: stations });
  } catch (err) {
    console.error('getAllStations error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/stations — Add a station
const createStation = async (req, res) => {
  try {
    const { name, location, amenities } = req.body;
    const station = await Station.create({ name, location, amenities: amenities || [] });
    res.status(201).json({ success: true, data: station });
  } catch (err) {
    console.error('createStation error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// PUT /api/stations/:id — Edit a station
const updateStation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const station = await Station.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }

    res.status(200).json({ success: true, data: station });
  } catch (err) {
    console.error('updateStation error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/stations/:id — Delete a station
const deleteStation = async (req, res) => {
  try {
    const { id } = req.params;
    const station = await Station.findByIdAndDelete(id);

    if (!station) {
      return res.status(404).json({ success: false, error: 'Station not found' });
    }

    res.status(200).json({ success: true, data: station });
  } catch (err) {
    console.error('deleteStation error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAllStations, createStation, updateStation, deleteStation };
