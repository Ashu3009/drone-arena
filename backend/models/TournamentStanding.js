// backend/models/TournamentStanding.js
const mongoose = require('mongoose');

const tournamentStandingSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  draws: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  goalsFor: {
    type: Number,
    default: 0
  },
  goalsAgainst: {
    type: Number,
    default: 0
  },
  goalDifference: {
    type: Number,
    default: 0
  },
  position: {
    type: Number
  }
}, {
  timestamps: true
});

// Compound index to ensure one standing entry per team per tournament
tournamentStandingSchema.index({ tournament: 1, team: 1 }, { unique: true });

module.exports = mongoose.model('TournamentStanding', tournamentStandingSchema);