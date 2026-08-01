const mongoose = require('mongoose');

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
    default: () => new Date().toISOString().split('T')[0],
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

// Get or create the singleton state document
appStateSchema.statics.getState = async function () {
  let state = await this.findById('app_state');
  if (!state) {
    state = await this.create({ _id: 'app_state' });
  }
  return state;
};

const AppState = mongoose.model('AppState', appStateSchema);

module.exports = AppState;
