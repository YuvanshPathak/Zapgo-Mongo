const express = require('express');
const router = express.Router();
const verifyAdmin = require('../middleware/verifyAdmin');
const { upsertUser, getAllUsers, deleteUser } = require('../controllers/user.controller');

// POST /api/users — Create or update user on login (called from React with Firebase token)
const verifyToken = require('../middleware/verifyToken');
router.post('/', verifyToken, upsertUser);

// GET /api/users — Get all users (admin only)
router.get('/', verifyAdmin, getAllUsers);

// DELETE /api/users/:uid — Delete user by uid (admin only)
router.delete('/:uid', verifyAdmin, deleteUser);

module.exports = router;
