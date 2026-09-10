const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  chunkIndex: { type: Number, required: true },
  text: { type: String, required: true },
  pageNumber: { type: Number, default: 1 },
  charCount: { type: Number, default: 0 },
});

const knowledgeDocumentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
  },
  fileHash: {
    type: String,
    required: true,
    unique: true, // Content-based SHA-256 deduplication
    index: true,
  },
  mimeType: {
    type: String,
    default: 'application/pdf',
  },
  sizeBytes: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    default: 1,
  },
  chunks: [chunkSchema],
  totalChunks: {
    type: Number,
    default: 0,
  },
  extractedTextPreview: {
    type: String,
    default: '',
  },
  storagePath: {
    type: String,
    default: '',
  },
  uploadedBy: {
    type: String,
    default: 'CSE-5 Student',
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  isNote: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['PROCESSING', 'READY', 'ERROR'],
    default: 'READY',
  },
}, {
  timestamps: true,
});

// Check if a document with identical content hash exists
knowledgeDocumentSchema.statics.findByHash = function (hash) {
  return this.findOne({ fileHash: hash });
};

const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);

module.exports = KnowledgeDocument;
