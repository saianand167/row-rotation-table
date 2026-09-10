const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');

/**
 * POST /api/ai/chat
 * Central AI Assistant conversation with real-time tool orchestration
 */
router.post('/chat', async (req, res) => {
  try {
    const { prompt, messages = [] } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await aiService.routeAndOrchestrate(prompt, messages);
    res.json(result);
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ error: 'Failed to process AI chat request', details: err.message });
  }
});

/**
 * POST /api/ai/rag/upload
 * Add document text into in-memory RAG store
 */
router.post('/rag/upload', async (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content are required' });
    }

    aiService.inMemoryDocStore.push({
      id: Date.now().toString(),
      filename,
      content,
      uploadedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Document '${filename}' indexed into Knowledge Base!`,
      totalDocs: aiService.inMemoryDocStore.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

/**
 * GET /api/ai/rag/docs
 */
router.get('/rag/docs', (req, res) => {
  res.json({
    docs: aiService.inMemoryDocStore.map(d => ({
      id: d.id,
      filename: d.filename,
      size: d.content.length,
      uploadedAt: d.uploadedAt,
    })),
  });
});

/**
 * POST /api/ai/video/summarize
 */
router.post('/video/summarize', async (req, res) => {
  try {
    const { url, question } = req.body;
    if (!url) return res.status(400).json({ error: 'Video URL is required' });

    const result = await aiService.getYouTubeSummary(url, question);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to summarize video' });
  }
});

/**
 * POST /api/ai/sql/query
 */
router.post('/sql/query', async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const result = await aiService.querySQLDatabase(question);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to query database' });
  }
});

module.exports = router;
