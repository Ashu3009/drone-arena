// backend/controllers/telemetryController.js
const DroneTelemetry = require('../models/DroneTelemetry');

// Throttle socket emissions - only emit every 200ms per drone
const lastEmitTime = {};
const EMIT_INTERVAL = 2000; // ms

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
    } else {
      // Create new telemetry document
      telemetry = await DroneTelemetry.create({
        matchId,
        teamId,
        droneId,
        roundNumber,
        logs: [logEntry]
      });
    }

    // Emit Socket.io event for real-time 3D visualization (THROTTLED)
    if (global.io && matchId) {
      const now = Date.now();
      const key = `${droneId}-${matchId}`;

      // Only emit if enough time has passed since last emit for this drone
      if (!lastEmitTime[key] || (now - lastEmitTime[key]) >= EMIT_INTERVAL) {
        const telemetryData = {
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
        };
        global.io.to(`match-${matchId}`).emit('telemetry', telemetryData);
        lastEmitTime[key] = now;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Telemetry received',
      droneId,
      logsCount: telemetry.logs.length
    });
  } catch (error) {
    // Silent mode - no console logging
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  receiveTelemetry
};