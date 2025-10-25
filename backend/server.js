// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
// Import telemetry route
const telemetryRoutes = require('./routes/telemetry');




// backend/server.js (add this line with other route imports)
const leaderboardRoutes = require('./routes/leaderboardRoutes');

const droneLogRoutes = require('./routes/droneLogRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/drone-logs', droneLogRoutes);
// Use telemetry route

// Import Routes
const tournamentRoutes = require('./routes/tournamentRoutes');
const teamRoutes = require('./routes/teamRoutes');
const matchRoutes = require('./routes/matchRoutes');

// Mount Routes
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/matches', matchRoutes);
// Mount route (add with other routes)
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/telemetry', telemetryRoutes);


// Basic test route
app.get('/', (req, res) => {
  res.json({ message: '🚀 Drone Arena API is running!' });
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// ✅ ADD THIS DEBUG ROUTE:
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

// Start server
// const PORT = process.env.PORT || 5000;
