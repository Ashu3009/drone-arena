// backend/controllers/telemetryController.js
const DroneTelemetry = require('../models/DroneTelemetry');
const ESPDevice = require('../models/ESPDevice');
const Match = require('../models/Match');

// Throttle socket emissions - only emit every 200ms per drone
const lastEmitTime = {};
const EMIT_INTERVAL = 2000; // ms

const receiveTelemetry = async (req, res) => {
  try {
    let { droneId, matchId, roundNumber, teamId, x, y, z, pitch, roll, yaw, battery } = req.body;
    const { macAddress, sensorData } = req.body;

    // ========================================
    // SMART MODE: MAC Address Auto-Detection
    // ========================================
    if (macAddress) {
      // Look up ESP by MAC address
      const espDevice = await ESPDevice.findOne({ macAddress: macAddress.toUpperCase() });

      if (!espDevice) {
        return res.status(400).json({
          success: false,
          error: 'ESP not registered. Please register via admin panel.'
        });
      }

      droneId = espDevice.droneId;

      // Extract sensor data from nested object
      if (sensorData) {
        x = sensorData.x;
        y = sensorData.y;
        z = sensorData.z;
        pitch = sensorData.pitch;
        roll = sensorData.roll;
        yaw = sensorData.yaw;
        battery = sensorData.battery || 100;
      }

      // Auto-detect current match (either isCurrentMatch=true or latest in_progress match)
      let currentMatch = await Match.findOne({ isCurrentMatch: true })
        .populate('teamA teamB');

      if (!currentMatch) {
        currentMatch = await Match.findOne({ status: 'in_progress' })
          .sort({ createdAt: -1 })
          .populate('teamA teamB');
      }

      if (!currentMatch) {
        // No active match - silently ignore telemetry
        console.log('⚠️  TELEMETRY IGNORED:', droneId, '- No current match set');
        return res.status(200).json({
          success: true,
          message: 'No active match - telemetry ignored',
          droneId
        });
      }

      matchId = currentMatch._id;
      console.log('✅ Current Match Found:', matchId, '-', currentMatch.teamA.name, 'vs', currentMatch.teamB.name);

      // Find active round
      const activeRound = currentMatch.rounds.find(r => r.status === 'in_progress');

      if (!activeRound) {
        // No active round - silently ignore telemetry
        console.log('⚠️  TELEMETRY IGNORED:', droneId, '- No active round (all rounds:', currentMatch.rounds.map(r => `Round ${r.roundNumber}: ${r.status}`).join(', ') + ')');
        return res.status(200).json({
          success: true,
          message: 'No active round - telemetry ignored',
          droneId,
          matchId
        });
      }

      roundNumber = activeRound.roundNumber;
      console.log('✅ Active Round Found: Round', roundNumber, '- Status:', activeRound.status);

      // Check if this drone is registered for this round
      // registeredDrones can be array of strings OR array of objects with droneId field
      const isDroneInRound = activeRound.registeredDrones.some(d =>
        typeof d === 'string' ? d === droneId : d.droneId === droneId
      );

      if (!isDroneInRound) {
        // Drone not in this round - silently ignore
        console.log('⚠️  TELEMETRY IGNORED:', droneId, '- Not registered in Round', roundNumber);
        console.log('   Registered drones:', activeRound.registeredDrones);
        return res.status(200).json({
          success: true,
          message: 'Drone not registered for this round - telemetry ignored',
          droneId,
          matchId,
          roundNumber
        });
      }

      console.log('✅ Drone', droneId, 'registered in Round', roundNumber, '- Saving telemetry...');

      // Determine teamId from droneId
      if (droneId.startsWith('R')) {
        teamId = currentMatch.teamA._id;
      } else if (droneId.startsWith('B')) {
        teamId = currentMatch.teamB._id;
      }
    }

    // ========================================
    // Validation: Ensure required fields exist
    // ========================================
    if (!droneId || !matchId || !roundNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: droneId, matchId, roundNumber'
      });
    }

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

    console.log('💾 TELEMETRY SAVED:', droneId, '- Match:', matchId, '- Round:', roundNumber, '- Total logs:', telemetry.logs.length);

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