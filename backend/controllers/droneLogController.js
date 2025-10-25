// backend/controllers/droneLogController.js

// NEW (✅):
const DroneTelemetry = require('../models/DroneTelemetry');


const Match = require('../models/Match');

// @desc    Receive telemetry from ESP32
// @route   POST /api/drone-logs
const receiveTelemetry = async (req, res) => {
  try {
    const { 
      matchId, 
      teamId, 
      droneId, 
      x, 
      y, 
      z, 
      pitch, 
      roll, 
      yaw,
      battery,
      timestamp
    } = req.body;
    
    // Validation
    if (!matchId || !teamId || !droneId) {
      return res.status(400).json({
        success: false,
        message: 'matchId, teamId, and droneId are required'
      });
    }
    
    // Get current match to determine round number
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // ✅ FIX 1: Check if rounds array exists
    if (!match.rounds || match.rounds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No rounds found. Please start a round first.'
      });
    }
    
    // ✅ FIX 2: Find active round properly
    const activeRound = match.rounds.find(r => r.status === 'in_progress');
    
    if (!activeRound) {
      return res.status(400).json({
        success: false,
        message: 'No active round. Please start a round first.'
      });
    }
    
    const roundNumber = activeRound.roundNumber;
    
    // Find or create drone log for this match/round/drone
    let droneLog = await DroneLog.findOne({
      match: matchId,
      team: teamId,
      roundNumber: roundNumber,
      droneId: droneId
    });
    
    if (!droneLog) {
      // Create new log document
      droneLog = new DroneLog({
        match: matchId,
        team: teamId,
        roundNumber: roundNumber,
        droneId: droneId,
        logs: []
      });
    }
    
    // ✅ FIX 3: Calculate points based on position
    let points = 0;
    
    // Points logic:
    // - In bounds (0-50m): +5 points
    // - Good height (1-5m): +2 points
    // - Stable orientation: +3 points
    
    const xVal = x || 0;
    const yVal = y || 0;
    const zVal = z || 0;
    const pitchVal = pitch || 0;
    const rollVal = roll || 0;
    
    if (xVal >= 0 && xVal <= 50 && yVal >= 0 && yVal <= 50) {
      points += 5; // In arena bounds
    }
    
    if (zVal >= 1 && zVal <= 5) {
      points += 2; // Good flying height
    }
    
    if (Math.abs(pitchVal) < 0.3 && Math.abs(rollVal) < 0.3) {
      points += 3; // Stable orientation
    }
    
    // Add new data point
    droneLog.logs.push({
      timestamp: timestamp || Date.now(),
      x: xVal,
      y: yVal,
      z: zVal,
      pitch: pitchVal,
      roll: rollVal,
      yaw: yaw || 0,
      battery: battery || 100,
      points: points
    });
    
    await droneLog.save();
    
    // ✅ FIX 4: Update round scores
    if (teamId.toString() === match.teamA._id.toString()) {
      activeRound.teamAScore += points;
      match.finalScoreA += points;
    } else if (teamId.toString() === match.teamB._id.toString()) {
      activeRound.teamBScore += points;
      match.finalScoreB += points;
    }
    
    await match.save();
    
    // Send minimal response (ESP32 has limited bandwidth)
    res.json({
      success: true,
      points: points,
      totalLogs: droneLog.logs.length
    });
    
  } catch (error) {
    console.error('Error in receiveTelemetry:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get drone logs for a match
// @route   GET /api/drone-logs/:matchId
const getMatchLogs = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { roundNumber, teamId, droneId } = req.query;
    
    // FIX (✅):
    const filter = { matchId: matchId };  // Correct field name!
    
    if (roundNumber) filter.roundNumber = parseInt(roundNumber);
    if (teamId) filter.teamId = teamId;
    if (droneId) filter.droneId = droneId;
    
    // FIX (✅):
    const logs = await DroneTelemetry.find(filter)
      .populate('teamId', 'name color')  // Correct field!
      .sort({ roundNumber: 1, droneId: 1 });
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
    
  } catch (error) {
    console.error('Error in getMatchLogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Clear logs (for testing)
// @route   DELETE /api/drone-logs/:matchId
const clearMatchLogs = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const result = await DroneTelemetry.deleteMany({ match: matchId });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} log documents`
    });
    
  } catch (error) {
    console.error('Error in clearMatchLogs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  receiveTelemetry,
  getMatchLogs,
  clearMatchLogs
};