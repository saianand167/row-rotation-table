const jwt = require('jsonwebtoken');

const JWT_CRITICAL_SECRET = process.env.JWT_CRITICAL_SECRET || 'rrt-critical-admin-jwt-secret-change-in-production';

/**
 * Authentication middleware for the Critical Admin.
 * Uses a separate JWT secret from regular To-Do users.
 * Reads JWT from the Authorization header (Bearer token).
 */
async function criticalAdminAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Critical Admin authentication required.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Critical Admin authentication required.' });
    }

    // Verify JWT with the critical admin secret
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_CRITICAL_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Admin session has expired. Please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid admin authentication token.' });
    }

    // Ensure this is a critical admin token
    if (decoded.role !== 'critical_admin') {
      return res.status(403).json({ error: 'You are not authorized to access this resource.' });
    }

    req.isCriticalAdmin = true;
    next();
  } catch (err) {
    console.error('Critical admin auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
}

module.exports = criticalAdminAuth;
module.exports.JWT_CRITICAL_SECRET = JWT_CRITICAL_SECRET;
