const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Windows stores \n as literal \\n in .env — replace back to real newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;

    // If route has a :uid param, verify ownership
    if (req.params.uid && req.params.uid !== req.user.uid) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    next();
  } catch (err) {
    console.error('Token verification error:', err.message);
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

module.exports = verifyToken;
