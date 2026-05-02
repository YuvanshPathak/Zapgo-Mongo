const mongoose = require('mongoose');

// Each document is one block in the tamper-evident ledger chain.
const ledgerSchema = new mongoose.Schema({
  index:     { type: Number, required: true, unique: true },
  timestamp: { type: Number, required: true },
  uid:       { type: String, default: '' },
  from:      { type: String, default: '' },
  to:        { type: String, default: '' },
  distance:  { type: String, default: '' },
  duration:  { type: String, default: '' },
  prevHash:  { type: String, required: true },
  hash:      { type: String, required: true },
}, { timestamps: false });

// Index for fast "get last block" sort
ledgerSchema.index({ index: 1 });

module.exports = mongoose.model('Ledger', ledgerSchema);
