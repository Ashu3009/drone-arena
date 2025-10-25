// backend/controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const TournamentStanding = require('../models/TournamentStanding');
const Team = require('../models/Team');

// @desc    Get all tournaments
// @route   GET /api/tournaments
exports.getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: tournaments.length,
      data: tournaments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single tournament
// @route   GET /api/tournaments/:id
exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new tournament
// @route   POST /api/tournaments
exports.createTournament = async (req, res) => {
  try {
    const { name, description, startDate, endDate, maxTeams } = req.body;
    
    // Validation
    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, start date, and end date'
      });
    }
    
    const tournament = await Tournament.create({
      name,
      description,
      startDate,
      endDate,
      maxTeams: maxTeams || 16
    });
    
    res.status(201).json({
      success: true,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update tournament
// @route   PUT /api/tournaments/:id
exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete tournament
// @route   DELETE /api/tournaments/:id
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findByIdAndDelete(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    // Also delete associated standings
    await TournamentStanding.deleteMany({ tournament: req.params.id });
    
    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Register team to tournament
// @route   POST /api/tournaments/:id/register
exports.registerTeamToTournament = async (req, res) => {
  try {
    const { teamId } = req.body;
    const tournamentId = req.params.id;
    
    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    // Check if tournament is full
    if (tournament.currentTeams >= tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }
    
    // Check if team already registered
    const existingStanding = await TournamentStanding.findOne({
      tournament: tournamentId,
      team: teamId
    });
    
    if (existingStanding) {
      return res.status(400).json({
        success: false,
        message: 'Team already registered in this tournament'
      });
    }
    
    // Create standing entry
    const standing = await TournamentStanding.create({
      tournament: tournamentId,
      team: teamId
    });
    
    // Update tournament team count
    tournament.currentTeams += 1;
    await tournament.save();
    
    res.status(201).json({
      success: true,
      data: standing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};