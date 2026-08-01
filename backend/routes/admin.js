const express = require('express');
const router = express.Router();
const AppState = require('../models/AppState');
const adminAuth = require('../middleware/adminAuth');
const rotationData = require('../data/rotationData');
const { broadcastUpdate } = require('../socket');
const { sendPushToAll } = require('../pushNotification');

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
    const { day, clientDate } = req.body;
    const dayNum = parseInt(day, 10);

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 24) {
      return res.status(400).json({ error: 'Day must be between 1 and 24' });
    }

    const state = await AppState.getState();
    state.currentDay = dayNum;
    state.isManualOverride = true;

    let isSkipDayToday = false;
    if (clientDate) {
      const d = new Date(clientDate + 'T00:00:00');
      const dw = d.getDay();
      isSkipDayToday = (dw === 5 || dw === 6 || dw === 0) || state.leaveDays.includes(clientDate);
    }

    if (isSkipDayToday && clientDate) {
      let nextWorkingDate = new Date(clientDate + 'T00:00:00');
      nextWorkingDate.setDate(nextWorkingDate.getDate() + 1);
      
      while (true) {
        // Need to pad correctly, so using local date components
        const y = nextWorkingDate.getFullYear();
        const m = String(nextWorkingDate.getMonth() + 1).padStart(2, '0');
        const dNum = String(nextWorkingDate.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${dNum}`;
        const dw = nextWorkingDate.getDay();
        const isSkip = (dw === 5 || dw === 6 || dw === 0) || state.leaveDays.includes(dStr);
        if (!isSkip) {
          state.lastAdvanceDate = dStr;
          break;
        }
        nextWorkingDate.setDate(nextWorkingDate.getDate() + 1);
      }
    } else {
      state.lastAdvanceDate = clientDate || new Date().toISOString().split('T')[0];
    }

    await state.save();
    broadcastUpdate('set_day', { currentDay: dayNum });
    sendPushToAll({ title: 'Day Updated 📅', body: `Rotation set to Day ${dayNum}` });

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
    broadcastUpdate('add_leave_day', { date });
    sendPushToAll({ title: 'Holiday Added 🏖️', body: `Leave day marked for ${date}` });

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
    broadcastUpdate('remove_leave_day', { date });
    sendPushToAll({ title: 'Holiday Removed 📅', body: `Leave day for ${date} removed.` });

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
    broadcastUpdate('announcement', { announcement: state.announcement });
    sendPushToAll({
      title: 'New Announcement 📢',
      body: state.announcement.text ? `"${state.announcement.text}"` : 'Announcement updated by Admin',
    });

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
    broadcastUpdate('pause', { isPaused: state.isPaused });
    sendPushToAll({
      title: state.isPaused ? 'Rotation Paused ⏸️' : 'Rotation Resumed ▶️',
      body: state.isPaused ? 'Auto-rotation is currently paused.' : 'Auto-rotation is active.',
    });

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
    if (state.randomLayoutDay === dayNum) {
      state.randomLayoutDay = null;
      state.randomLayoutGeneratedAt = null;
    }
    await state.save();
    broadcastUpdate('update_seating', { day: dayNum });
    sendPushToAll({ title: 'Seating Arrangement Updated 🪑', body: `Custom seating updated for Day ${dayNum}` });

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
    }
    if (state.randomLayoutDay === dayNum) {
      state.randomLayoutDay = null;
      state.randomLayoutGeneratedAt = null;
    }
    await state.save();
    broadcastUpdate('reset_seating', { day: dayNum });
    sendPushToAll({ title: 'Seating Reset 🪑', body: `Day ${dayNum} reset to default seating.` });

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
      isRowsViewEnabled: state.isRowsViewEnabled || false,
      randomLayoutDay: state.randomLayoutDay,
      randomLayoutGeneratedAt: state.randomLayoutGeneratedAt,
      holidayRandomDate: state.holidayRandomDate,
    });
  } catch (err) {
    console.error('Get state error:', err);
    res.status(500).json({ error: 'Failed to fetch state' });
  }
});

/**
 * POST /api/admin/toggle-rows-view
 * Toggle visibility of the Rows View in the navbar
 */
router.post('/toggle-rows-view', adminAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    const state = await AppState.getState();
    state.isRowsViewEnabled = !!enabled;
    await state.save();
    broadcastUpdate('toggle_rows_view', { isRowsViewEnabled: state.isRowsViewEnabled });

    res.json({
      success: true,
      isRowsViewEnabled: state.isRowsViewEnabled,
      message: enabled ? 'Rows view enabled' : 'Rows view disabled',
    });
  } catch (err) {
    console.error('Toggle rows view error:', err);
    res.status(500).json({ error: 'Failed to toggle rows view' });
  }
});

/**
 * POST /api/admin/generate-random-seating
 * Generate a random seating layout for the current day or holiday
 * following the specific boy/girl constraints.
 */
router.post('/generate-random-seating', adminAuth, async (req, res) => {
  try {
    const { clientDate } = req.body;
    const state = await AppState.getState();
    const currentDay = state.currentDay;

    // Determine if it's a holiday based on clientDate
    let isHolidayToday = false;
    if (clientDate) {
      const d = new Date(clientDate + 'T00:00:00');
      const day = d.getDay();
      isHolidayToday = (day === 5 || day === 6 || day === 0) || state.leaveDays.includes(clientDate);
    }

    // 1. Pick a random consecutive pair of rows for boys
    // Options: rows 3 & 4 (index 2 & 3), rows 4 & 5 (index 3 & 4), rows 5 & 6 (index 4 & 5)
    const boyPairs = [
      [2, 3],
      [3, 4],
      [4, 5]
    ];
    const randomPair = boyPairs[Math.floor(Math.random() * boyPairs.length)];

    // 2. Shuffle boys
    const boys = ['B1', 'B2'];
    if (Math.random() < 0.5) {
      boys.reverse();
    }

    // 3. Shuffle girls
    const girls = ['G1', 'G2', 'G3', 'G4'];
    for (let i = girls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [girls[i], girls[j]] = [girls[j], girls[i]];
    }

    // 4. Construct final seating array of 6 rows
    const arrangement = new Array(6);
    // Place boys
    arrangement[randomPair[0]] = boys[0];
    arrangement[randomPair[1]] = boys[1];

    // Place girls in remaining spots
    let girlIdx = 0;
    for (let i = 0; i < 6; i++) {
      if (arrangement[i] === undefined) {
        arrangement[i] = girls[girlIdx++];
      }
    }

    // 5. Save arrangement based on whether it's a holiday
    if (isHolidayToday && clientDate) {
      state.holidayRandomDate = clientDate;
      state.holidayRandomSeating = arrangement;
      await state.save();
      broadcastUpdate('generate_random', { day: 'Random' });
      sendPushToAll({ title: 'Random Seating Generated 🎲', body: "Today's random layout is displayed!" });

      res.json({
        success: true,
        day: 'Random',
        arrangement,
        message: `Holiday random seating generated for ${clientDate}`,
      });
    } else {
      if (!state.customSeating) {
        state.customSeating = new Map();
      }
      state.customSeating.set(String(currentDay), arrangement);

      // 6. Label as random layout
      state.randomLayoutDay = currentDay;
      state.randomLayoutGeneratedAt = new Date();
      await state.save();
      broadcastUpdate('generate_random', { day: currentDay });
      sendPushToAll({ title: 'Random Seating Generated 🎲', body: `Random layout generated for Day ${currentDay}` });

      res.json({
        success: true,
        day: currentDay,
        arrangement,
        randomLayoutGeneratedAt: state.randomLayoutGeneratedAt,
        message: `Random seating arrangement generated for Day ${currentDay}`,
      });
    }
  } catch (err) {
    console.error('Generate random seating error:', err);
    res.status(500).json({ error: 'Failed to generate random seating' });
  }
});

/**
 * POST /api/admin/clear-random-seating
 * Clears any generated random seating layout (holiday or regular)
 */
router.post('/clear-random-seating', adminAuth, async (req, res) => {
  try {
    const state = await AppState.getState();
    
    // Clear regular random layout
    if (state.randomLayoutDay != null) {
      if (state.customSeating && state.customSeating.has(String(state.randomLayoutDay))) {
        state.customSeating.delete(String(state.randomLayoutDay));
      }
    }
    state.randomLayoutDay = null;
    state.randomLayoutGeneratedAt = null;

    // Clear holiday random layout
    state.holidayRandomDate = null;
    state.holidayRandomSeating = [];

    await state.save();
    broadcastUpdate('clear_random', {});
    sendPushToAll({ title: 'Random Layout Cleared 🔄', body: 'Restored standard rotation layout.' });

    res.json({
      success: true,
      message: 'Random layout cleared. Normal display restored.',
    });
  } catch (err) {
    console.error('Clear random seating error:', err);
    res.status(500).json({ error: 'Failed to clear random seating' });
  }
});

module.exports = router;
