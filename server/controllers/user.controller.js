const User = require('../models/User');

// POST /api/users — Create or update user on login
const upsertUser = async (req, res) => {
  try {
    const { uid, email, displayName, photoURL, role } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      { uid, email, displayName, photoURL, ...(role && { role }) },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error('upsertUser error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/users — Get all users (admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error('getAllUsers error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/users/:uid — Delete user by uid
const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const deleted = await User.findOneAndDelete({ uid });

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: deleted });
  } catch (err) {
    console.error('deleteUser error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { upsertUser, getAllUsers, deleteUser };
