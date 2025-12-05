// backend/routes/telemetry.js - TESTING VERSION (No round validation)
const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const DroneTelemetry = require('../models/DroneTelemetry');
const telemetryController = require('../controllers/telemetryController');

// POST - Receive telemetry from ESP32 (with MAC address auto-detection)
router.post('/receive', telemetryController.receiveTelemetry);

// POST - Heartbeat endpoint for ESP32
router.post('/heartbeat', (req, res) => {
  // Simple heartbeat response
  res.status(200).json({ success: true, message: 'Heartbeat received' });
});

// POST - Receive telemetry data from drone (legacy endpoint)
router.post('/', async (req, res) => {
  try {
    const { matchId, teamId, droneId, x, y, z, pitch, roll, yaw, battery } = req.body;

    // Validate required fields
    if (!matchId || !droneId) {
      return res.status(400).json({
        success: false,
        message: 'matchId and droneId are required'
      });
    }

    // Check if match exists
    const match = await Match.findById(matchId);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // ⚠️ REMOVED ROUND STATUS CHECK FOR TESTING
    // This allows telemetry even if round is not "in_progress"

    // Create telemetry log entry
    const telemetryData = {
      timestamp: Date.now(),
      x: x || 0,
      y: y || 0,
      z: z || 0,
      pitch: pitch || 0,
      roll: roll || 0,
      yaw: yaw || 0,
      battery: battery || 100
    };

    // Find existing telemetry document or create new one
    let telemetry = await DroneTelemetry.findOne({
      matchId,
      droneId,
      roundNumber: match.currentRound
    });

    if (telemetry) {
      telemetry.logs.push(telemetryData);
      await telemetry.save();
    } else {
      telemetry = new DroneTelemetry({
        matchId,
        teamId,
        droneId,
        roundNumber: match.currentRound,
        logs: [telemetryData]
      });
      await telemetry.save();
    }

    // ✅ CRITICAL: Emit to Socket.IO for real-time updates
    const io = req.app.get('io');
    if (io) {
      const realtimeData = {
        droneId,
        matchId,
        roundNumber: match.currentRound,
        position: { x, y, z },
        orientation: { pitch, roll, yaw },
        battery,
        timestamp: telemetryData.timestamp
      };

      io.to(`match_${matchId}`).emit('telemetry_update', realtimeData);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Telemetry data saved',
      dataPoints: telemetry.logs.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET - Fetch telemetry for a match (for 3D visualization)
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    console.log('📊 Fetching telemetry for match:', matchId);

    const telemetryData = await DroneTelemetry.find({ matchId })
      .sort({ roundNumber: -1, 'logs.timestamp': -1 })
      .limit(100);

    console.log('📦 Found telemetry documents:', telemetryData.length);

    res.json({
      success: true,
      count: telemetryData.length,
      data: telemetryData
    });

  } catch (error) {
    console.error('❌ Error fetching telemetry:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET - Fetch latest telemetry for active round (optimized for 3D view)
router.get('/match/:matchId/latest', async (req, res) => {
  try {
    const { matchId } = req.params;
    console.log('🔍 Fetching latest telemetry for match:', matchId);

    // Get current round from match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Get telemetry for current round only
    const telemetryData = await DroneTelemetry.find({ 
      matchId,
      roundNumber: match.currentRound 
    });

    // Format data for 3D view
    const formattedData = telemetryData.map(doc => {
      const latestLog = doc.logs[doc.logs.length - 1]; // Get last log
      return {
        droneId: doc.droneId,
        teamId: doc.teamId,
        roundNumber: doc.roundNumber,
        logs: [latestLog] // Only send latest position
      };
    });

    console.log('📦 Formatted data for', formattedData.length, 'drones');

    res.json({
      success: true,
      currentRound: match.currentRound,
      data: formattedData
    });

  } catch (error) {
    console.error('❌ Error fetching latest telemetry:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;