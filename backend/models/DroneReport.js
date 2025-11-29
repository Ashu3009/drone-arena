// backend/models/DroneReport.js
const mongoose = require('mongoose');

const droneReportSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
    index: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  roundNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  droneId: {
    type: String,
    required: true,
    enum: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  pilotId: {
    type: String,
    required: true,
    trim: true
  },
  pilotName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['Forward', 'Striker', 'Defender', 'Central'],
    trim: true
  },

  // Performance Metrics
  flightPath: [{
    x: Number,
    y: Number,
    z: Number,
    timestamp: Date
  }],

  totalDistance: {
    type: Number, // in meters
    default: 0
  },

  averageSpeed: {
    type: Number, // in m/s
    default: 0
  },

  maxSpeed: {
    type: Number,
    default: 0
  },

  positionAccuracy: {
    type: Number, // percentage (0-100)
    default: 0
  },

  batteryUsage: {
    start: { type: Number, default: 100 },
    end: { type: Number, default: 100 },
    consumed: { type: Number, default: 0 }
  },

  // ML Analysis
  mlAnalysis: {
    aggressiveness: { type: Number, default: 0 }, // 0-100
    defensiveness: { type: Number, default: 0 },
    teamwork: { type: Number, default: 0 },
    efficiency: { type: Number, default: 0 },
    summary: { type: String },
    recommendations: [String]
  },

  performanceScore: {
    type: Number, // 0-100
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },

  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for fast queries
droneReportSchema.index({ match: 1, roundNumber: 1 });
droneReportSchema.index({ tournament: 1 });

module.exports = mongoose.model('DroneReport', droneReportSchema);
