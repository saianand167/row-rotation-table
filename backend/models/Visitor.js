const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  ipAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userAgent: {
    type: String,
    default: '',
  },
  visitCount: {
    type: Number,
    default: 1,
  },
  lastVisitAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const Visitor = mongoose.model('VisitorLog', visitorSchema);

module.exports = Visitor;
