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