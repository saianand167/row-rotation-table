const mongoose = require('mongoose');

const tempFileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  savedPath: { type: String, required: true },
  fileType: { type: String, enum: ['CSV', 'DATABASE', 'IMAGE', 'OTHER'], required: true },
  sizeBytes: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

const aiSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user: {
    type: String,
    default: 'CSE-5 Student',
  },
  tempFiles: [tempFileSchema],
  activeTools: [{ type: String }],
  totalQueries: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['ACTIVE', 'ENDED', 'EXPIRED'],
    default: 'ACTIVE',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
  lastActivityAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const AISession = mongoose.model('AISession', aiSessionSchema);

module.exports = AISession;
