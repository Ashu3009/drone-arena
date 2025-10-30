// backend/models/Match.js
const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  roundNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  
  // ✅ YE NAYA ADD KARO - Registered drones for this round
  registeredDrones: [{
    droneNumber: { 
      type: Number, 
      required: true,
      min: 1,
      max: 16
    }, // Physical drone (1-16)
    
    droneId: { 
      type: String, 
      required: true,
      enum: ['R1', 'R2', 'R3', 'R4', 'B1', 'B2', 'B3', 'B4']
    }, // In-match ID
    
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema);