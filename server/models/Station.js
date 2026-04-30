const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true }
});

stationSchema.index({ name: 1 });

module.exports = mongoose.model('Station', stationSchema);