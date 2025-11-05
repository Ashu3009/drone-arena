// backend/controllers/telemetryController.js
const DroneTelemetry = require('../models/DroneTelemetry');

const receiveTelemetry = async (req, res) => {
  try {
    const { droneId, matchId, roundNumber, teamId, x, y, z, pitch, roll, yaw, battery } = req.body;

    // Find or create telemetry document for this match/drone/round
    let telemetry = await DroneTelemetry.findOne({
      matchId,
      droneId,
      roundNumber
    });

    // Create log entry
    const logEntry = {
      timestamp: Date.now(),
      x: x || 0,
      y: y || 0,
      z: z || 0,
      pitch: pitch || 0,
      roll: roll || 0,
      yaw: yaw || 0,
      battery: battery || 100
    };

    if (telemetry) {
      // Append to existing logs
      telemetry.logs.push(logEntry);
      await telemetry.save();
      console.log(`📡 Telemetry appended: ${droneId} [${telemetry.logs.length} logs]`);
    } else {
      // Create new telemetry document
      telemetry = await DroneTelemetry.create({
        matchId,
        teamId,
        droneId,
        roundNumber,
        logs: [logEntry]
      });
      console.log(`📡 Telemetry created: ${droneId} [new document]`);
    }

    // Emit Socket.io event for real-time 3D visualization
    if (global.io && matchId) {
      global.io.to(`match-${matchId}`).emit('telemetry', {
        droneId,
        matchId,
        roundNumber,
        x: x || 0,
        y: y || 0,
        z: z || 0,
        pitch: pitch || 0,
        roll: roll || 0,
        yaw: yaw || 0,
        battery: battery || 100,
        timestamp: logEntry.timestamp
      });
    }

    res.status(200).json({
      success: true,
      message: 'Telemetry received',
      droneId,
      logsCount: telemetry.logs.length
    });
  } catch (error) {
    console.error('❌ Telemetry error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  receiveTelemetry
};