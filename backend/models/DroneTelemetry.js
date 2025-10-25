const mongoose = require('mongoose');

const telemetryLogSchema = new mongoose.Schema({
  timestamp: {
    type: Number,
    required: true
  },
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  z: {
    type: Number,
    default: 0
  },
  pitch: {
    type: Number,
    default: 0
  },
  roll: {
    type: Number,
    default: 0
  },
  yaw: {
    type: Number,
    default: 0
  },
  battery: {
    type: Number,
    default: 100
  }
});

const droneTelemetrySchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  droneId: {
    type: String,
    required: true
  },
  roundNumber: {
    type: Number,
    required: true
  },
  logs: [telemetryLogSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('DroneTelemetry', droneTelemetrySchema);