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

// Models for initialization
const CriticalAdmin = require('./models/CriticalAdmin');
const Visitor = require('./models/Visitor');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rrt';

// Initialize Socket.io
socket.init(server);

// CORS — allow frontend domains + local dev + Android WebView
const frontendUrl = process.env.FRONTEND_URL || '';
const allowedOrigins = frontendUrl && frontendUrl !== '*'
  ? frontendUrl.split(',').map(o => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      frontendUrl === '*' ||
      allowedOrigins.includes(origin) ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
async function start() {
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
      // 3. Fallback to embedded In-Memory MongoDB automatically
      console.log('ℹ️ Local MongoDB server not detected, starting embedded in-memory MongoDB...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log('✅ Connected to Embedded In-Memory MongoDB');
        connected = true;
      } catch (memErr) {
        console.error('❌ Failed to start embedded MongoDB:', memErr.message);
      }
    }
  }

  if (!connected) {
    console.error('❌ Failed to connect to any MongoDB database instance.');
    process.exit(1);
  }

  await pushNotification.initVapidKeys();

  // Initialize Critical Admin account (from env var) on first boot
  await CriticalAdmin.getAdmin();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 RRT Backend running with WebSockets on http://0.0.0.0:${PORT} (listening on all network interfaces)`);
  });
}

start();
