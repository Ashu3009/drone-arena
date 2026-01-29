// backend/models/PlayerPoints.js
// NEW MODEL - Match-wise Category Points for Players
const mongoose = require('mongoose');

const playerPointsSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
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
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  // Category-wise points for this match
  categoryPoints: {
    strikerPoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    forwardPoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    defenderPoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    goalkeeperPoints: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // Auto-calculated total for this match
  totalPoints: {
    type: Number,
    default: 0
  },
  // Admin who entered/modified these points
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Index for fast queries
playerPointsSchema.index({ tournament: 1, playerName: 1 });
playerPointsSchema.index({ match: 1 });

// Pre-save middleware to calculate total points
playerPointsSchema.pre('save', function(next) {
  this.totalPoints =
    this.categoryPoints.strikerPoints +
    this.categoryPoints.forwardPoints +
    this.categoryPoints.defenderPoints +
    this.categoryPoints.goalkeeperPoints;
  next();
});

// Static method to calculate tournament awards
playerPointsSchema.statics.calculateTournamentAwards = async function(tournamentId) {
  const pipeline = [
    {
      $match: { tournament: new mongoose.Types.ObjectId(tournamentId) }
    },
    {
      $group: {
        _id: '$playerName',
        team: { $first: '$team' },
        totalMatches: { $sum: 1 },
        totalPoints: { $sum: '$totalPoints' },
        strikerAvg: { $avg: '$categoryPoints.strikerPoints' },
        forwardAvg: { $avg: '$categoryPoints.forwardPoints' },
        defenderAvg: { $avg: '$categoryPoints.defenderPoints' },
        goalkeeperAvg: { $avg: '$categoryPoints.goalkeeperPoints' }
      }
    },
    {
      $sort: { totalPoints: -1 }
    }
  ];

  const results = await this.aggregate(pipeline);

  if (results.length === 0) {
    return null;
  }

  // Find best in each category
  const bestStriker = results.reduce((prev, current) =>
    (current.strikerAvg > prev.strikerAvg) ? current : prev
  );

  const bestForward = results.reduce((prev, current) =>
    (current.forwardAvg > prev.forwardAvg) ? current : prev
  );

  const bestDefender = results.reduce((prev, current) =>
    (current.defenderAvg > prev.defenderAvg) ? current : prev
  );

  const bestGoalkeeper = results.reduce((prev, current) =>
    (current.goalkeeperAvg > prev.goalkeeperAvg) ? current : prev
  );

  return {
    manOfTournament: {
      playerName: results[0]._id,
      team: results[0].team,
      totalPoints: results[0].totalPoints,
      matchesPlayed: results[0].totalMatches
    },
    bestStriker: {
      playerName: bestStriker._id,
      team: bestStriker.team,
      avgPoints: Math.round(bestStriker.strikerAvg * 100) / 100,
      matchesPlayed: bestStriker.totalMatches
    },
    bestForward: {
      playerName: bestForward._id,
      team: bestForward.team,
      avgPoints: Math.round(bestForward.forwardAvg * 100) / 100,
      matchesPlayed: bestForward.totalMatches
    },
    bestDefender: {
      playerName: bestDefender._id,
      team: bestDefender.team,
      avgPoints: Math.round(bestDefender.defenderAvg * 100) / 100,
      matchesPlayed: bestDefender.totalMatches
    },
    bestGoalkeeper: {
      playerName: bestGoalkeeper._id,
      team: bestGoalkeeper.team,
      avgPoints: Math.round(bestGoalkeeper.goalkeeperAvg * 100) / 100,
      matchesPlayed: bestGoalkeeper.totalMatches
    },
    allPlayers: results
  };
};

module.exports = mongoose.model('PlayerPoints', playerPointsSchema);
