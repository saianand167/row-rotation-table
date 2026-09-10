const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'DOCUMENT_UPLOAD',
      'DOCUMENT_DUPLICATE',
      'DOCUMENT_DELETE',
      'DOCUMENT_PROCESSING',
      'DOCUMENT_QUERY',
      'CSV_UPLOAD',
      'CSV_ANALYSIS',
      'CSV_QUERY',
      'DATABASE_UPLOAD',
      'SQL_QUERY',
      'IMAGE_UPLOAD',
      'VISION_ANALYSIS',
      'VOICE_TRANSCRIPTION',
      'VOICE_TTS',
      'VIDEO_ANALYSIS',
      'AI_REQUEST',
      'AI_RESPONSE',
      'TOOL_CALL',
      'ERROR',
      'SESSION_START',
      'SESSION_END',
      'TEMP_FILE_CLEANUP',
      'RRT_UPDATE',
      'ANNOUNCEMENT_UPDATE',
      'TASK_ACTION',
      'NOTE_CREATED'
    ],
    index: true,
  },
  module: {
    type: String,
    required: true,
    enum: [
      'Auth',
      'AI Assistant',
      'Documents',
      'Data Analytics',
      'Database AI',
      'Vision AI',
      'Voice AI',
      'Video AI',
      'ORCA Marine',
      'Healthcare AI',
      'Row Rotation',
      'Admin',
      'Tasks',
      'System'
    ],
    index: true,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'INFO', 'WARNING', 'ERROR'],
    default: 'SUCCESS',
    index: true,
  },
  user: {
    type: String,
    default: 'Anonymous / Guest',
  },
  sessionId: {
    type: String,
    default: '',
    index: true,
  },
  description: {
    type: String,
    required: true,
  },
  durationMs: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Helper static method to quickly record a log
systemLogSchema.statics.record = async function ({
  action,
  module,
  status = 'SUCCESS',
  user = 'CSE-5 User',
  sessionId = '',
  description,
  durationMs = 0,
  metadata = {},
  ipAddress = '',
}) {
  try {
    return await this.create({
      action,
      module,
      status,
      user,
      sessionId,
      description,
      durationMs,
      metadata,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to write system log:', err.message);
  }
};

const SystemLog = mongoose.model('SystemLog', systemLogSchema);

module.exports = SystemLog;
