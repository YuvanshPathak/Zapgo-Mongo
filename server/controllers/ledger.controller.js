const Ledger = require('../models/Ledger');
const { computeHash, verifyChain } = require('../utils/chainHash');

// ── GET /api/ledger/last ──────────────────────────────────────────────────────
// Returns the most recent block so the client knows the prevHash for the next block.
// Called by POST /api/ledger internally; exposed for transparency.
const getLastBlock = async (req, res) => {
  try {
    const last = await Ledger.findOne().sort({ index: -1 });
    res.status(200).json({ success: true, data: last });
  } catch (err) {
    console.error('getLastBlock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── POST /api/ledger ──────────────────────────────────────────────────────────
// Creates a new block, computes its hash server-side, and saves it.
// The client only needs to supply the booking fields (uid, from, to, distance, duration).
const addBlock = async (req, res) => {
  try {
    const { uid, from, to, distance, duration } = req.body;

    // 1) Get the tip of the chain to find prevHash
    const prevBlock = await Ledger.findOne().sort({ index: -1 });

    // 2) Build the block (without hash first)
    const block = {
      index:     prevBlock ? prevBlock.index + 1 : 0,
      timestamp: Date.now(),
      uid:       uid      || '',
      from:      from     || '',
      to:        to       || '',
      distance:  String(distance || ''),
      duration:  String(duration  || ''),
      prevHash:  prevBlock ? prevBlock.hash : '0',
    };

    // 3) Compute hash and attach it
    block.hash = computeHash(block);

    // 4) Persist
    const savedBlock = await Ledger.create(block);
    res.status(201).json({ success: true, data: savedBlock });
  } catch (err) {
    console.error('addBlock error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/ledger ───────────────────────────────────────────────────────────
// Returns all blocks sorted by index ascending (admin only).
const getAllBlocks = async (req, res) => {
  try {
    const blocks = await Ledger.find().sort({ index: 1 });
    res.status(200).json({ success: true, data: blocks });
  } catch (err) {
    console.error('getAllBlocks error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ── GET /api/ledger/verify ────────────────────────────────────────────────────
// Validates the full chain on the server and returns a simple { valid, blockCount } result.
const verifyLedger = async (req, res) => {
  try {
    const chain = await Ledger.find().sort({ index: 1 });
    const valid = verifyChain(chain);
    res.status(200).json({
      success: true,
      data: { valid, blockCount: chain.length },
    });
  } catch (err) {
    console.error('verifyLedger error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getLastBlock, addBlock, getAllBlocks, verifyLedger };
