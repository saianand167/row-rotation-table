const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TodoUser',
    required: true,
    index: true,
  },

  // Store the JWT ID (jti) to identify this session
  jti: {
    type: String,
    required: true,
    unique: true,
  },

  isRevoked: {
    type: Boolean,
    default: false,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  userAgent: {
    type: String,
    default: '',
  },

  ipAddress: {
    type: String,
    default: '',
  },

  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // adds createdAt, updatedAt
});

// TTL index: MongoDB automatically deletes expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for quick lookups
sessionSchema.index({ userId: 1, isRevoked: 1 });

const Session = mongoose.model('TodoSession', sessionSchema);

module.exports = Session;
