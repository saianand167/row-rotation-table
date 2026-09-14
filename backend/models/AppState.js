const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const BACKEND_BACKUP_FILE = path.resolve(__dirname, '../data/app_state.json');
const GEN_DATA_BACKUP_FILE = path.resolve(__dirname, '../../../data/rrt_state.json');

function saveToDisk(doc) {
  try {
    const customSeatingObj = {};
    if (doc.customSeating instanceof Map) {
      for (const [k, v] of doc.customSeating.entries()) {
        customSeatingObj[k] = v;
      }
    } else if (doc.customSeating && typeof doc.customSeating === 'object') {
      Object.assign(customSeatingObj, doc.customSeating);
    }

    const payload = {
      _id: 'app_state',
      currentDay: doc.currentDay,
      startDate: doc.startDate,
      lastAdvanceDate: doc.lastAdvanceDate,
      isPaused: doc.isPaused,
      isManualOverride: doc.isManualOverride,
      leaveDays: doc.leaveDays || [],
      customSeating: customSeatingObj,
      announcement: doc.announcement || { text: '', active: false },
      adminPin: doc.adminPin,
      isRowsViewEnabled: doc.isRowsViewEnabled || false,
      randomLayoutDay: doc.randomLayoutDay,
      randomLayoutGeneratedAt: doc.randomLayoutGeneratedAt,
      holidayRandomDate: doc.holidayRandomDate,
      holidayRandomSeating: doc.holidayRandomSeating || [],
      vapidPublicKey: doc.vapidPublicKey,
      vapidPrivateKey: doc.vapidPrivateKey,
    };

    const backendDataDir = path.dirname(BACKEND_BACKUP_FILE);
    if (!fs.existsSync(backendDataDir)) {
      fs.mkdirSync(backendDataDir, { recursive: true });
    }
    fs.writeFileSync(BACKEND_BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf8');

    const genDataDir = path.dirname(GEN_DATA_BACKUP_FILE);
    if (fs.existsSync(genDataDir)) {
      const rrtPayload = {
        current_day: doc.currentDay,
        last_advance_date: doc.lastAdvanceDate,
        is_paused: doc.isPaused,
        is_manual_override: doc.isManualOverride,
        leave_days: doc.leaveDays || [],
        custom_seating: customSeatingObj,
        announcement_text: doc.announcement?.text || '',
        announcement_active: doc.announcement?.active || false,
        announcement_created_at: doc.announcement?.createdAt || null,
        random_layout_day: doc.randomLayoutDay,
        holiday_random_date: doc.holidayRandomDate,
        holiday_random_seating: doc.holidayRandomSeating || [],
      };
      fs.writeFileSync(GEN_DATA_BACKUP_FILE, JSON.stringify(rrtPayload, null, 2), 'utf8');
    }
  } catch (err) {
    console.error('⚠️ Failed to save AppState snapshot to disk:', err.message);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(BACKEND_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(BACKEND_BACKUP_FILE, 'utf8'));
      if (data && (typeof data.currentDay === 'number' || typeof data.current_day === 'number')) {
        return data;
      }
    }
  } catch (e) {}

  try {
    if (fs.existsSync(GEN_DATA_BACKUP_FILE)) {
      const data = JSON.parse(fs.readFileSync(GEN_DATA_BACKUP_FILE, 'utf8'));
      if (data && typeof data.current_day === 'number') {
        return {
          currentDay: data.current_day,
          lastAdvanceDate: data.last_advance_date,
          isPaused: data.is_paused,
          isManualOverride: data.is_manual_override,
          leaveDays: data.leave_days,
          customSeating: data.custom_seating,
          announcement: {
            text: data.announcement_text || '',
            active: data.announcement_active || false,
            createdAt: data.announcement_created_at || new Date(),
          },
          randomLayoutDay: data.random_layout_day,
          holidayRandomDate: data.holiday_random_date,
          holidayRandomSeating: data.holiday_random_seating,
        };
      }
    }
  } catch (e) {}

  return null;
}

const appStateSchema = new mongoose.Schema({
  // Singleton identifier — only one document exists
  _id: {
    type: String,
    default: 'app_state',
  },

  // Current rotation day (1–24)
  currentDay: {
    type: Number,
    default: 1,
    min: 1,
    max: 24,
  },

  // Date when the rotation tracking started
  startDate: {
    type: Date,
    default: Date.now,
  },

  // Last calendar date when the day was auto-advanced
  lastAdvanceDate: {
    type: String, // Store as YYYY-MM-DD string for easy comparison
    default: () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
  },

  // Whether auto-rotation is paused
  isPaused: {
    type: Boolean,
    default: false,
  },

  // Whether the current day was manually overridden
  isManualOverride: {
    type: Boolean,
    default: false,
  },

  // Array of leave dates (stored as YYYY-MM-DD strings)
  leaveDays: {
    type: [String],
    default: [],
  },

  // Custom seating overrides per day (key: day number as string, value: array of seat codes)
  customSeating: {
    type: Map,
    of: [String],
    default: new Map(),
  },

  // Current announcement
  announcement: {
    text: { type: String, default: '' },
    active: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },

  // Admin password — set ADMIN_PIN env var in production to override
  adminPin: {
    type: String,
    default: () => process.env.ADMIN_PIN || 'CSE5@123',
  },

  // Config for whether the rows display feature is visible in the navbar
  isRowsViewEnabled: {
    type: Boolean,
    default: false,
  },

  // Track the day on which a random layout was generated
  randomLayoutDay: {
    type: Number,
    default: null,
  },

  // Track when the random layout was generated
  randomLayoutGeneratedAt: {
    type: Date,
    default: null,
  },

  // Date (YYYY-MM-DD) for which a holiday random layout is generated
  holidayRandomDate: {
    type: String,
    default: null,
  },

  // The actual 6-row seating arrangement for the holiday random layout
  holidayRandomSeating: {
    type: [String],
    default: [],
  },

  // Persistent VAPID Keys for Web Push Notifications
  vapidPublicKey: {
    type: String,
    default: null,
  },
  vapidPrivateKey: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

let memoryCachedState = null;
let memoryCacheExpiry = 0;

// Post-save hook to always sync with disk and update in-memory cache
appStateSchema.post('save', function (doc) {
  memoryCachedState = doc;
  memoryCacheExpiry = Date.now() + 30000;
  saveToDisk(doc);
});

// Get or create the singleton state document (with high-speed in-memory cache)
appStateSchema.statics.getState = async function (forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && memoryCachedState && now < memoryCacheExpiry) {
    return memoryCachedState;
  }

  let state = await this.findById('app_state');
  if (!state) {
    const backup = loadFromDisk();
    if (backup) {
      const initialDoc = {
        _id: 'app_state',
        currentDay: backup.currentDay || backup.current_day || 1,
        lastAdvanceDate: backup.lastAdvanceDate || backup.last_advance_date,
        isPaused: backup.isPaused ?? backup.is_paused ?? false,
        isManualOverride: backup.isManualOverride ?? backup.is_manual_override ?? false,
        leaveDays: backup.leaveDays || backup.leave_days || [],
        customSeating: backup.customSeating
          ? (backup.customSeating instanceof Map ? backup.customSeating : new Map(Object.entries(backup.customSeating)))
          : new Map(),
        announcement: backup.announcement || {
          text: backup.announcement_text || '',
          active: backup.announcement_active || false,
          createdAt: backup.announcement_created_at || new Date(),
        },
        isRowsViewEnabled: backup.isRowsViewEnabled ?? false,
        randomLayoutDay: backup.randomLayoutDay ?? backup.random_layout_day ?? null,
        holidayRandomDate: backup.holidayRandomDate ?? backup.holiday_random_date ?? null,
        holidayRandomSeating: backup.holidayRandomSeating || backup.holiday_random_seating || [],
      };
      if (backup.adminPin) initialDoc.adminPin = backup.adminPin;
      if (backup.vapidPublicKey) initialDoc.vapidPublicKey = backup.vapidPublicKey;
      if (backup.vapidPrivateKey) initialDoc.vapidPrivateKey = backup.vapidPrivateKey;

      state = await this.create(initialDoc);
      console.log(`💾 Restored AppState from disk snapshot (Day ${state.currentDay})`);
      saveToDisk(state);
    } else {
      state = await this.create({ _id: 'app_state' });
      saveToDisk(state);
    }
  }

  memoryCachedState = state;
  memoryCacheExpiry = now + 3000;
  return state;
};

const AppState = mongoose.model('AppState', appStateSchema);

module.exports = AppState;

