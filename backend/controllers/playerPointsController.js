// backend/controllers/playerPointsController.js
// NEW CONTROLLER - Player Points Management
const PlayerPoints = require('../models/PlayerPoints');
const Tournament = require('../models/Tournament');
const Match = require('../models/Match');
const Team = require('../models/Team');

// @desc    Save/Update player points for a match
// @route   POST /api/tournaments/:tournamentId/player-points
// @access  Private (Admin only)
exports.savePlayerPoints = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { matchId, playerPoints } = req.body;

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

    // Save or update points for each player
    const savedPoints = [];
    for (const playerData of playerPoints) {
      const existingPoints = await PlayerPoints.findOne({
        tournament: tournamentId,
        match: matchId,
        playerName: playerData.playerName
      });

      if (existingPoints) {
        // Update existing
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
          team: playerData.team,
          playerName: playerData.playerName,
          categoryPoints: playerData.categoryPoints,
          notes: playerData.notes,
          enteredBy: req.admin._id
        });
        savedPoints.push(newPoints);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Player points saved successfully',
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

// @desc    Get player points for a specific match
// @route   GET /api/tournaments/:tournamentId/player-points/match/:matchId
// @access  Public
exports.getMatchPlayerPoints = async (req, res) => {
  try {
    const { tournamentId, matchId } = req.params;

    const points = await PlayerPoints.find({
      tournament: tournamentId,
      match: matchId
    }).populate('team', 'name color').sort({ totalPoints: -1 });

    res.status(200).json({
      success: true,
      data: points
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
