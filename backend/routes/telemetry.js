const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const DroneTelemetry = require('../models/DroneTelemetry');

// POST - Receive telemetry data from drone
router.post('/', async (req, res) => {
  try {
    console.log('📡 Telemetry request received');
    
    const { matchId, teamId, droneId, x, y, z, pitch, roll, yaw, battery } = req.body;

    // Validate required fields
    if (!matchId || !droneId) {
      console.log('❌ Missing matchId or droneId');
      return res.status(400).json({ 
        success: false, 
        message: 'matchId and droneId are required' 
      });
    }

    // Check if match exists and round is active
    const match = await Match.findById(matchId);
    
    if (!match) {
      console.log('❌ Match not found:', matchId);
      return res.status(404).json({ 
        success: false, 
        message: 'Match not found' 
      });
    }

    // Check if current round is in progress
    const currentRound = match.rounds.find(
      r => r.roundNumber === match.currentRound && r.status === 'in_progress'
    );

    if (!currentRound) {
      console.log('❌ No active round for match:', matchId);
      return res.status(404).json({ 
        success: false, 
        message: 'No active round found' 
      });
    }

    console.log('✅ Match found, round active:', match.currentRound);

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

      console.log('✅ Match found, round active:', match.currentRound);

      // ADD THIS DEBUG:
      console.log('🔍 Searching telemetry for:', {
        matchId: matchId,
        droneId: droneId,
        roundNumber: match.currentRound
      });

      // Find existing telemetry document or create new one
      let telemetry = await DroneTelemetry.findOne({
        matchId,
        droneId,
        roundNumber: match.currentRound
      });

      // ADD THIS DEBUG:
      if (telemetry) {
        console.log('📦 Found existing telemetry - Round:', telemetry.roundNumber, 'Logs:', telemetry.logs.length);
      } else {
        console.log('🆕 No existing telemetry found - will create new');
      }

      console.log('📊 Found telemetry:', telemetry ? 'YES' : 'NO');



    // Find existing telemetry document or create new one
    // let telemetry = await DroneTelemetry.findOne({
    //   matchId,
    //   droneId,
    //   roundNumber: match.currentRound
    // });

    if (telemetry) {
      telemetry.logs.push(telemetryData);
      const saved = await telemetry.save();
      console.log('💾 Data appended - Document ID:', saved._id);
    } else {
      telemetry = new DroneTelemetry({
        matchId,
        teamId,
        droneId,
        roundNumber: match.currentRound,
        logs: [telemetryData]
      });
      const saved = await telemetry.save();
      console.log('💾 New document created - ID:', saved._id);
      console.log('💾 Match:', saved.matchId, 'Round:', saved.roundNumber, 'Drone:', saved.droneId);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Telemetry data saved',
      dataPoints: telemetry.logs.length
    });

  } catch (error) {
    console.error('❌ Error in telemetry endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;