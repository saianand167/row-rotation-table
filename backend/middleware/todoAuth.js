const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'rrt-todo-jwt-secret-change-in-production';

/**
 * Authentication middleware for To-Do users.
 * Reads JWT from the Authorization header (Bearer token).
 * Verifies the token, checks the session is not revoked,
 * and attaches req.todoUser with the full user document.
 */
async function todoAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
      }
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }

    // Check session is not revoked
    const session = await Session.findOne({ jti: decoded.jti, isRevoked: false });
    if (!session) {
      return res.status(401).json({ error: 'Your session has been invalidated. Please log in again.' });
    }

    // Load the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ error: 'Your account has been disabled. Contact the administrator.' });
    }

    // Attach user to request
    req.todoUser = user;
    req.todoSession = session;

    // Update lastActiveAt timestamp asynchronously
    session.lastActiveAt = new Date();
    session.save().catch(() => {});

    next();
  } catch (err) {
    console.error('Todo auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
}

module.exports = todoAuth;
module.exports.JWT_SECRET = JWT_SECRET;
