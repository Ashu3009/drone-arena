// backend/models/DroneLog.js
const mongoose = require('mongoose');

const DroneLogSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  team: {
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
  logs: {
    type: [{
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
      },
      points: {
        type: Number,
        default: 0
      }
    }],
    default: []  // ← IMPORTANT: Default empty array
  }
}, {
  timestamps: true
});

// Index for faster queries
DroneLogSchema.index({ match: 1, roundNumber: 1, droneId: 1 });

module.exports = mongoose.model('DroneLog', DroneLogSchema);