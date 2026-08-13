const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const todoAuth = require('../middleware/todoAuth');

// All routes require authentication
router.use(todoAuth);

// ─── Helper: get today's date as YYYY-MM-DD ──────────────
function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ─── Helper: get current week number in month (1-5) ──────
function getCurrentWeekNumber() {
  const now = new Date();
  const dayOfMonth = now.getDate();
  return Math.ceil(dayOfMonth / 7);
}

// ─── Helper: validate task ownership ─────────────────────
async function findOwnTask(taskId, userId) {
  const task = await Task.findById(taskId);
  if (!task) return null;
  if (task.userId.toString() !== userId.toString()) return null;
  return task;
}

// ═══════════════════════════════════════════════════════════
//  MONTHLY TASKS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/todos/monthly
 */
router.get('/monthly', async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.todoUser._id,
      scope: 'monthly',
    }).sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    console.error('Get monthly tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch monthly tasks.' });
  }
});

/**
 * POST /api/todos/monthly
 */
router.post('/monthly', async (req, res) => {
  try {
    const { title, description, priority, deadline } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const task = await Task.create({
      userId: req.todoUser._id,
      title: title.trim(),
      description: description?.trim() || '',
      scope: 'monthly',
      priority: priority || 'medium',
      deadline: deadline || null,
    });

    res.status(201).json({ task, message: 'Task created successfully.' });
  } catch (err) {
    console.error('Create monthly task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

/**
 * PUT /api/todos/monthly/:id
 */
router.put('/monthly/:id', async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.todoUser._id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, priority, deadline, status } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (status !== undefined) task.status = status;

    await task.save();
    res.json({ task, message: 'Task updated successfully.' });
  } catch (err) {
    console.error('Update monthly task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

/**
 * DELETE /api/todos/monthly/:id
 */
router.delete('/monthly/:id', async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.todoUser._id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await Task.deleteOne({ _id: task._id });
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete monthly task error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// ═══════════════════════════════════════════════════════════
//  WEEKLY TASKS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/todos/weekly
 */
router.get('/weekly', async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.todoUser._id,
      scope: 'weekly',
    }).sort({ weekNumber: 1, dayOfWeek: 1, createdAt: -1 });

    res.json({ tasks });
  } catch (err) {
    console.error('Get weekly tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch weekly tasks.' });
  }
});

/**
 * POST /api/todos/weekly
 */
router.post('/weekly', async (req, res) => {
  try {
    const { title, description, priority, deadline, weekNumber, dayOfWeek, sourceTaskId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const task = await Task.create({
      userId: req.todoUser._id,
      title: title.trim(),
      description: description?.trim() || '',
      scope: 'weekly',
      priority: priority || 'medium',
      deadline: deadline || null,
      weekNumber: weekNumber || getCurrentWeekNumber(),
      dayOfWeek: dayOfWeek || null,
      sourceTaskId: sourceTaskId || null,
    });

    res.status(201).json({ task, message: 'Task created successfully.' });
  } catch (err) {
    console.error('Create weekly task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

/**
 * PUT /api/todos/weekly/:id
 */
router.put('/weekly/:id', async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.todoUser._id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, priority, deadline, status, weekNumber, dayOfWeek } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (deadline !== undefined) task.deadline = deadline;
    if (status !== undefined) task.status = status;
    if (weekNumber !== undefined) task.weekNumber = weekNumber;
    if (dayOfWeek !== undefined) task.dayOfWeek = dayOfWeek;

    await task.save();
    res.json({ task, message: 'Task updated successfully.' });
  } catch (err) {
    console.error('Update weekly task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

/**
 * DELETE /api/todos/weekly/:id
 */
router.delete('/weekly/:id', async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.todoUser._id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await Task.deleteOne({ _id: task._id });
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete weekly task error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

/**
 * POST /api/todos/weekly/generate
 * Generate weekly task suggestions from monthly tasks.
 * Does NOT save anything — returns suggestions for user review.
 */
router.post('/weekly/generate', async (req, res) => {
  try {
    // Get all pending/in-progress monthly tasks
    const monthlyTasks = await Task.find({
      userId: req.todoUser._id,
      scope: 'monthly',
      status: { $in: ['pending', 'in_progress'] },
    });

    if (monthlyTasks.length === 0) {
      return res.json({
        suggestions: [],
        message: 'No pending monthly tasks to break down.',
      });
    }

    const days = ['monday', 'tuesday', 'wednesday', 'thursday'];
    const suggestions = [];

    // Distribute monthly tasks across 4 weeks
    monthlyTasks.forEach((task, index) => {
      const weekNum = (index % 4) + 1;
      const dayIdx = index % days.length;

      // If task title looks like it could be split (e.g., "Complete DBMS syllabus")
      // suggest 4 weekly sub-tasks
      if (task.title.toLowerCase().includes('complete') ||
          task.title.toLowerCase().includes('finish') ||
          task.title.toLowerCase().includes('study') ||
          task.title.toLowerCase().includes('learn')) {
        // Create sub-tasks for each week
        for (let w = 1; w <= 4; w++) {
          suggestions.push({
            title: `${task.title} - Part ${w}`,
            description: `Week ${w} portion of: ${task.title}`,
            weekNumber: w,
            dayOfWeek: days[(index + w - 1) % days.length],
            priority: task.priority,
            sourceTaskId: task._id,
            sourceTitle: task.title,
          });
        }
      } else {
        // Single task, assign to a specific week
        suggestions.push({
          title: task.title,
          description: task.description || `From monthly goal: ${task.title}`,
          weekNumber: weekNum,
          dayOfWeek: days[dayIdx],
          priority: task.priority,
          sourceTaskId: task._id,
          sourceTitle: task.title,
        });
      }
    });

    res.json({
      suggestions,
      message: `Generated ${suggestions.length} weekly task suggestions from ${monthlyTasks.length} monthly tasks.`,
    });
  } catch (err) {
    console.error('Generate weekly tasks error:', err);
    res.status(500).json({ error: 'Failed to generate weekly plan.' });
  }
});

/**
 * POST /api/todos/weekly/save-generated
 * Save accepted generated weekly tasks (batch create).
 */
router.post('/weekly/save-generated', async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: 'No tasks to save.' });
    }

    const created = [];
    for (const t of tasks) {
      const task = await Task.create({
        userId: req.todoUser._id,
        title: t.title?.trim() || 'Untitled',
        description: t.description?.trim() || '',
        scope: 'weekly',
        priority: t.priority || 'medium',
        weekNumber: t.weekNumber || getCurrentWeekNumber(),
        dayOfWeek: t.dayOfWeek || null,
        sourceTaskId: t.sourceTaskId || null,
      });
      created.push(task);
    }

    res.status(201).json({
      tasks: created,
      message: `${created.length} weekly tasks created successfully.`,
    });
  } catch (err) {
    console.error('Save generated weekly tasks error:', err);
    res.status(500).json({ error: 'Failed to save weekly tasks.' });
  }
});

// ═══════════════════════════════════════════════════════════
//  DAILY TASKS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/todos/daily
 * Get tasks for today (or specified date).
 */
router.get('/daily', async (req, res) => {
  try {
    const date = req.query.date || getTodayStr();

    const tasks = await Task.find({
      userId: req.todoUser._id,
      scope: 'daily',
      date: date,
    }).sort({ createdAt: -1 });

    res.json({ tasks, date });
  } catch (err) {
    console.error('Get daily tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch daily tasks.' });
  }
});

/**
 * POST /api/todos/daily
 * Create a new daily task.
 */
router.post('/daily', async (req, res) => {
  try {
    const { title, description, priority, date, sourceTaskId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const task = await Task.create({
      userId: req.todoUser._id,
      title: title.trim(),
      description: description?.trim() || '',
      scope: 'daily',
      priority: priority || 'medium',
      date: date || getTodayStr(),
      sourceTaskId: sourceTaskId || null,
    });

    res.status(201).json({ task, message: 'Task created successfully.' });
  } catch (err) {
    console.error('Create daily task error:', err);
    res.status(500).json({ error: 'Failed to create task.' });
  }
});

/**
 * PUT /api/todos/daily/:id
 */
router.put('/daily/:id', async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.todoUser._id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { title, description, priority, status } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;

    await task.save();
    res.json({ task, message: 'Task updated successfully.' });
  } catch (err) {
    console.error('Update daily task error:', err);
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

/**
 * DELETE /api/todos/daily/:id
 */
router.delete('/daily/:id', async (req, res) => {
  try {
    const task = await findOwnTask(req.params.id, req.todoUser._id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await Task.deleteOne({ _id: task._id });
    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Delete daily task error:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

/**
 * POST /api/todos/daily/add-existing
 * Add an existing monthly/weekly task to today's agenda.
 * Creates a daily reference task (does NOT duplicate the original).
 */
router.post('/daily/add-existing', async (req, res) => {
  try {
    const { taskId, date } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required.' });
    }

    // Find the source task and verify ownership
    const sourceTask = await findOwnTask(taskId, req.todoUser._id);
    if (!sourceTask) {
      return res.status(404).json({ error: 'Source task not found.' });
    }

    const todayStr = date || getTodayStr();

    // Check if already added to today
    const existing = await Task.findOne({
      userId: req.todoUser._id,
      scope: 'daily',
      sourceTaskId: sourceTask._id,
      date: todayStr,
    });

    if (existing) {
      return res.status(409).json({ error: 'This task is already in today\'s agenda.' });
    }

    // Create a daily task referencing the source
    const dailyTask = await Task.create({
      userId: req.todoUser._id,
      title: sourceTask.title,
      description: sourceTask.description,
      scope: 'daily',
      priority: sourceTask.priority,
      date: todayStr,
      sourceTaskId: sourceTask._id,
    });

    res.status(201).json({ task: dailyTask, message: 'Task added to today\'s agenda.' });
  } catch (err) {
    console.error('Add existing to daily error:', err);
    res.status(500).json({ error: 'Failed to add task to today.' });
  }
});

// ═══════════════════════════════════════════════════════════
//  PROGRESS
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/todos/progress
 * Get progress stats for the authenticated user.
 */
router.get('/progress', async (req, res) => {
  try {
    const userId = req.todoUser._id;
    const todayStr = getTodayStr();

    // Monthly progress
    const monthlyTotal = await Task.countDocuments({ userId, scope: 'monthly' });
    const monthlyCompleted = await Task.countDocuments({ userId, scope: 'monthly', status: 'completed' });

    // Weekly progress
    const weeklyTotal = await Task.countDocuments({ userId, scope: 'weekly' });
    const weeklyCompleted = await Task.countDocuments({ userId, scope: 'weekly', status: 'completed' });

    // Daily progress (today only)
    const dailyTotal = await Task.countDocuments({ userId, scope: 'daily', date: todayStr });
    const dailyCompleted = await Task.countDocuments({ userId, scope: 'daily', date: todayStr, status: 'completed' });

    res.json({
      monthly: {
        total: monthlyTotal,
        completed: monthlyCompleted,
        percentage: monthlyTotal > 0 ? Math.round((monthlyCompleted / monthlyTotal) * 100) : 0,
      },
      weekly: {
        total: weeklyTotal,
        completed: weeklyCompleted,
        percentage: weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0,
      },
      daily: {
        total: dailyTotal,
        completed: dailyCompleted,
        percentage: dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('Get progress error:', err);
    res.status(500).json({ error: 'Failed to fetch progress.' });
  }
});

module.exports = router;
