// backend/controllers/playerPointsController.js
// NEW CONTROLLER - Player Points Management
const PlayerPoints = require('../models/PlayerPoints');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');

// @desc    Save/Update player points for a specific round
// @route   POST /api/tournaments/:tournamentId/player-points
// @access  Private (Admin only)
exports.savePlayerPoints = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { matchId, round, playerPoints } = req.body;

    // Validate tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Validate match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Validate round number
    if (!round || round < 1 || round > 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid round number. Must be 1, 2, or 3'
      });
    }

    // Save or update points for each player in this round
    const savedPoints = [];
    for (const playerData of playerPoints) {
      const existingPoints = await PlayerPoints.findOne({
        tournament: tournamentId,
        match: matchId,
        round: round,
        playerName: playerData.playerName
      });

      if (existingPoints) {
        // Update existing
        existingPoints.goalsScored = playerData.goalsScored || 0;
        existingPoints.playerRole = playerData.playerRole || existingPoints.playerRole;
        existingPoints.categoryPoints = playerData.categoryPoints;
        existingPoints.notes = playerData.notes || existingPoints.notes;
        existingPoints.enteredBy = req.admin._id;
        await existingPoints.save();
        savedPoints.push(existingPoints);
      } else {
        // Create new
        const newPoints = await PlayerPoints.create({
          tournament: tournamentId,
          match: matchId,
          round: round,
          team: playerData.team,
          playerName: playerData.playerName,
          playerRole: playerData.playerRole,
          goalsScored: playerData.goalsScored || 0,
          categoryPoints: playerData.categoryPoints,
          notes: playerData.notes,
          enteredBy: req.admin._id
        });
        savedPoints.push(newPoints);
      }
    }

    // After saving, calculate MOM for entire match (all rounds)
    await updateManOfMatch(tournamentId, matchId);

    res.status(200).json({
      success: true,
      message: `Round ${round} player points saved successfully`,
      data: savedPoints
    });
  } catch (error) {
    console.error('Error saving player points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save player points',
      error: error.message
    });
  }
};

// Helper function to update Man of Match
async function updateManOfMatch(tournamentId, matchId) {
  // Get all points for this match (all rounds)
  const allPoints = await PlayerPoints.find({
    tournament: tournamentId,
    match: matchId
  });

  if (allPoints.length === 0) return;

  // Group by player and calculate total
  const playerTotals = {};
  allPoints.forEach(point => {
    if (!playerTotals[point.playerName]) {
      playerTotals[point.playerName] = {
        playerName: point.playerName,
        team: point.team,
        totalPoints: 0,
        roundsPlayed: 0
      };
    }
    playerTotals[point.playerName].totalPoints += point.totalPoints;
    playerTotals[point.playerName].roundsPlayed += 1;
  });

  // Find player with highest total
  const players = Object.values(playerTotals);
  const manOfMatch = players.reduce((prev, current) =>
    (current.totalPoints > prev.totalPoints) ? current : prev
  );

  // Update Match
  await Match.findByIdAndUpdate(matchId, {
    manOfTheMatch: {
      playerName: manOfMatch.playerName,
      team: manOfMatch.team
    }
  });

  return manOfMatch;
}

// @desc    Auto-generate role-based points for a round
// @route   POST /api/tournaments/:tournamentId/player-points/auto-generate
// @access  Private (Admin only)
exports.autoGenerateRoundPoints = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { matchId, round, playerGoals } = req.body;
    // playerGoals = [{ playerName, team, playerRole, goalsScored }]

    // Validate
    const match = await Match.findById(matchId).populate('teamA teamB');
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    if (!round || round < 1 || round > 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid round number'
      });
    }

    const savedPoints = [];

    for (const player of playerGoals) {
      // Auto-generate category points based on role and goals
      const categoryPoints = PlayerPoints.generateRoleBasedPoints(
        player.playerRole,
        player.goalsScored || 0
      );

      // Check if exists
      const existingPoints = await PlayerPoints.findOne({
        tournament: tournamentId,
        match: matchId,
        round: round,
        playerName: player.playerName
      });

      if (existingPoints) {
        existingPoints.goalsScored = player.goalsScored || 0;
        existingPoints.playerRole = player.playerRole;
        existingPoints.categoryPoints = categoryPoints;
        existingPoints.enteredBy = req.admin._id;
        await existingPoints.save();
        savedPoints.push(existingPoints);
      } else {
        const newPoints = await PlayerPoints.create({
          tournament: tournamentId,
          match: matchId,
          round: round,
          team: player.team,
          playerName: player.playerName,
          playerRole: player.playerRole,
          goalsScored: player.goalsScored || 0,
          categoryPoints: categoryPoints,
          enteredBy: req.admin._id
        });
        savedPoints.push(newPoints);
      }
    }

    // Update MOM
    const manOfMatch = await updateManOfMatch(tournamentId, matchId);

    res.status(200).json({
      success: true,
      message: `Auto-generated points for Round ${round}`,
      data: savedPoints,
      manOfMatch: manOfMatch
    });
  } catch (error) {
    console.error('Error auto-generating points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to auto-generate points',
      error: error.message
    });
  }
};

// @desc    Get player points for a specific match (all rounds)
// @route   GET /api/tournaments/:tournamentId/player-points/match/:matchId
// @access  Public
exports.getMatchPlayerPoints = async (req, res) => {
  try {
    const { tournamentId, matchId } = req.params;
    const { round } = req.query; // Optional: filter by specific round

    const query = {
      tournament: tournamentId,
      match: matchId
    };

    if (round) {
      query.round = parseInt(round);
    }

    const points = await PlayerPoints.find(query)
      .populate('team', 'name color')
      .sort({ round: 1, totalPoints: -1 });

    // Group by round for easier frontend processing
    const roundWisePoints = {};
    points.forEach(point => {
      if (!roundWisePoints[point.round]) {
        roundWisePoints[point.round] = [];
      }
      roundWisePoints[point.round].push(point);
    });

    res.status(200).json({
      success: true,
      data: points,
      roundWise: roundWisePoints
    });
  } catch (error) {
    console.error('Error fetching match player points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player points',
      error: error.message
    });
  }
};

// @desc    Get all player points for entire tournament
// @route   GET /api/tournaments/:tournamentId/player-points
// @access  Public
exports.getTournamentPlayerPoints = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const points = await PlayerPoints.find({
      tournament: tournamentId
    }).populate('team', 'name color')
      .populate('match', 'matchNumber')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: points
    });
  } catch (error) {
    console.error('Error fetching tournament player points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player points',
      error: error.message
    });
  }
};

// @desc    Calculate and get tournament awards
// @route   GET /api/tournaments/:tournamentId/awards/calculate
// @access  Public
exports.calculateTournamentAwards = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const awards = await PlayerPoints.calculateTournamentAwards(tournamentId);

    if (!awards) {
      return res.status(404).json({
        success: false,
        message: 'No player points data found for this tournament'
      });
    }

    // Populate team details
    for (const key of ['manOfTournament', 'bestStriker', 'bestForward', 'bestDefender', 'bestGoalkeeper']) {
      if (awards[key] && awards[key].team) {
        const team = await Team.findById(awards[key].team).select('name color');
        awards[key].teamDetails = team;
      }
    }

    // Save awards and MOT to tournament model so they appear on public page
    await Tournament.findByIdAndUpdate(tournamentId, {
      awards: {
        bestStriker: awards.bestStriker,
        bestForward: awards.bestForward,
        bestDefender: awards.bestDefender,
        bestKeeper: awards.bestGoalkeeper
      },
      manOfTheTournament: awards.manOfTournament
    });

    res.status(200).json({
      success: true,
      data: awards
    });
  } catch (error) {
    console.error('Error calculating awards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate awards',
      error: error.message
    });
  }
};

// @desc    Get player statistics across tournament
// @route   GET /api/tournaments/:tournamentId/player-stats/:playerName
// @access  Public
exports.getPlayerStats = async (req, res) => {
  try {
    const { tournamentId, playerName } = req.params;

    const playerPoints = await PlayerPoints.find({
      tournament: tournamentId,
      playerName: playerName
    }).populate('match', 'matchNumber').sort({ createdAt: 1 });

    if (playerPoints.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for this player'
      });
    }

    // Calculate aggregated stats
    const stats = {
      playerName: playerName,
      team: playerPoints[0].team,
      matchesPlayed: playerPoints.length,
      totalPoints: 0,
      categoryAverages: {
        striker: 0,
        forward: 0,
        defender: 0,
        goalkeeper: 0
      },
      matchBreakdown: []
    };

    let strikerSum = 0, forwardSum = 0, defenderSum = 0, goalkeeperSum = 0;

    playerPoints.forEach(point => {
      stats.totalPoints += point.totalPoints;
      strikerSum += point.categoryPoints.strikerPoints;
      forwardSum += point.categoryPoints.forwardPoints;
      defenderSum += point.categoryPoints.defenderPoints;
      goalkeeperSum += point.categoryPoints.goalkeeperPoints;

      stats.matchBreakdown.push({
        matchNumber: point.match.matchNumber,
        points: point.categoryPoints,
        total: point.totalPoints
      });
    });

    stats.categoryAverages.striker = Math.round((strikerSum / playerPoints.length) * 100) / 100;
    stats.categoryAverages.forward = Math.round((forwardSum / playerPoints.length) * 100) / 100;
    stats.categoryAverages.defender = Math.round((defenderSum / playerPoints.length) * 100) / 100;
    stats.categoryAverages.goalkeeper = Math.round((goalkeeperSum / playerPoints.length) * 100) / 100;

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player stats',
      error: error.message
    });
  }
};

// @desc    Delete player points for a match (Admin only)
// @route   DELETE /api/tournaments/:tournamentId/player-points/match/:matchId
// @access  Private (Admin only)
exports.deleteMatchPlayerPoints = async (req, res) => {
  try {
    const { tournamentId, matchId } = req.params;

    await PlayerPoints.deleteMany({
      tournament: tournamentId,
      match: matchId
    });

    res.status(200).json({
      success: true,
      message: 'Player points deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting player points:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete player points',
      error: error.message
    });
  }
};
