const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socket = require('./socket');
const pushNotification = require('./pushNotification');

const rotationRoutes = require('./routes/rotation');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');

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

// Routes
app.use('/api/rotation', rotationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

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

    server.listen(PORT, () => {
      console.log(`🚀 RRT Backend running with WebSockets on http://localhost:${PORT}`);
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
