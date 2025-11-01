// backend/controllers/telemetryController.js
const DroneTelemetry = require('../models/DroneTelemetry');

const receiveTelemetry = async (req, res) => {
  try {
    const { droneId, matchId, roundNumber, espMacAddress } = req.body;
    
    // Save telemetry
    const telemetry = new DroneTelemetry({
      ...req.body,
      timestamp: new Date(),
      source: espMacAddress ? 'physical' : 'mock'  // ✅ Track source
    });

    await telemetry.save();

    // Log for debugging
    console.log(`📡 Telemetry received: ${droneId} [${telemetry.source}]`);

    // ✅ Emit Socket.io event for real-time telemetry
    if (global.io && matchId) {
      global.io.to(`match-${matchId}`).emit('telemetry', {
        droneId,
        matchId,
        roundNumber,
        x: req.body.x,
        y: req.body.y,
        z: req.body.z,
        pitch: req.body.pitch,
        roll: req.body.roll,
        yaw: req.body.yaw,
        battery: req.body.battery,
        timestamp: telemetry.timestamp
      });
    }

    res.status(200).json({
      success: true,
      message: 'Telemetry received',
      droneId,
      source: telemetry.source
    });
  } catch (error) {
    console.error('❌ Telemetry error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  receiveTelemetry
};