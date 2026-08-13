const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TodoUser',
    required: true,
    index: true,
  },

  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title must be at most 200 characters'],
  },

  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description must be at most 1000 characters'],
    default: '',
  },

  scope: {
    type: String,
    required: true,
    enum: ['monthly', 'weekly', 'daily'],
    index: true,
  },

  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },

  deadline: {
    type: Date,
    default: null,
  },

  // Weekly tasks: which week number (1-5) and day
  weekNumber: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },

  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', null],
    default: null,
  },

  // Daily tasks: which date (YYYY-MM-DD)
  date: {
    type: String,
    default: null,
  },

  // Reference to a parent task (when added from monthly→weekly or weekly→daily)
  sourceTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TodoTask',
    default: null,
  },
}, {
  timestamps: true,
});

// Compound indexes for performant user-scoped queries
taskSchema.index({ userId: 1, scope: 1 });
taskSchema.index({ userId: 1, scope: 1, status: 1 });
taskSchema.index({ userId: 1, date: 1 });

const Task = mongoose.model('TodoTask', taskSchema);

module.exports = Task;
