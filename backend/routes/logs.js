const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const SystemLog = require('../models/SystemLog');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const AISession = require('../models/AISession');

/**
 * GET /api/logs
 * Query system audit logs with filters & pagination
 */
router.get('/', async (req, res) => {
  try {
    const {
      module,
      status,
      action,
      search = '',
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};
    if (module && module !== 'All') filter.module = module;
    if (status && status !== 'All') filter.status = status;
    if (action && action !== 'All') filter.action = action;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { module: { $regex: search, $options: 'i' } },
        { user: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await SystemLog.countDocuments(filter);
    const logs = await SystemLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
      logs,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system logs', details: err.message });
  }
});

/**
 * GET /api/logs/stats
 * Aggregated telemetry & metrics for Admin Overview
 */
router.get('/stats', async (req, res) => {
  try {
    const totalLogs = await SystemLog.countDocuments();
    const aiRequests = await SystemLog.countDocuments({ action: 'AI_REQUEST' });
    const documentsCount = await KnowledgeDocument.countDocuments();
    const errorCount = await SystemLog.countDocuments({ status: 'ERROR' });
    const activeSessions = await AISession.countDocuments({ status: 'ACTIVE' });
    
    const recentActivity = await SystemLog.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('action module status description createdAt durationMs');

    res.json({
      success: true,
      stats: {
        totalLogs,
        aiRequests,
        documentsCount,
        errorCount,
        activeSessions,
        recentActivity,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch telemetry stats' });
  }
});

/**
 * GET /api/logs/health
 * Live System Health & Service Telemetry
 */
router.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'Healthy' : 'Degraded';
    const tempDir = path.resolve(__dirname, '../uploads/temp');
    const docDir = path.resolve(__dirname, '../uploads/documents');

    const tempFilesCount = fs.existsSync(tempDir) ? fs.readdirSync(tempDir).length : 0;
    const docFilesCount = fs.existsSync(docDir) ? fs.readdirSync(docDir).length : 0;

    const health = {
      overall: 'Healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: dbStatus, type: 'MongoDB' },
        aiEngine: { status: 'Online', provider: 'Groq / Gemini Hybrid' },
        knowledgeBase: { status: 'Healthy', permanentDocs: docFilesCount },
        tempStorage: { status: 'Healthy', activeTempFiles: tempFilesCount },
        voiceEngine: { status: 'Online', supportedLangs: ['en-US', 'hi-IN', 'te-IN'] },
        sqlEngine: { status: 'Healthy', mode: 'Strict Read-Only' },
      }
    };

    res.json({ success: true, health });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
});

module.exports = router;
