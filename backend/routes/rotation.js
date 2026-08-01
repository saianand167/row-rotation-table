const express = require('express');
const router = express.Router();
const AppState = require('../models/AppState');
const rotationData = require('../data/rotationData');

/**
 * Format a Date object as YYYY-MM-DD using LOCAL timezone (not UTC).
 * This avoids the toISOString() bug where IST dates shift back a day.
 */
function toDateStr(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string (YYYY-MM-DD) is a holiday (Friday, Saturday, Sunday)
 */
function isHoliday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday
}

/**
 * Check if a date should be skipped (holiday or leave day)
 */
function isSkipDay(dateStr, leaveDays) {
  return isHoliday(dateStr) || leaveDays.includes(dateStr);
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
async function computeCurrentDay(state, today) {
  if (!today) {
    today = toDateStr(new Date());
  }

  // If paused, return the stored day as-is
  if (state.isPaused) {
    return state.currentDay;
  }

  const lastAdvance = state.lastAdvanceDate;

  // If we're still on the same day, no advancement needed
  if (today === lastAdvance) {
    return state.currentDay;
  }

  // Calculate each date between lastAdvanceDate and today
  const start = new Date(lastAdvance + 'T00:00:00');
  const end = new Date(today + 'T00:00:00');
  let daysToAdvance = 0;

  const current = new Date(start);
  current.setDate(current.getDate() + 1); // Start from the day after last advance

  while (current <= end) {
    const dateStr = toDateStr(current);
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
function computeDayForOffset(offset, currentDay, leaveDays, todayStr) {
  if (!todayStr) {
    todayStr = toDateStr(new Date());
  }
  const today = new Date(todayStr + 'T00:00:00');
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + offset);
  const targetDateStr = toDateStr(targetDate);

  // Check if the target date itself is a skip day
  const targetIsHoliday = isHoliday(targetDateStr);
  const targetIsLeave = leaveDays.includes(targetDateStr);
  const targetIsSkip = targetIsHoliday || targetIsLeave;

  if (targetIsSkip) {
    let reason = 'Leave Day';
    if (targetIsHoliday) {
      const d = new Date(targetDateStr + 'T00:00:00');
      const day = d.getDay();
      if (day === 5) reason = 'Friday';
      else if (day === 6) reason = 'Saturday';
      else if (day === 0) reason = 'Sunday';
    }
    return {
      date: targetDateStr,
      isHoliday: true,
      reason,
      rotationDay: null,
      seating: null,
    };
  }

  // Count active days between today and the target date
  if (offset === 0) {
    return {
      date: toDateStr(targetDate),
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
      const ds = toDateStr(cursor);
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
      const ds = toDateStr(cursor);
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
    const clientDate = req.query.clientDate || toDateStr(new Date());
    const currentDay = await computeCurrentDay(state, clientDate);

    // Check if there is a holiday random layout for today
    const hasHolidayRandom = state.holidayRandomDate === clientDate && state.holidayRandomSeating && state.holidayRandomSeating.length === 6;

    let isTodayHoliday = isSkipDay(clientDate, state.leaveDays);
    let holidayReason = null;
    let finalSeating = null;
    let finalDay = currentDay;
    let finalIsRandomLayout = false;

    if (hasHolidayRandom) {
      // It's a holiday, but we have a random seating layout generated for today!
      isTodayHoliday = false; // Override holiday state for display
      finalSeating = state.holidayRandomSeating;
      finalDay = 'Random'; // Special string to indicate it's not a normal rotation day
      finalIsRandomLayout = true;
    } else if (isTodayHoliday) {
      if (isHoliday(clientDate)) {
        const d = new Date(clientDate + 'T00:00:00');
        const day = d.getDay();
        if (day === 5) holidayReason = 'Friday';
        else if (day === 6) holidayReason = 'Saturday';
        else if (day === 0) holidayReason = 'Sunday';
      } else {
        holidayReason = 'Leave Day';
      }
    } else {
      finalSeating = getSeatingForDay(currentDay, state.customSeating);
      finalIsRandomLayout = state.randomLayoutDay === currentDay && state.randomLayoutGeneratedAt != null;
    }

    // Calculate countdown to midnight (next rotation)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    res.json({
      currentDay: finalDay,
      date: clientDate,
      isHoliday: isTodayHoliday,
      reason: holidayReason,
      seating: isTodayHoliday ? null : finalSeating.map((code, index) => ({
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
      isRowsViewEnabled: state.isRowsViewEnabled || false,
      isRandomLayout: finalIsRandomLayout,
      isHolidayRandom: hasHolidayRandom,
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
    const clientDate = req.query.clientDate || toDateStr(new Date());
    const currentDay = await computeCurrentDay(state, clientDate);
    const result = computeDayForOffset(offset, currentDay, state.leaveDays, clientDate);

    // Check if there is a holiday random layout for the TARGET date
    const hasHolidayRandom = state.holidayRandomDate === result.date && state.holidayRandomSeating && state.holidayRandomSeating.length === 6;

    let isTargetHoliday = result.isHoliday;
    let finalSeating = null;
    let finalDay = result.rotationDay;
    let finalIsRandomLayout = false;

    if (hasHolidayRandom) {
      isTargetHoliday = false; // Override holiday state for display
      finalSeating = state.holidayRandomSeating;
      finalDay = 'Random';
      finalIsRandomLayout = true;
    } else if (!isTargetHoliday) {
      finalSeating = getSeatingForDay(result.rotationDay, state.customSeating);
      finalIsRandomLayout = state.randomLayoutDay === result.rotationDay && state.randomLayoutGeneratedAt != null;
    }

    res.json({
      ...result,
      isHoliday: isTargetHoliday,
      rotationDay: finalDay,
      seating: isTargetHoliday ? null : finalSeating.map((code, index) => ({
        row: index + 1,
        code,
        type: code.startsWith('G') ? 'girl' : 'boy',
      })),
      isPaused: state.isPaused,
      isRowsViewEnabled: state.isRowsViewEnabled || false,
      isRandomLayout: finalIsRandomLayout,
      isHolidayRandom: hasHolidayRandom,
      announcement: state.announcement.active ? {
        text: state.announcement.text,
        createdAt: state.announcement.createdAt,
      } : null,
    });
  } catch (err) {
    console.error('Error navigating:', err);
    res.status(500).json({ error: 'Failed to navigate rotation' });
  }
});

module.exports = router;
