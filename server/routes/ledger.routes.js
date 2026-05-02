const express = require('express');
const router  = express.Router();
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');
const { getLastBlock, addBlock, getAllBlocks, verifyLedger } = require('../controllers/ledger.controller');

// User-facing — require Firebase token
router.get('/last', verifyToken, getLastBlock);   // GET  /api/ledger/last
router.post('/',    verifyToken, addBlock);        // POST /api/ledger

// Admin-only — require shared secret
// CRITICAL: /verify must be defined BEFORE / to avoid route conflict
router.get('/verify', verifyAdmin, verifyLedger); // GET  /api/ledger/verify
router.get('/',       verifyAdmin, getAllBlocks);  // GET  /api/ledger

module.exports = router;
