const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and attach user info to request.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // user = { id, email, role, subscription_tier }
    next();
  });
}

/**
 * Middleware to restrict route to admin users only.
 * Must be used AFTER authenticateToken.
 */
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Admin access required' });
  }
}

module.exports = { authenticateToken, requireAdmin };