const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String },
  arrival: { type: String },
  departure: { type: String },
  chargeMins: { type: Number }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  email: { type: String },
  start: { type: String },
  destination: { type: String },
  distance: { type: String },
  durationHours: { type: String },
  initialCharge: { type: Number },
  finalCharge: { type: Number },
  rangeKm: { type: Number },
  stops: [stopSchema],
  createdAt: { type: Date, default: Date.now }
});

bookingSchema.index({ uid: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
