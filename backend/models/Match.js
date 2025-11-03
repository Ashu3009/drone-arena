// backend/models/Match.js
const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  
  // Registered drones for this round
  registeredDrones: [{
    droneId: {
      type: String,
      required: true,
      enum: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8']
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    }
  }],
  
  teamAScore: {
    type: Number,
    default: 0
  },
  teamBScore: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  pausedAt: {
    type: Date
  },
  elapsedTime: {
    type: Number, // in seconds
    default: 0
  },
  timerStatus: {
    type: String,
    enum: ['not_started', 'running', 'paused', 'ended'],
    default: 'not_started'
  }
});

// Baaki sab same rahega
const matchSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  teamA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  teamB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  rounds: [roundSchema],
  currentRound: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  finalScoreA: {
    type: Number,
    default: 0
  },
  finalScoreB: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed'],
    default: 'scheduled'
  },
  scheduledTime: {
    type: Date,
    default: Date.now
  },
  isCurrentMatch: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);