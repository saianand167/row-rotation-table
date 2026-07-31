const express = require('express');
const router = express.Router();
const AppState = require('../models/AppState');
const adminAuth = require('../middleware/adminAuth');
const rotationData = require('../data/rotationData');

/**
 * POST /api/admin/verify
 * Verify admin password (no middleware — this IS the verification)
 */
router.post('/verify', async (req, res) => {
  try {
    const { pin } = req.body;
    const state = await AppState.getState();

    if (pin === state.adminPin) {
      res.json({ success: true, message: 'Password verified' });
    } else {
      res.status(403).json({ success: false, error: 'Invalid password' });
    }
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * POST /api/admin/set-day
 * Manually set the current rotation day (1–24)
 */
router.post('/set-day', adminAuth, async (req, res) => {
  try {
    const { day } = req.body;
    const dayNum = parseInt(day, 10);

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 24) {
      return res.status(400).json({ error: 'Day must be between 1 and 24' });
    }

    const state = await AppState.getState();
    state.currentDay = dayNum;
    state.isManualOverride = true;
    state.lastAdvanceDate = new Date().toISOString().split('T')[0];
    await state.save();

    res.json({ success: true, currentDay: dayNum, message: `Day set to ${dayNum}` });
  } catch (err) {
    console.error('Set day error:', err);
    res.status(500).json({ error: 'Failed to set day' });
  }
});

/**
 * GET /api/admin/leave-days
 * Get all configured leave days
 */
router.get('/leave-days', adminAuth, async (req, res) => {
  try {
    const state = await AppState.getState();
    res.json({ leaveDays: state.leaveDays });
  } catch (err) {
    console.error('Get leave days error:', err);
    res.status(500).json({ error: 'Failed to fetch leave days' });
  }
});

/**
 * POST /api/admin/leave-days
 * Add a new leave day
 */
router.post('/leave-days', adminAuth, async (req, res) => {
  try {
    const { date } = req.body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format' });
    }

    const state = await AppState.getState();

    if (state.leaveDays.includes(date)) {
      return res.status(400).json({ error: 'Date is already marked as leave' });
    }

    state.leaveDays.push(date);
    state.leaveDays.sort();
    await state.save();

    res.json({ success: true, leaveDays: state.leaveDays, message: `Leave added for ${date}` });
  } catch (err) {
    console.error('Add leave day error:', err);
    res.status(500).json({ error: 'Failed to add leave day' });
  }
});

/**
 * DELETE /api/admin/leave-days
 * Remove a leave day
 */
router.delete('/leave-days', adminAuth, async (req, res) => {
  try {
    const { date } = req.body;

    const state = await AppState.getState();
    const index = state.leaveDays.indexOf(date);

    if (index === -1) {
      return res.status(404).json({ error: 'Date not found in leave days' });
    }

    state.leaveDays.splice(index, 1);
    await state.save();

    res.json({ success: true, leaveDays: state.leaveDays, message: `Leave removed for ${date}` });
  } catch (err) {
    console.error('Remove leave day error:', err);
    res.status(500).json({ error: 'Failed to remove leave day' });
  }
});

/**
 * POST /api/admin/announcement
 * Set or clear the current announcement
 */
router.post('/announcement', adminAuth, async (req, res) => {
  try {
    const { text, active } = req.body;

    const state = await AppState.getState();
    state.announcement = {
      text: text || '',
      active: active !== undefined ? active : true,
      createdAt: new Date(),
    };
    await state.save();

    res.json({
      success: true,
      announcement: state.announcement,
      message: active ? 'Announcement published' : 'Announcement cleared',
    });
  } catch (err) {
    console.error('Announcement error:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

/**
 * POST /api/admin/pause
 * Pause or resume auto-rotation
 */
router.post('/pause', adminAuth, async (req, res) => {
  try {
    const { paused } = req.body;

    const state = await AppState.getState();
    state.isPaused = !!paused;

    // When resuming, reset lastAdvanceDate to today so it doesn't
    // try to catch up on missed days while paused
    if (!paused) {
      state.lastAdvanceDate = new Date().toISOString().split('T')[0];
    }

    await state.save();

    res.json({
      success: true,
      isPaused: state.isPaused,
      message: paused ? 'Rotation paused' : 'Rotation resumed',
    });
  } catch (err) {
    console.error('Pause error:', err);
    res.status(500).json({ error: 'Failed to update pause state' });
  }
});

/**
 * PUT /api/admin/seating/:day
 * Edit the seating arrangement for a specific day (1–24)
 */
router.put('/seating/:day', adminAuth, async (req, res) => {
  try {
    const dayNum = parseInt(req.params.day, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 24) {
      return res.status(400).json({ error: 'Day must be between 1 and 24' });
    }

    const { arrangement } = req.body;
    if (!arrangement || !Array.isArray(arrangement) || arrangement.length !== 6) {
      return res.status(400).json({ error: 'Arrangement must be an array of exactly 6 seat codes' });
    }

    // Validate each seat code
    const validCodes = ['G1', 'G2', 'G3', 'G4', 'B1', 'B2'];
    for (const code of arrangement) {
      if (!validCodes.includes(code)) {
        return res.status(400).json({ error: `Invalid seat code: ${code}. Valid codes: ${validCodes.join(', ')}` });
      }
    }

    // Check for duplicates
    const unique = new Set(arrangement);
    if (unique.size !== 6) {
      return res.status(400).json({ error: 'Each seat code must appear exactly once' });
    }

    const state = await AppState.getState();
    if (!state.customSeating) {
      state.customSeating = new Map();
    }
    state.customSeating.set(String(dayNum), arrangement);
    await state.save();

    res.json({
      success: true,
      day: dayNum,
      arrangement,
      message: `Seating for Day ${dayNum} updated`,
    });
  } catch (err) {
    console.error('Edit seating error:', err);
    res.status(500).json({ error: 'Failed to update seating' });
  }
});

/**
 * DELETE /api/admin/seating/:day
 * Reset a day's seating back to default
 */
router.delete('/seating/:day', adminAuth, async (req, res) => {
  try {
    const dayNum = parseInt(req.params.day, 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 24) {
      return res.status(400).json({ error: 'Day must be between 1 and 24' });
    }

    const state = await AppState.getState();
    if (state.customSeating) {
      state.customSeating.delete(String(dayNum));
      await state.save();
    }

    res.json({
      success: true,
      day: dayNum,
      arrangement: rotationData[dayNum],
      message: `Day ${dayNum} reset to default seating`,
    });
  } catch (err) {
    console.error('Reset seating error:', err);
    res.status(500).json({ error: 'Failed to reset seating' });
  }
});

/**
 * GET /api/admin/seating
 * Get all seating data (defaults + custom overrides)
 */
router.get('/seating', adminAuth, async (req, res) => {
  try {
    const state = await AppState.getState();
    const allSeating = {};

    for (let d = 1; d <= 24; d++) {
      const customKey = String(d);
      const custom = state.customSeating?.get(customKey);
      allSeating[d] = {
        arrangement: (custom && custom.length === 6) ? custom : rotationData[d],
        isCustom: !!(custom && custom.length === 6),
      };
    }

    res.json({ seating: allSeating });
  } catch (err) {
    console.error('Get seating error:', err);
    res.status(500).json({ error: 'Failed to fetch seating data' });
  }
});

/**
 * GET /api/admin/state
 * Get full admin state (for admin panel display)
 */
router.get('/state', adminAuth, async (req, res) => {
  try {
    const state = await AppState.getState();
    res.json({
      currentDay: state.currentDay,
      isPaused: state.isPaused,
      isManualOverride: state.isManualOverride,
      leaveDays: state.leaveDays,
      announcement: state.announcement,
      lastAdvanceDate: state.lastAdvanceDate,
      customSeatingCount: state.customSeating ? state.customSeating.size : 0,
    });
  } catch (err) {
    console.error('Get state error:', err);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

module.exports = router;
