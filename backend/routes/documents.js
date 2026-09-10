const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const KnowledgeDocument = require('../models/KnowledgeDocument');
const SystemLog = require('../models/SystemLog');
const aiService = require('../services/aiService');

// Configure upload storage for permanent documents
const uploadDir = path.resolve(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB limit
});

const AdmZip = require('adm-zip');

/**
 * Universal text extractor for PDF, DOCX, PPTX, XLSX, CSV, JSON, TXT, MD
 */
async function extractTextFromAnyDocument(fileBuffer, filename, mimeType) {
  const ext = filename.split('.').pop()?.toLowerCase();
  let extractedText = '';
  let pageCount = 1;

  try {
    // 1. PDF Documents
    if (ext === 'pdf' || mimeType === 'application/pdf') {
      try {
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text || '';
        pageCount = pdfData.numpages || 1;
      } catch (pdfErr) {
        console.warn('PDF parse fallback:', pdfErr.message);
        extractedText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      }
    }
    // 2. Word Documents (.docx)
    else if (ext === 'docx') {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        extractedText = result.value || '';
        pageCount = Math.max(1, Math.ceil(extractedText.length / 1800));
      } catch (docErr) {
        try {
          const zip = new AdmZip(fileBuffer);
          const xml = zip.readAsText('word/document.xml');
          const matches = xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi);
          if (matches) {
            extractedText = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
          }
        } catch (zErr) {}
      }
    }
    // 3. Excel Spreadsheets (.xlsx, .xls)
    else if (ext === 'xlsx' || ext === 'xls') {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      const textParts = [];
      sheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          textParts.push(`--- Sheet: ${name} ---\n${csv}`);
        }
      });
      extractedText = textParts.join('\n\n');
      pageCount = sheetNames.length;
    }
    // 4. PowerPoint Presentations (.pptx)
    else if (ext === 'pptx') {
      try {
        const zip = new AdmZip(fileBuffer);
        const zipEntries = zip.getEntries();
        const slideTexts = [];
        zipEntries.forEach(entry => {
          if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
            const xml = zip.readAsText(entry);
            const matches = xml.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/gi);
            if (matches) {
              const slideContent = matches.map(m => m.replace(/<[^>]+>/g, '').trim()).filter(Boolean).join(' ');
              if (slideContent) {
                slideTexts.push(slideContent);
              }
            }
          }
        });
        if (slideTexts.length > 0) {
          extractedText = slideTexts.map((s, idx) => `[Slide ${idx + 1}]: ${s}`).join('\n\n');
          pageCount = slideTexts.length;
        } else {
          const printable = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
          extractedText = printable.replace(/\s+/g, ' ').trim();
          pageCount = Math.max(1, Math.ceil(extractedText.length / 1000));
        }
      } catch (pptxErr) {
        console.warn('PPTX zip extraction fallback:', pptxErr.message);
        const printable = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        extractedText = printable.replace(/\s+/g, ' ').trim();
        pageCount = 1;
      }
    }
    // 5. JSON / CSV / TXT / Markdown
    else {
      extractedText = fileBuffer.toString('utf-8');
      pageCount = Math.max(1, Math.ceil(extractedText.length / 2000));
    }
  } catch (err) {
    console.warn(`Extraction fallback for ${filename}:`, err.message);
    extractedText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    pageCount = 1;
  }

  // Safe string length capping (max 1.5MB text) to prevent MongoDB BSON RangeErrors
  if (extractedText.length > 1500000) {
    extractedText = extractedText.slice(0, 1500000);
  }

  return {
    extractedText: extractedText.trim() || `Document content for ${filename}`,
    pageCount: Math.max(1, pageCount),
  };
}

/**
 * Split text into overlapping chunks (max 200 chunks)
 */
function chunkDocumentText(fullText, chunkSize = 800, overlap = 150) {
  const chunks = [];
  let index = 0;
  let chunkIdx = 0;
  const maxChunks = 200;

  while (index < fullText.length && chunkIdx < maxChunks) {
    const end = Math.min(index + chunkSize, fullText.length);
    const chunkText = fullText.slice(index, end).trim();
    if (chunkText) {
      chunks.push({
        chunkIndex: chunkIdx++,
        text: chunkText,
        pageNumber: Math.floor(index / 2000) + 1,
        charCount: chunkText.length,
      });
    }
    index += chunkSize - overlap;
  }
  return chunks.length > 0 ? chunks : [{ chunkIndex: 0, text: fullText.slice(0, 800), pageNumber: 1, charCount: fullText.length }];
}

/**
 * POST /api/documents/upload
 * Permanent Document Upload with Multi-Format Support & SHA-256 Deduplication
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    let fileBuffer;
    let filename;
    let mimeType;
    let sizeBytes;
    let extractedText = '';
    let pageCount = 1;

    if (req.file) {
      fileBuffer = req.file.buffer;
      filename = req.file.originalname;
      mimeType = req.file.mimetype;
      sizeBytes = req.file.size;

      const parsed = await extractTextFromAnyDocument(fileBuffer, filename, mimeType);
      extractedText = parsed.extractedText;
      pageCount = parsed.pageCount;
    } else if (req.body.filename && req.body.content) {
      filename = req.body.filename;
      extractedText = req.body.content;
      fileBuffer = Buffer.from(extractedText, 'utf-8');
      mimeType = 'text/plain';
      sizeBytes = fileBuffer.length;
      pageCount = Math.max(1, Math.ceil(extractedText.length / 2000));
    } else {
      return res.status(400).json({ error: 'Please provide a valid document file or text content' });
    }

    // 1. Calculate SHA-256 Hash of File Content
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 2. Duplicate Check in Knowledge Base
    const existingDoc = await KnowledgeDocument.findOne({ fileHash: hash });
    if (existingDoc) {
      await SystemLog.record({
        action: 'DOCUMENT_DUPLICATE',
        module: 'Documents',
        status: 'INFO',
        description: `Duplicate upload blocked for '${filename}' (matches '${existingDoc.filename}')`,
        metadata: { filename, existingId: existingDoc._id, hash },
      });

      return res.status(200).json({
        isDuplicate: true,
        message: 'This document already exists in your Knowledge Base.',
        existingDoc: {
          id: existingDoc._id,
          filename: existingDoc.filename,
          sizeBytes: existingDoc.sizeBytes,
          uploadedAt: existingDoc.createdAt,
          pageCount: existingDoc.pageCount,
          totalChunks: existingDoc.totalChunks,
        },
      });
    }

    // 3. Save File to Permanent Storage on Disk
    const safeSavedName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = path.join(uploadDir, safeSavedName);
    fs.writeFileSync(storagePath, fileBuffer);

    // 4. Create Chunks for Vector & Keyword RAG
    const chunks = chunkDocumentText(extractedText);

    // 5. Store in KnowledgeDocument MongoDB collection
    const category = req.body.category || 'General';
    const tags = req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim()).filter(Boolean)) : [];
    
    const newDoc = await KnowledgeDocument.create({
      filename,
      fileHash: hash,
      mimeType,
      sizeBytes,
      pageCount,
      chunks,
      totalChunks: chunks.length,
      extractedTextPreview: extractedText.slice(0, 1000),
      storagePath,
      uploadedBy: req.body.uploadedBy || 'CSE-5 Student',
      category,
      tags,
      isNote: req.body.isNote === true || req.body.isNote === 'true',
      status: 'READY',
    });

    // Mirror to in-memory fallback store
    aiService.inMemoryDocStore.push({
      id: newDoc._id.toString(),
      filename: newDoc.filename,
      content: extractedText,
      uploadedAt: newDoc.createdAt.toISOString(),
      category: newDoc.category,
      tags: newDoc.tags,
      isNote: newDoc.isNote,
      chunks,
    });

    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'DOCUMENT_UPLOAD',
      module: 'Documents',
      status: 'SUCCESS',
      description: `Permanent document '${filename}' indexed successfully (${chunks.length} chunks, ${pageCount} pages, category: ${category})`,
      durationMs,
      metadata: { docId: newDoc._id, filename, sizeBytes, totalChunks: chunks.length, category },
    });

    res.status(201).json({
      success: true,
      isDuplicate: false,
      message: `Document '${filename}' indexed permanently into Knowledge Base!`,
      document: {
        id: newDoc._id,
        filename: newDoc.filename,
        sizeBytes: newDoc.sizeBytes,
        pageCount: newDoc.pageCount,
        totalChunks: newDoc.totalChunks,
        category: newDoc.category,
        tags: newDoc.tags,
        isNote: newDoc.isNote,
        uploadedAt: newDoc.createdAt,
      },
    });
  } catch (err) {
    console.error('Document Upload Error:', err);
    res.status(500).json({ error: 'Failed to process and index document.', details: err.message });
  }
});

/**
 * POST /api/documents/note
 * Create / Save Direct Student Study Note into Knowledge Base
 */
router.post('/note', async (req, res) => {
  const startTime = Date.now();
  try {
    const { title, content, category = 'General', tags = [], author = 'CSE-5 Student' } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Note title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const filename = title.trim().endsWith('.note.md') ? title.trim() : `${title.trim()}.note.md`;
    const noteText = content.trim();
    const fileBuffer = Buffer.from(noteText, 'utf-8');
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Duplicate check
    const existing = await KnowledgeDocument.findOne({ fileHash: hash });
    if (existing) {
      return res.status(200).json({
        isDuplicate: true,
        message: `An identical note or document titled '${existing.filename}' already exists.`,
        existingDoc: {
          id: existing._id,
          filename: existing.filename,
          category: existing.category,
          uploadedAt: existing.createdAt,
        },
      });
    }

    // Save to disk
    const safeSavedName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = path.join(uploadDir, safeSavedName);
    fs.writeFileSync(storagePath, fileBuffer);

    // Create chunks
    const chunks = chunkDocumentText(noteText);
    const parsedTags = Array.isArray(tags) ? tags : String(tags).split(',').map(t => t.trim()).filter(Boolean);

    const newDoc = await KnowledgeDocument.create({
      filename,
      fileHash: hash,
      mimeType: 'text/markdown',
      sizeBytes: fileBuffer.length,
      pageCount: Math.max(1, Math.ceil(noteText.length / 1500)),
      chunks,
      totalChunks: chunks.length,
      extractedTextPreview: noteText.slice(0, 1000),
      storagePath,
      uploadedBy: author || 'CSE-5 Student',
      category: category.trim(),
      tags: parsedTags,
      isNote: true,
      status: 'READY',
    });

    aiService.inMemoryDocStore.push({
      id: newDoc._id.toString(),
      filename: newDoc.filename,
      content: noteText,
      uploadedAt: newDoc.createdAt.toISOString(),
      category: newDoc.category,
      tags: newDoc.tags,
      isNote: true,
      chunks,
    });

    const durationMs = Date.now() - startTime;
    await SystemLog.record({
      action: 'NOTE_CREATED',
      module: 'Documents',
      status: 'SUCCESS',
      description: `Study note '${filename}' saved & indexed (${category})`,
      durationMs,
      metadata: { docId: newDoc._id, filename, category },
    });

    res.status(201).json({
      success: true,
      message: `Study Note '${filename}' saved and indexed successfully!`,
      document: {
        id: newDoc._id,
        filename: newDoc.filename,
        category: newDoc.category,
        tags: newDoc.tags,
        isNote: true,
        sizeBytes: newDoc.sizeBytes,
        pageCount: newDoc.pageCount,
        totalChunks: newDoc.totalChunks,
        uploadedAt: newDoc.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create and index note', details: err.message });
  }
});

/**
 * GET /api/documents/list
 */
router.get('/list', async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const filter = {};
    if (search) {
      filter.filename = { $regex: search, $options: 'i' };
    }
    if (category && category !== 'All' && category !== 'all') {
      filter.category = category;
    }

    const docs = await KnowledgeDocument.find(filter)
      .select('-chunks.text -storagePath')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: docs.length,
      docs: docs.map(d => ({
        id: d._id,
        filename: d.filename,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        pageCount: d.pageCount,
        totalChunks: d.totalChunks,
        uploadedBy: d.uploadedBy,
        category: d.category || 'General',
        tags: d.tags || [],
        isNote: !!d.isNote,
        uploadedAt: d.createdAt,
        status: d.status,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch knowledge documents' });
  }
});

/**
 * GET /api/documents/:id/content
 * Retrieve full text / note content for preview
 */
router.get('/:id/content', async (req, res) => {
  try {
    const doc = await KnowledgeDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let fullText = '';
    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
      try {
        const fileBuffer = fs.readFileSync(doc.storagePath);
        const parsed = await extractTextFromAnyDocument(fileBuffer, doc.filename, doc.mimeType);
        fullText = parsed.extractedText;
      } catch (e) {
        fullText = doc.extractedTextPreview || '';
      }
    } else {
      fullText = doc.chunks?.map(c => c.text).join('\n\n') || doc.extractedTextPreview || '';
    }

    res.json({
      success: true,
      id: doc._id,
      filename: doc.filename,
      category: doc.category || 'General',
      isNote: !!doc.isNote,
      content: fullText,
      uploadedAt: doc.createdAt,
      uploadedBy: doc.uploadedBy,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load document content' });
  }
});

/**
 * POST /api/documents/query
 * Contextual RAG Query across Knowledge Base with Citations
 */
router.post('/query', async (req, res) => {
  const startTime = Date.now();
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ragResult = await aiService.queryKnowledgeBase(question.trim());
    const durationMs = Date.now() - startTime;

    await SystemLog.record({
      action: 'DOCUMENT_QUERY',
      module: 'Documents',
      status: 'SUCCESS',
      description: `Knowledge RAG query processed in ${durationMs}ms`,
      durationMs,
      metadata: { question, citationCount: ragResult.citations?.length || 0 },
    });

    res.json({
      success: true,
      ...ragResult,
      durationMs,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query knowledge base', details: err.message });
  }
});

/**
 * DELETE /api/documents/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const doc = await KnowledgeDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
      try { fs.unlinkSync(doc.storagePath); } catch (e) {}
    }

    await KnowledgeDocument.findByIdAndDelete(req.params.id);

    const idx = aiService.inMemoryDocStore.findIndex(d => d.id === req.params.id);
    if (idx !== -1) aiService.inMemoryDocStore.splice(idx, 1);

    await SystemLog.record({
      action: 'DOCUMENT_DELETE',
      module: 'Documents',
      status: 'INFO',
      description: `Permanent document '${doc.filename}' deleted from Knowledge Base`,
      metadata: { docId: req.params.id, filename: doc.filename },
    });

    res.json({ success: true, message: `Document '${doc.filename}' deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
