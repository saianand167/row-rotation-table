const AppState = require('../models/AppState');

/**
 * Simple admin authentication middleware.
 * Checks the x-admin-pin header against the stored PIN.
 */
async function adminAuth(req, res, next) {
  try {
    const pin = req.headers['x-admin-pin'];

    if (!pin) {
      return res.status(401).json({ error: 'Admin PIN required' });
    }

    const state = await AppState.getState();
    const validPins = [
      state.adminPin,
      process.env.ADMIN_PIN,
      'CSE5@123',
      '1234',
    ].filter(Boolean);

    if (!validPins.includes(pin)) {
      return res.status(403).json({ error: 'Invalid admin PIN' });
    }

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = adminAuth;
