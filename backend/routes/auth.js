const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const todoAuth = require('../middleware/todoAuth');
const { JWT_SECRET } = require('../middleware/todoAuth');

const MAX_USERS = 100;
const TOKEN_EXPIRY = '24h';
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * POST /api/auth/register
 * Register a new To-Do user (enforces 100-user limit).
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (username.trim().length > 30) {
      return res.status(400).json({ error: 'Username must be at most 30 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores.' });
    }

    // Check user limit FIRST (server-side enforcement)
    const userCount = await User.countDocuments();
    if (userCount >= MAX_USERS) {
      return res.status(409).json({
        error: 'Maximum user capacity reached. New registrations are currently unavailable.',
        maxUsers: MAX_USERS,
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists. Please choose a different username.' });
    }

    // Create user (pre-save hook hashes the password)
    const user = new User({
      username: username.trim().toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please log in using your username and password.',
    });
  } catch (err) {
    // Handle duplicate key error (race condition)
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Username already exists. Please choose a different username.' });
    }
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Find user — use the same error message regardless of what failed
    // to prevent username enumeration
    const user = await User.findOne({ username: username.trim().toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ error: 'Your account has been disabled. Contact the administrator.' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT
    const jti = crypto.randomUUID();
    const token = jwt.sign(
      { userId: user._id, username: user.username, jti },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Create session record
    await Session.create({
      userId: user._id,
      jti,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
      userAgent: req.headers['user-agent'] || '',
      ipAddress: req.ip || req.connection?.remoteAddress || '',
    });

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      user: user.toJSON(),
      message: 'Login successful.',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * POST /api/auth/logout
 * Revoke the current session.
 */
router.post('/logout', todoAuth, async (req, res) => {
  try {
    if (req.todoSession) {
      req.todoSession.isRevoked = true;
      await req.todoSession.save();
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed.' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info.
 */
router.get('/me', todoAuth, async (req, res) => {
  try {
    res.json({
      user: req.todoUser.toJSON(),
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to fetch user info.' });
  }
});

/**
 * GET /api/auth/capacity
 * Check if registration is available (public endpoint).
 */
router.get('/capacity', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      maxUsers: MAX_USERS,
      currentUsers: userCount,
      registrationOpen: userCount < MAX_USERS,
    });
  } catch (err) {
    console.error('Capacity check error:', err);
    res.status(500).json({ error: 'Failed to check capacity.' });
  }
});

module.exports = router;
