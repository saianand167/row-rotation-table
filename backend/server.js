const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socket = require('./socket');
const pushNotification = require('./pushNotification');

// Existing RRT routes
const rotationRoutes = require('./routes/rotation');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

// New To-Do & Progress Management routes
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const criticalAdminRoutes = require('./routes/criticalAdmin');

// AI Super App Routes
const aiRoutes = require('./routes/ai');
const documentRoutes = require('./routes/documents');
const tempFileRoutes = require('./routes/temporaryFiles');
const logRoutes = require('./routes/logs');

// Ensure upload directories exist
const fs = require('fs');
const path = require('path');
const docDir = path.resolve(__dirname, 'uploads/documents');
const tempDir = path.resolve(__dirname, 'uploads/temp');
if (!fs.existsSync(docDir)) fs.mkdirSync(docDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

// Models for initialization
const CriticalAdmin = require('./models/CriticalAdmin');
const Visitor = require('./models/Visitor');
const AISession = require('./models/AISession');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rrt';

// Initialize Socket.io
socket.init(server);

// CORS — allow Vercel, Render, local dev, WebView, and configured frontend domains
const frontendUrl = process.env.FRONTEND_URL || '*';
const allowedOrigins = frontendUrl && frontendUrl !== '*'
  ? frontendUrl.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    
    if (
      frontendUrl === '*' ||
      allowedOrigins.includes(origin) ||
      origin.includes('vercel.app') ||
      origin.includes('onrender.com') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    
    // In production, also permit any browser client
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['*']
}));
app.options('*', cors());
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));
app.use(cookieParser());

// IP Visitor Tracking Middleware
app.use(async (req, res, next) => {
  try {
    const rawIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const ip = rawIp.replace('::ffff:', '');
    const ua = req.headers['user-agent'] || '';

    // Record visitor IP asynchronously
    if (ip && !req.path.startsWith('/api/critical-admin')) {
      Visitor.findOneAndUpdate(
        { ipAddress: ip },
        {
          $inc: { visitCount: 1 },
          $set: { lastVisitAt: new Date(), userAgent: ua },
        },
        { upsert: true, new: true }
      ).catch(() => {});
    }
  } catch (err) {}
  next();
});

// ─── Existing RRT Routes (unchanged) ────────────────────
app.use('/api/rotation', rotationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── New To-Do System Routes ─────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/critical-admin', criticalAdminRoutes);

// ─── Generative AI Super App Routes ──────────────────────
app.use('/api/ai', aiRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/temp', tempFileRoutes);
app.use('/api/logs', logRoutes);

// Periodic cleaner for orphaned temporary session files older than 3 hours
setInterval(() => {
  try {
    if (fs.existsSync(tempDir)) {
      const now = Date.now();
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 3 * 60 * 60 * 1000) {
          fs.unlinkSync(filePath);
          console.log(`🧹 Cleaned expired temp file: ${file}`);
        }
      }
    }
  } catch (e) {}
}, 30 * 60 * 1000);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start HTTP Server immediately
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 RRT & Generative AI Super App Backend running on http://localhost:${PORT}`);
});

// Connect to MongoDB and initialize background services
async function initDatabase() {
  let connected = false;

  // 1. Try remote MongoDB URI if explicitly provided in environment
  if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('127.0.0.1') && !process.env.MONGO_URI.includes('localhost')) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('✅ Connected to MongoDB Atlas/Remote');
      connected = true;
    } catch (err) {
      console.warn('⚠️ Could not connect to remote MONGO_URI:', err.message);
    }
  }

  // 2. Try local MongoDB instance
  if (!connected) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to Local MongoDB');
      connected = true;
    } catch (err) {
      console.log('ℹ️ Local MongoDB server not detected, attempting embedded in-memory MongoDB...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log('✅ Connected to Embedded In-Memory MongoDB');
        connected = true;
      } catch (memErr) {
        console.warn('⚠️ Embedded MongoDB skipped:', memErr.message);
      }
    }
  }

  try {
    await pushNotification.initVapidKeys();
    await CriticalAdmin.getAdmin();
  } catch (e) {}
}

initDatabase();
