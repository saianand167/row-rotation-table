const express = require('express');
const router = express.Router();
const AppState = require('../models/AppState');
const rotationData = require('../data/rotationData');

/**
 * Check if a date string (YYYY-MM-DD) is a Sunday
 */
function isSunday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === 0;
}

/**
 * Check if a date should be skipped (Sunday or leave day)
 */
function isSkipDay(dateStr, leaveDays) {
  return isSunday(dateStr) || leaveDays.includes(dateStr);
}

/**
 * Get seating for a rotation day, respecting custom overrides
 */
function getSeatingForDay(day, customSeating) {
  // Check for custom override first
  const customKey = String(day);
  if (customSeating && customSeating.get && customSeating.get(customKey)) {
    const custom = customSeating.get(customKey);
    if (custom && custom.length === 6) {
      return custom;
    }
  }
  return rotationData[day];
}

/**
 * Compute the current rotation day based on elapsed time,
 * leave days, Sundays, pause state, and manual overrides.
 */
async function computeCurrentDay(state) {
  // If paused, return the stored day as-is
  if (state.isPaused) {
    return state.currentDay;
  }

  const today = new Date().toISOString().split('T')[0];
  const lastAdvance = state.lastAdvanceDate;

  // If we're still on the same day, no advancement needed
  if (today === lastAdvance) {
    return state.currentDay;
  }

  // Calculate each date between lastAdvanceDate and today
  const start = new Date(lastAdvance);
  const end = new Date(today);
  let daysToAdvance = 0;

  const current = new Date(start);
  current.setDate(current.getDate() + 1); // Start from the day after last advance

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    // Only advance if this date is NOT a Sunday and NOT a leave day
    if (!isSkipDay(dateStr, state.leaveDays)) {
      daysToAdvance++;
    }
    current.setDate(current.getDate() + 1);
  }

  if (daysToAdvance > 0) {
    // Advance the day, wrapping around at 24
    let newDay = state.currentDay + daysToAdvance;
    while (newDay > 24) {
      newDay -= 24;
    }

    // Persist the new state
    state.currentDay = newDay;
    state.lastAdvanceDate = today;
    state.isManualOverride = false;
    await state.save();
  }

  return state.currentDay;
}

/**
 * Given today's rotation day, compute the rotation day for a calendar offset.
 * offset: -1 = yesterday, 0 = today, 1 = tomorrow, 2 = day after tomorrow
 */
function computeDayForOffset(offset, currentDay, leaveDays) {
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + offset);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  // Check if the target date itself is a skip day
  const targetIsSunday = isSunday(targetDateStr);
  const targetIsLeave = leaveDays.includes(targetDateStr);
  const targetIsSkip = targetIsSunday || targetIsLeave;

  if (targetIsSkip) {
    return {
      date: targetDateStr,
      isHoliday: true,
      reason: targetIsSunday ? 'Sunday' : 'Leave Day',
      rotationDay: null,
      seating: null,
    };
  }

  // Count active days between today and the target date
  if (offset === 0) {
    return {
      date: targetDateStr,
      isHoliday: false,
      reason: null,
      rotationDay: currentDay,
    };
  }

  let dayShift = 0;
  if (offset > 0) {
    // Count forward: how many active days between today+1 and targetDate
    const cursor = new Date(today);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor <= targetDate) {
      const ds = cursor.toISOString().split('T')[0];
      if (!isSkipDay(ds, leaveDays)) {
        dayShift++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    // Count backward: how many active days between targetDate+1 and today
    const cursor = new Date(targetDate);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor <= today) {
      const ds = cursor.toISOString().split('T')[0];
      if (!isSkipDay(ds, leaveDays)) {
        dayShift--;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  let rotationDay = currentDay + dayShift;
  // Wrap around the 24-day cycle
  while (rotationDay > 24) rotationDay -= 24;
  while (rotationDay < 1) rotationDay += 24;

  return {
    date: targetDateStr,
    isHoliday: false,
    reason: null,
    rotationDay,
  };
}

/**
 * GET /api/rotation
 * Returns the current rotation state for the student view
 */
router.get('/', async (req, res) => {
  try {
    const state = await AppState.getState();
    const currentDay = await computeCurrentDay(state);
    const seating = getSeatingForDay(currentDay, state.customSeating);

    // Calculate countdown to midnight (next rotation)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    res.json({
      currentDay,
      date: new Date().toISOString().split('T')[0],
      seating: seating.map((code, index) => ({
        row: index + 1,
        code,
        type: code.startsWith('G') ? 'girl' : 'boy',
      })),
      countdown: {
        milliseconds: msUntilMidnight,
        hours: Math.floor(msUntilMidnight / (1000 * 60 * 60)),
        minutes: Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((msUntilMidnight % (1000 * 60)) / 1000),
      },
      isPaused: state.isPaused,
      announcement: state.announcement.active ? {
        text: state.announcement.text,
        createdAt: state.announcement.createdAt,
      } : null,
    });
  } catch (err) {
    console.error('Error fetching rotation:', err);
    res.status(500).json({ error: 'Failed to fetch rotation data' });
  }
});

/**
 * GET /api/rotation/navigate?offset=N
 * Returns rotation state for a day offset (-1, 0, 1, 2)
 * Accounts for Sundays and leave days
 */
router.get('/navigate', async (req, res) => {
  try {
    const offset = parseInt(req.query.offset, 10);
    if (isNaN(offset) || offset < -7 || offset > 7) {
      return res.status(400).json({ error: 'Offset must be between -7 and 7' });
    }

    const state = await AppState.getState();
    const currentDay = await computeCurrentDay(state);
    const result = computeDayForOffset(offset, currentDay, state.leaveDays);

    if (result.isHoliday) {
      res.json({
        ...result,
        isPaused: state.isPaused,
        announcement: state.announcement.active ? {
          text: state.announcement.text,
          createdAt: state.announcement.createdAt,
        } : null,
      });
    } else {
      const seating = getSeatingForDay(result.rotationDay, state.customSeating);
      res.json({
        ...result,
        seating: seating.map((code, index) => ({
          row: index + 1,
          code,
          type: code.startsWith('G') ? 'girl' : 'boy',
        })),
        isPaused: state.isPaused,
        announcement: state.announcement.active ? {
          text: state.announcement.text,
          createdAt: state.announcement.createdAt,
        } : null,
      });
    }
  } catch (err) {
    console.error('Error navigating:', err);
    res.status(500).json({ error: 'Failed to navigate rotation' });
  }
});

module.exports = router;
