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
      required: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    role: {
      type: String,
      enum: ['Forward', 'Center', 'Defender', 'Keeper'],
      required: true
    },
    pilot: {
      type: String,
      required: true,
      trim: true
    },
    specifications: {
      speed: Number,
      agility: Number,
      stability: Number,
      batteryCapacity: Number,
      weight: Number
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