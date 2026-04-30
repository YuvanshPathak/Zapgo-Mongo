// middleware/verifyAdmin.js
// Checks for a shared admin secret in the Authorization header.
// Used by admin-only routes where Firebase Auth is not available
// (admin logs in via username/password, not Firebase).

const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];

  if (token !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }

  next();
};

module.exports = verifyAdmin;
