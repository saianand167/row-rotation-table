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

// CORS — restrict to frontend domain in production
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin) or matching origins
    if (!origin || allowedOrigins.includes(origin)) {
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
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    await pushNotification.initVapidKeys();

    // Initialize Critical Admin account (from env var) on first boot
    await CriticalAdmin.getAdmin();

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 RRT Backend running with WebSockets on http://0.0.0.0:${PORT} (listening on all network interfaces)`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.log('\n💡 Make sure MongoDB is running:');
    console.log('   - Local: mongod --dbpath /data/db');
    console.log('   - Or set MONGO_URI env variable to your Atlas connection string');
    process.exit(1);
  }
}

start();
