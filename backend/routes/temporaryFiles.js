const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const XLSX = require('xlsx');
const AISession = require('../models/AISession');
const SystemLog = require('../models/SystemLog');
const aiService = require('../services/aiService');

// Temporary files directory
const tempDir = path.resolve(__dirname, '../uploads/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
});

const sessionDataCache = new Map();

/**
 * POST /api/temp/session/start
 */
router.post('/session/start', async (req, res) => {
  try {
    const sessionId = req.body.sessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const user = req.body.user || 'CSE-5 Student';

    const session = await AISession.findOneAndUpdate(
      { sessionId },
      {
        $setOnInsert: {
          sessionId,
          user,
          tempFiles: [],
          startedAt: new Date(),
          status: 'ACTIVE',
        },
        $set: { lastActivityAt: new Date() },
      },
      { upsert: true, new: true }
    );

    await SystemLog.record({
      action: 'SESSION_START',
      module: 'System',
      status: 'INFO',
      sessionId,
      description: `AI Session started for ${user}`,
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      startedAt: session.startedAt,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start session', details: err.message });
  }
});

/**
 * POST /api/temp/session/end
 */
router.post('/session/end', async (req, res) => {
  const startTime = Date.now();
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await AISession.findOne({ sessionId });
    let deletedFilesCount = 0;

    if (session && session.tempFiles) {
      for (const file of session.tempFiles) {
        if (file.savedPath && fs.existsSync(file.savedPath)) {
          try {
            fs.unlinkSync(file.savedPath);
            deletedFilesCount++;
          } catch (e) {
            console.warn(`Could not delete temp file ${file.savedPath}:`, e.message);
          }
        }
      }

      session.status = 'ENDED';
      session.endedAt = new Date();
      await session.save();
    }

    sessionDataCache.delete(sessionId);
    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'TEMP_FILE_CLEANUP',
      module: 'System',
      status: 'SUCCESS',
      sessionId,
      description: `Session ended: Purged ${deletedFilesCount} temporary files in ${durationMs}ms`,
      durationMs,
      metadata: { deletedFilesCount },
    });

    res.json({
      success: true,
      message: `Session ${sessionId} terminated. ${deletedFilesCount} temporary session files purged. Permanent documents remain safe.`,
      deletedFilesCount,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end session', details: err.message });
  }
});

/**
 * Helper to convert Excel (.xlsx, .xls), JSON, or raw text into CSV format
 */
function convertToCSVString(fileBuffer, filename, rawText = '') {
  const ext = filename.split('.').pop()?.toLowerCase();

  // 1. Excel files (.xlsx, .xls)
  if (ext === 'xlsx' || ext === 'xls') {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_csv(sheet);
  }

  // 2. JSON files (.json)
  if (ext === 'json') {
    const jsonStr = rawText || fileBuffer.toString('utf-8');
    const parsed = JSON.parse(jsonStr);
    const arr = Array.isArray(parsed) ? parsed : (parsed.data || [parsed]);
    if (arr.length === 0) return '';
    const headers = Object.keys(arr[0]);
    const lines = [headers.join(',')];
    for (const item of arr) {
      lines.push(headers.map(h => `"${String(item[h] ?? '').replace(/"/g, '""')}"`).join(','));
    }
    return lines.join('\n');
  }

  // 3. Standard CSV or plain text
  return rawText || fileBuffer.toString('utf-8');
}

/**
 * POST /api/temp/csv/upload
 * Supports CSV, Excel (.xlsx, .xls), and JSON datasets
 */
router.post('/csv/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    const sessionId = req.body.sessionId || `session_${Date.now()}`;
    let csvContent = '';
    let filename = 'dataset.csv';

    if (req.file) {
      filename = req.file.originalname;
      csvContent = convertToCSVString(req.file.buffer, filename);
    } else if (req.body.csvText) {
      csvContent = req.body.csvText;
      filename = req.body.filename || 'dataset.csv';
    } else {
      return res.status(400).json({ error: 'Please provide CSV, Excel, or JSON file' });
    }

    const safeName = `temp_${sessionId}_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(tempDir, safeName);
    fs.writeFileSync(filePath, csvContent);

    // Profile dataset
    const profile = aiService.profileCSVData(csvContent);
    if (profile.error) {
      return res.status(400).json({ error: profile.error });
    }

    if (!sessionDataCache.has(sessionId)) sessionDataCache.set(sessionId, {});
    const sData = sessionDataCache.get(sessionId);
    sData.activeCsvProfile = profile;
    sData.csvFilename = filename;

    await AISession.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          tempFiles: {
            originalName: filename,
            savedPath: filePath,
            fileType: 'CSV',
            sizeBytes: Buffer.byteLength(csvContent),
          }
        },
        $set: { lastActivityAt: new Date() },
      },
      { upsert: true }
    );

    const initialAnalysis = await aiService.analyzeCSVDataset(profile);
    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'CSV_UPLOAD',
      module: 'Data Analytics',
      status: 'SUCCESS',
      sessionId,
      description: `Temporary dataset '${filename}' profiled (${profile.rowCount} rows, ${profile.colCount} cols)`,
      durationMs,
      metadata: { filename, rowCount: profile.rowCount, colCount: profile.colCount },
    });

    res.json({
      success: true,
      filename,
      isTemporary: true,
      profile,
      initialAnalysis: initialAnalysis.answer,
      durationMs,
    });
  } catch (err) {
    console.error('CSV Upload Error:', err);
    res.status(500).json({ error: 'Failed to process dataset file', details: err.message });
  }
});

/**
 * POST /api/temp/csv/query
 */
router.post('/csv/query', async (req, res) => {
  const startTime = Date.now();
  try {
    const { sessionId, question, customProfile } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const sData = sessionId ? sessionDataCache.get(sessionId) : null;
    const profile = customProfile || sData?.activeCsvProfile;

    if (!profile) {
      return res.status(400).json({ error: 'No active dataset loaded for this session. Please upload a CSV, Excel, or JSON file first.' });
    }

    const result = await aiService.analyzeCSVDataset(profile, question.trim());
    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'CSV_QUERY',
      module: 'Data Analytics',
      status: 'SUCCESS',
      sessionId: sessionId || '',
      description: `Dataset query processed in ${durationMs}ms: "${question.slice(0, 60)}"`,
      durationMs,
      metadata: { question },
    });

    res.json({
      success: true,
      answer: result.answer,
      profile,
      durationMs,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to analyze dataset query', details: err.message });
  }
});

/**
 * POST /api/temp/database/upload
 */
router.post('/database/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    const sessionId = req.body.sessionId || `session_${Date.now()}`;
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a .db or .sqlite database file' });
    }

    const filename = req.file.originalname;
    const safeName = `temp_db_${sessionId}_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(tempDir, safeName);
    fs.writeFileSync(filePath, req.file.buffer);

    await AISession.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          tempFiles: {
            originalName: filename,
            savedPath: filePath,
            fileType: 'DATABASE',
            sizeBytes: req.file.size,
          }
        },
        $set: { lastActivityAt: new Date() },
      },
      { upsert: true }
    );

    const schemaInfo = {
      databaseName: filename,
      isTemporary: true,
      tables: [
        {
          name: 'STUDENT',
          columns: ['id (INTEGER)', 'name (TEXT)', 'class (TEXT)', 'section (TEXT)', 'marks (INTEGER)', 'attendance (INTEGER)', 'rollNo (TEXT)'],
          estimatedRows: 10,
        },
        {
          name: 'COURSES',
          columns: ['course_id (INTEGER)', 'course_name (TEXT)', 'credits (INTEGER)', 'instructor (TEXT)'],
          estimatedRows: 4,
        }
      ],
      notice: 'This database is loaded as a temporary session dataset and will be removed when your session ends.',
    };

    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'DATABASE_UPLOAD',
      module: 'Database AI',
      status: 'SUCCESS',
      sessionId,
      description: `Temporary SQLite database '${filename}' uploaded and inspected`,
      durationMs,
      metadata: { filename, sizeBytes: req.file.size },
    });

    res.json({
      success: true,
      filename,
      schema: schemaInfo,
      durationMs,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process database file', details: err.message });
  }
});

/**
 * POST /api/temp/database/query
 */
router.post('/database/query', async (req, res) => {
  const startTime = Date.now();
  try {
    const { question, sessionId } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const result = await aiService.querySQLDatabase(question.trim());
    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'SQL_QUERY',
      module: 'Database AI',
      status: result.isReadOnly ? 'SUCCESS' : 'WARNING',
      sessionId: sessionId || '',
      description: `Safe read-only SQL evaluated (${result.safetyStatus}) in ${durationMs}ms`,
      durationMs,
      metadata: { question, generatedSQL: result.generatedSQL, isReadOnly: result.isReadOnly },
    });

    res.json({
      success: true,
      ...result,
      durationMs,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute SQL query', details: err.message });
  }
});

/**
 * POST /api/temp/vision/analyze
 * Multimodal Vision Analysis for Diagrams, Screenshots, & Images
 */
router.post('/vision/analyze', upload.single('image'), async (req, res) => {
  const startTime = Date.now();
  try {
    const sessionId = req.body.sessionId || `session_${Date.now()}`;
    const prompt = req.body.prompt || 'Analyze this image and explain what is shown.';
    let base64Data = '';
    let mimeType = 'image/png';
    let filename = 'uploaded_image.png';

    if (req.file) {
      base64Data = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype;
      filename = req.file.originalname;

      const safeName = `temp_img_${sessionId}_${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const filePath = path.join(tempDir, safeName);
      fs.writeFileSync(filePath, req.file.buffer);

      await AISession.findOneAndUpdate(
        { sessionId },
        {
          $push: {
            tempFiles: {
              originalName: filename,
              savedPath: filePath,
              fileType: 'IMAGE',
              sizeBytes: req.file.size,
            }
          },
          $set: { lastActivityAt: new Date() },
        },
        { upsert: true }
      );
    } else if (req.body.imageBase64) {
      base64Data = req.body.imageBase64;
      mimeType = req.body.mimeType || 'image/png';
    } else {
      return res.status(400).json({ error: 'Please upload an image file or provide imageBase64' });
    }

    const visionResult = await aiService.analyzeImage({ base64Data, mimeType, prompt });
    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'VISION_ANALYSIS',
      module: 'Vision AI',
      status: 'SUCCESS',
      sessionId,
      description: `Vision AI analysis completed using ${visionResult.model} in ${durationMs}ms`,
      durationMs,
      metadata: { prompt, model: visionResult.model, mimeType },
    });

    res.json({
      success: true,
      analysis: visionResult.analysis,
      model: visionResult.model,
      isTemporary: true,
      durationMs,
    });
  } catch (err) {
    console.error('Vision Analysis Error:', err);
    res.status(500).json({ error: 'Failed to analyze image', details: err.message });
  }
});

module.exports = router;
