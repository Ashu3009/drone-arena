// backend/models/PlayerPoints.js
// NEW MODEL - Round-wise Category Points for Players
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
  // Round number (1, 2, or 3) - for per-round tracking
  round: {
    type: Number,
    required: true,
    min: 1,
    max: 3
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
  // Player's role in this round (for auto-generating role-based points)
  playerRole: {
    type: String,
    enum: ['Striker', 'Forward', 'Defender', 'Keeper'],
    required: true
  },
  // Goals scored by player in this round (for Striker/Forward awards)
  goalsScored: {
    type: Number,
    default: 0,
    min: 0
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
playerPointsSchema.index({ match: 1, round: 1 });
playerPointsSchema.index({ match: 1, playerName: 1, round: 1 }, { unique: true });

// Pre-save middleware to calculate total points
playerPointsSchema.pre('save', function(next) {
  this.totalPoints =
    this.categoryPoints.strikerPoints +
    this.categoryPoints.forwardPoints +
    this.categoryPoints.defenderPoints +
    this.categoryPoints.goalkeeperPoints;
  next();
});

// Static method to auto-generate role-based points
playerPointsSchema.statics.generateRoleBasedPoints = function(playerRole, goalsScored = 0) {
  // Base points based on role (primary role gets higher points)
  const rolePoints = {
    Striker: { strikerPoints: 0, forwardPoints: 0, defenderPoints: 0, goalkeeperPoints: 0 },
    Forward: { strikerPoints: 0, forwardPoints: 0, defenderPoints: 0, goalkeeperPoints: 0 },
    Defender: { strikerPoints: 0, forwardPoints: 0, defenderPoints: 0, goalkeeperPoints: 0 },
    Keeper: { strikerPoints: 0, forwardPoints: 0, defenderPoints: 0, goalkeeperPoints: 0 }
  };

  // Random base between 50-80 for primary role, 20-50 for others
  const primaryMin = 60, primaryMax = 90;
  const secondaryMin = 20, secondaryMax = 50;

  const randomInRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Generate points based on role
  switch (playerRole) {
    case 'Striker':
      rolePoints.Striker.strikerPoints = randomInRange(primaryMin, primaryMax);
      rolePoints.Striker.forwardPoints = randomInRange(secondaryMin + 10, secondaryMax + 10); // Strikers also good at forward
      rolePoints.Striker.defenderPoints = randomInRange(secondaryMin - 10, secondaryMax - 10);
      rolePoints.Striker.goalkeeperPoints = randomInRange(10, 30);
      break;
    case 'Forward':
      rolePoints.Forward.strikerPoints = randomInRange(secondaryMin + 10, secondaryMax + 10); // Forwards also good at striking
      rolePoints.Forward.forwardPoints = randomInRange(primaryMin, primaryMax);
      rolePoints.Forward.defenderPoints = randomInRange(secondaryMin, secondaryMax);
      rolePoints.Forward.goalkeeperPoints = randomInRange(10, 30);
      break;
    case 'Defender':
      rolePoints.Defender.strikerPoints = randomInRange(10, 30);
      rolePoints.Defender.forwardPoints = randomInRange(secondaryMin, secondaryMax);
      rolePoints.Defender.defenderPoints = randomInRange(primaryMin, primaryMax);
      rolePoints.Defender.goalkeeperPoints = randomInRange(secondaryMin, secondaryMax);
      break;
    case 'Keeper':
      rolePoints.Keeper.strikerPoints = randomInRange(5, 20);
      rolePoints.Keeper.forwardPoints = randomInRange(10, 25);
      rolePoints.Keeper.defenderPoints = randomInRange(secondaryMin + 10, secondaryMax + 10); // Keepers also good at defending
      rolePoints.Keeper.goalkeeperPoints = randomInRange(primaryMin, primaryMax);
      break;
  }

  // Boost striker/forward points based on goals scored (each goal adds 5-10 points)
  const goalBonus = goalsScored * randomInRange(5, 10);
  if (rolePoints[playerRole]) {
    rolePoints[playerRole].strikerPoints = Math.min(100, rolePoints[playerRole].strikerPoints + goalBonus);
    rolePoints[playerRole].forwardPoints = Math.min(100, rolePoints[playerRole].forwardPoints + Math.floor(goalBonus * 0.7));
  }

  return rolePoints[playerRole] || rolePoints.Forward;
};

// Static method to calculate tournament awards (aggregates across all rounds)
playerPointsSchema.statics.calculateTournamentAwards = async function(tournamentId) {
  const pipeline = [
    {
      $match: { tournament: new mongoose.Types.ObjectId(tournamentId) }
    },
    // First group by player and match to get match-level stats
    {
      $group: {
        _id: { playerName: '$playerName', match: '$match' },
        team: { $first: '$team' },
        roundsPlayed: { $sum: 1 },
        matchPoints: { $sum: '$totalPoints' },
        matchGoals: { $sum: '$goalsScored' },
        strikerAvgMatch: { $avg: '$categoryPoints.strikerPoints' },
        forwardAvgMatch: { $avg: '$categoryPoints.forwardPoints' },
        defenderAvgMatch: { $avg: '$categoryPoints.defenderPoints' },
        goalkeeperAvgMatch: { $avg: '$categoryPoints.goalkeeperPoints' }
      }
    },
    // Then group by player to get tournament-level stats
    {
      $group: {
        _id: '$_id.playerName',
        team: { $first: '$team' },
        totalMatches: { $sum: 1 },
        totalRounds: { $sum: '$roundsPlayed' },
        totalPoints: { $sum: '$matchPoints' },
        totalGoals: { $sum: '$matchGoals' },
        strikerAvg: { $avg: '$strikerAvgMatch' },
        forwardAvg: { $avg: '$forwardAvgMatch' },
        defenderAvg: { $avg: '$defenderAvgMatch' },
        goalkeeperAvg: { $avg: '$goalkeeperAvgMatch' }
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

  // Find max goals for normalization
  const maxGoals = Math.max(...results.map(r => r.totalGoals || 0), 1); // Avoid division by zero

  // Calculate weighted scores for Striker & Forward (70% goals + 30% points)
  results.forEach(player => {
    const normalizedGoals = (player.totalGoals / maxGoals) * 100;

    // Striker Score = 70% normalized goals + 30% striker points
    player.strikerScore = (normalizedGoals * 0.7) + (player.strikerAvg * 0.3);

    // Forward Score = 70% normalized goals + 30% forward points
    player.forwardScore = (normalizedGoals * 0.7) + (player.forwardAvg * 0.3);
  });

  // Find best in each category
  const bestStriker = results.reduce((prev, current) =>
    (current.strikerScore > prev.strikerScore) ? current : prev
  );

  const bestForward = results.reduce((prev, current) =>
    (current.forwardScore > prev.forwardScore) ? current : prev
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
      totalGoals: results[0].totalGoals,
      matchesPlayed: results[0].totalMatches
    },
    bestStriker: {
      playerName: bestStriker._id,
      team: bestStriker.team,
      totalGoals: bestStriker.totalGoals,
      avgPoints: Math.round(bestStriker.strikerAvg * 100) / 100,
      weightedScore: Math.round(bestStriker.strikerScore * 100) / 100,
      matchesPlayed: bestStriker.totalMatches
    },
    bestForward: {
      playerName: bestForward._id,
      team: bestForward.team,
      totalGoals: bestForward.totalGoals,
      avgPoints: Math.round(bestForward.forwardAvg * 100) / 100,
      weightedScore: Math.round(bestForward.forwardScore * 100) / 100,
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
