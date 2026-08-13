const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const CriticalAdmin = require('../models/CriticalAdmin');
const User = require('../models/User');
const Session = require('../models/Session');
const Task = require('../models/Task');
const Visitor = require('../models/Visitor');
const criticalAdminAuth = require('../middleware/criticalAdminAuth');
const { JWT_CRITICAL_SECRET } = require('../middleware/criticalAdminAuth');

/**
 * POST /api/critical-admin/login
 * Authenticate the Critical Admin.
 */
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const admin = await CriticalAdmin.getAdmin();
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin password.' });
    }

    // Generate admin JWT
    const token = jwt.sign(
      { role: 'critical_admin' },
      JWT_CRITICAL_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      message: 'Critical Admin authenticated.',
    });
  } catch (err) {
    console.error('Critical admin login error:', err);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// All routes below require critical admin auth
router.use(criticalAdminAuth);

/**
 * GET /api/critical-admin/stats
 * Enhanced dashboard statistics including live active users, visitor IPs, and tasks.
 */
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSessions = await Session.countDocuments({
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
    const disabledUsers = await User.countDocuments({ isDisabled: true });

    // Live active users (active in the last 5 minutes)
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const liveActiveUsers = await Session.countDocuments({
      isRevoked: false,
      expiresAt: { $gt: new Date() },
      lastActiveAt: { $gte: fiveMinsAgo },
    });

    // Recently registered (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentlyRegistered = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Total tasks created across all users
    const totalTasks = await Task.countDocuments();

    // IP Visitor metrics
    const totalUniqueVisitors = await Visitor.countDocuments();
    const visitorAgg = await Visitor.aggregate([
      { $group: { _id: null, totalHits: { $sum: '$visitCount' } } }
    ]);
    const totalWebHits = visitorAgg[0]?.totalHits || 0;

    res.json({
      totalUsers,
      maxUsers: 100,
      availableSlots: Math.max(0, 100 - totalUsers),
      activeSessions,
      liveActiveUsers: Math.max(liveActiveUsers, activeSessions > 0 ? 1 : 0),
      disabledUsers,
      recentlyRegistered,
      totalTasks,
      totalUniqueVisitors,
      totalWebHits,
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics.' });
  }
});

/**
 * GET /api/critical-admin/visitors
 * List all IP address logs and visitor device info.
 */
router.get('/visitors', async (req, res) => {
  try {
    const visitors = await Visitor.find({}).sort({ lastVisitAt: -1 }).limit(200);
    const totalUniqueVisitors = await Visitor.countDocuments();
    const visitorAgg = await Visitor.aggregate([
      { $group: { _id: null, totalHits: { $sum: '$visitCount' } } }
    ]);
    const totalWebHits = visitorAgg[0]?.totalHits || 0;

    res.json({
      visitors,
      totalUniqueVisitors,
      totalWebHits,
    });
  } catch (err) {
    console.error('Get visitors error:', err);
    res.status(500).json({ error: 'Failed to fetch visitor logs.' });
  }
});

/**
 * GET /api/critical-admin/users
 * List all registered users with task count summary.
 */
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-passwordHash -__v')
      .sort({ createdAt: -1 });

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const sessionCount = await Session.countDocuments({
          userId: user._id,
          isRevoked: false,
          expiresAt: { $gt: new Date() },
        });

        const taskCount = await Task.countDocuments({ userId: user._id });
        const completedTaskCount = await Task.countDocuments({ userId: user._id, status: 'completed' });

        return {
          ...user.toJSON(),
          activeSessions: sessionCount,
          status: user.isDisabled ? 'Disabled' : (sessionCount > 0 ? 'Active' : 'Offline'),
          taskCount,
          completedTaskCount,
        };
      })
    );

    res.json({ users: usersWithDetails });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

/**
 * GET /api/critical-admin/user-tasks/:userId
 * Inspect all monthly, weekly, and daily tasks added by a specific user.
 */
router.get('/user-tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const targetUser = await User.findById(userId).select('-passwordHash');

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const tasks = await Task.find({ userId }).sort({ scope: 1, createdAt: -1 });

    const monthly = tasks.filter(t => t.scope === 'monthly');
    const weekly = tasks.filter(t => t.scope === 'weekly');
    const daily = tasks.filter(t => t.scope === 'daily');

    res.json({
      user: targetUser,
      tasks: {
        all: tasks,
        monthly,
        weekly,
        daily,
      },
      stats: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        inProgress: tasks.filter(t => t.status === 'in_progress').length,
      }
    });
  } catch (err) {
    console.error('Get user tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch user tasks.' });
  }
});

/**
 * GET /api/critical-admin/all-tasks
 * Inspect all tasks across all users in the system.
 */
router.get('/all-tasks', async (req, res) => {
  try {
    const tasks = await Task.find({})
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(300);

    res.json({ tasks });
  } catch (err) {
    console.error('Get all tasks error:', err);
    res.status(500).json({ error: 'Failed to fetch all tasks.' });
  }
});

/**
 * DELETE /api/critical-admin/users/:id
 * Permanently delete a user and all their data.
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete all user data
    await Task.deleteMany({ userId });
    await Session.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    res.json({
      success: true,
      message: `User "${user.username}" and all their data have been permanently deleted.`,
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

/**
 * PUT /api/critical-admin/users/:id/disable
 * Disable or enable a user account.
 */
router.put('/users/:id/disable', async (req, res) => {
  try {
    const userId = req.params.id;
    const { disabled } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.isDisabled = !!disabled;
    await user.save();

    // If disabling, revoke all active sessions
    if (disabled) {
      await Session.updateMany(
        { userId, isRevoked: false },
        { $set: { isRevoked: true } }
      );
    }

    res.json({
      success: true,
      message: disabled
        ? `User "${user.username}" has been disabled.`
        : `User "${user.username}" has been enabled.`,
    });
  } catch (err) {
    console.error('Disable user error:', err);
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

/**
 * GET /api/critical-admin/sessions
 * List all active sessions.
 */
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await Session.find({
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    })
      .populate('userId', 'username lastLoginAt')
      .sort({ createdAt: -1 });

    const formattedSessions = sessions.map((s) => ({
      _id: s._id,
      username: s.userId?.username || 'Unknown',
      userId: s.userId?._id,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt || s.updatedAt,
      expiresAt: s.expiresAt,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
    }));

    res.json({ sessions: formattedSessions });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch sessions.' });
  }
});

/**
 * POST /api/critical-admin/sessions/:id/revoke
 * Revoke a specific session.
 */
router.post('/sessions/:id/revoke', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    session.isRevoked = true;
    await session.save();

    res.json({
      success: true,
      message: 'Session revoked successfully.',
    });
  } catch (err) {
    console.error('Revoke session error:', err);
    res.status(500).json({ error: 'Failed to revoke session.' });
  }
});

module.exports = router;
