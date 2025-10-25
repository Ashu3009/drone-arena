// backend/models/StabilityReport.js
const mongoose = require('mongoose');

const droneAnalysisSchema = new mongoose.Schema({
  droneId: String,
  stabilityScore: Number,
  classification: String,
  issuesDetected: [String],
  varianceData: {
    x_variance: Number,
    y_variance: Number,
    z_variance: Number,
    pitch_variance: Number,
    roll_variance: Number,
    yaw_variance: Number
  },
  smoothnessScores: {
    x: Number,
    y: Number,
    z: Number,
    average: Number
  },
  spikeCounts: {
    x: Number,
    y: Number,
    z: Number
  },
  dataPoints: Number
});

const stabilityReportSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  roundNumber: {
    type: Number,
    required: true
  },
  teamA: {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    drones: [droneAnalysisSchema],
    avgStability: Number
  },
  teamB: {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    drones: [droneAnalysisSchema],
    avgStability: Number
  },
  analyzedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StabilityReport', stabilityReportSchema);