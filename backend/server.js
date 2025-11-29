// backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Import MQTT service to initialize connection
require('./services/mqttService');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const teamRoutes = require('./routes/teamRoutes');
const matchRoutes = require('./routes/matchRoutes');
const telemetryRoutes = require('./routes/telemetry');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const droneLogRoutes = require('./routes/droneLogRoutes');
const droneReportRoutes = require('./routes/droneReportRoutes');
const droneRoutes = require('./routes/droneRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const siteStatsRoutes = require('./routes/siteStatsRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/drone-logs', droneLogRoutes);
app.use('/api/reports', droneReportRoutes);
app.use('/api/stats', siteStatsRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/schools', schoolRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: '🚀 Drone Arena API is running!' });
});

// Debug route for telemetry
app.get('/api/debug/all-telemetry', async (req, res) => {
  try {
    const DroneTelemetry = require('./models/DroneTelemetry');

    const all = await DroneTelemetry.find({});

    console.log('📊 Total telemetry documents:', all.length);

    res.json({
      success: true,
      count: all.length,
      data: all.map(doc => ({
        _id: doc._id,
        matchId: doc.matchId,
        droneId: doc.droneId,
        roundNumber: doc.roundNumber,
        logsCount: doc.logs ? doc.logs.length : 0
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// ==================== SOCKET.IO SETUP ====================

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  console.log('📊 Active connections:', io.engine.clientsCount);

  // Join match room
  socket.on('join-match', (matchId) => {
    socket.join(`match-${matchId}`);
    const roomSize = io.sockets.adapter.rooms.get(`match-${matchId}`)?.size || 0;
    console.log(`📍 Socket ${socket.id} joined match-${matchId} (${roomSize} clients in room)`);
  });

  // Leave match room
  socket.on('leave-match', (matchId) => {
    socket.leave(`match-${matchId}`);
    const roomSize = io.sockets.adapter.rooms.get(`match-${matchId}`)?.size || 0;
    console.log(`📍 Socket ${socket.id} left match-${matchId} (${roomSize} clients remaining)`);
  });

  // Disconnect handler
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (Reason: ${reason})`);
    console.log('📊 Active connections:', io.engine.clientsCount);
  });
});

// Make io available to routes via app
app.set('io', io);
global.io = io; // Make io globally available for controllers

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time updates`);
});
