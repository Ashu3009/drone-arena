// backend/controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const TournamentStanding = require('../models/TournamentStanding');
const Team = require('../models/Team');
const DroneReport = require('../models/DroneReport');
const Match = require('../models/Match');
const path = require('path');
const fs = require('fs');

// @desc    Get all tournaments
// @route   GET /api/tournaments
exports.getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('registeredTeams', 'name location teamType')
      .sort({ createdAt: -1 });

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
    const tournament = await Tournament.findById(req.params.id)
      .populate('registeredTeams', 'name location teamType members')
      .populate('winners.champion', 'name location')
      .populate('winners.runnerUp', 'name location')
      .populate('winners.thirdPlace', 'name location')
      .populate('manOfTheTournament.team', 'name location')
      .populate('awards.bestForward.team', 'name')
      .populate('awards.bestCenter.team', 'name')
      .populate('awards.bestDefender.team', 'name')
      .populate('awards.bestKeeper.team', 'name');

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
    const {
      name,
      description,
      startDate,
      endDate,
      maxTeams,
      location,
      prizePool,
      media,
      organizer,
      registration,
      registeredTeams,
      settings
    } = req.body;

    // Validation
    if (!name || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, start date, and end date'
      });
    }

    // Validate location (city is required)
    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tournament location (city is required)'
      });
    }

    // Validate at least 2 teams are registered
    if (!registeredTeams || registeredTeams.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 teams must be registered for a tournament'
      });
    }

    // Validate registered teams
    if (registeredTeams && registeredTeams.length > 0) {
      // Check if teams exist
      const teams = await Team.find({ '_id': { $in: registeredTeams } });
      if (teams.length !== registeredTeams.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more teams not found'
        });
      }

      // Check if exceeds maxTeams
      if (registeredTeams.length > (maxTeams || 16)) {
        return res.status(400).json({
          success: false,
          message: `Cannot register more than ${maxTeams || 16} teams`
        });
      }
    }

    const tournament = await Tournament.create({
      name,
      description,
      startDate,
      endDate,
      maxTeams: maxTeams || 16,
      currentTeams: registeredTeams ? registeredTeams.length : 0,
      location,
      prizePool,
      media,
      organizer,
      registration,
      registeredTeams: registeredTeams || [],
      settings: settings || {
        matchType: 'Best of 2',
        hasTiebreaker: true,
        roundDuration: 3
      }
    });

    // Populate registered teams before returning
    await tournament.populate('registeredTeams', 'name location teamType');

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
    const { registeredTeams, maxTeams, location, status } = req.body;

    // Validate location if provided
    if (location && !location.city) {
      return res.status(400).json({
        success: false,
        message: 'City is required in location'
      });
    }

    // Validate registered teams if provided
    if (registeredTeams && registeredTeams.length > 0) {
      // Check if teams exist
      const teams = await Team.find({ '_id': { $in: registeredTeams } });
      if (teams.length !== registeredTeams.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more teams not found'
        });
      }

      // Check if exceeds maxTeams
      const maxAllowed = maxTeams || req.body.maxTeams || 16;
      if (registeredTeams.length > maxAllowed) {
        return res.status(400).json({
          success: false,
          message: `Cannot register more than ${maxAllowed} teams`
        });
      }

      // Update currentTeams count
      req.body.currentTeams = registeredTeams.length;
    }

    // Auto-complete matches when tournament is marked as completed
    if (status === 'completed') {
      await Match.updateMany(
        { tournament: req.params.id, status: { $ne: 'completed' } },
        { status: 'completed' }
      );
      console.log(`✅ Auto-completed all matches for tournament ${req.params.id}`);
    }

    const tournament = await Tournament.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('registeredTeams', 'name location teamType');

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
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Get all matches for this tournament
    const matches = await Match.find({ tournament: req.params.id });
    const matchIds = matches.map(m => m._id);

    // Cascade delete in order:
    // 1. Delete all drone reports for these matches
    if (matchIds.length > 0) {
      await DroneReport.deleteMany({ match: { $in: matchIds } });
      console.log(`🗑️  Deleted drone reports for ${matchIds.length} matches`);
    }

    // 2. Delete all matches
    await Match.deleteMany({ tournament: req.params.id });
    console.log(`🗑️  Deleted ${matchIds.length} matches`);

    // 3. Delete tournament standings
    await TournamentStanding.deleteMany({ tournament: req.params.id });

    // 4. Delete the tournament itself
    await Tournament.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Tournament and all associated data deleted successfully',
      deletedData: {
        matches: matchIds.length,
        tournament: tournament.name
      }
    });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to calculate tournament awards from all matches
const calculateTournamentAwards = async (tournamentId) => {
  const Match = require('../models/Match');

  try {
    // Find all completed matches for this tournament
    const matches = await Match.find({
      tournament: tournamentId,
      status: 'completed',
      'manOfTheMatch.playerName': { $exists: true, $ne: null }
    }).populate('manOfTheMatch.team', 'name');

    if (matches.length === 0) {
      return null; // No matches with Man of the Match data
    }

    // Aggregate player stats
    const playerStats = {};

    matches.forEach(match => {
      if (match.manOfTheMatch && match.manOfTheMatch.playerName) {
        const playerKey = `${match.manOfTheMatch.playerName}|${match.manOfTheMatch.team?._id || 'unknown'}`;

        if (!playerStats[playerKey]) {
          playerStats[playerKey] = {
            playerName: match.manOfTheMatch.playerName,
            team: match.manOfTheMatch.team?._id || null,
            photo: match.manOfTheMatch.photo || null,
            goals: 0,
            assists: 0,
            saves: 0
          };
        }

        // Accumulate stats
        playerStats[playerKey].goals += match.manOfTheMatch.stats?.goals || 0;
        playerStats[playerKey].assists += match.manOfTheMatch.stats?.assists || 0;
        playerStats[playerKey].saves += match.manOfTheMatch.stats?.saves || 0;
      }
    });

    // Convert to array
    const players = Object.values(playerStats);

    // Find best striker (most goals)
    const bestStriker = players.reduce((best, current) =>
      (current.goals > (best?.goals || 0)) ? current : best
    , null);

    // Find best forward (most assists)
    const bestForward = players.reduce((best, current) =>
      (current.assists > (best?.assists || 0)) ? current : best
    , null);

    // Find best defender (most saves)
    const bestDefender = players.reduce((best, current) =>
      (current.saves > (best?.saves || 0)) ? current : best
    , null);

    return {
      bestStriker: bestStriker ? {
        playerName: bestStriker.playerName,
        team: bestStriker.team,
        photo: bestStriker.photo,
        goals: bestStriker.goals
      } : null,
      bestForward: bestForward ? {
        playerName: bestForward.playerName,
        team: bestForward.team,
        photo: bestForward.photo,
        assists: bestForward.assists
      } : null,
      bestDefender: bestDefender ? {
        playerName: bestDefender.playerName,
        team: bestDefender.team,
        photo: bestDefender.photo,
        saves: bestDefender.saves
      } : null
    };
  } catch (error) {
    console.error('Error calculating tournament awards:', error);
    return null;
  }
};

// @desc    Set tournament winners
// @route   PUT /api/tournaments/:id/winners
exports.setWinners = async (req, res) => {
  try {
    const { champion, runnerUp, thirdPlace } = req.body;

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Verify teams exist
    if (champion) {
      const team = await Team.findById(champion);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Champion team not found'
        });
      }
    }

    if (runnerUp) {
      const team = await Team.findById(runnerUp);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Runner-up team not found'
        });
      }
    }

    if (thirdPlace) {
      const team = await Team.findById(thirdPlace);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Third place team not found'
        });
      }
    }

    // Update winners
    tournament.winners = {
      champion: champion || null,
      runnerUp: runnerUp || null,
      thirdPlace: thirdPlace || null
    };

    // Mark tournament as completed
    tournament.status = 'completed';

    // Calculate and set tournament awards automatically
    const awards = await calculateTournamentAwards(req.params.id);
    if (awards) {
      tournament.awards = awards;
    }

    await tournament.save();

    // Populate winners before returning
    await tournament.populate('winners.champion', 'name location');
    await tournament.populate('winners.runnerUp', 'name location');
    await tournament.populate('winners.thirdPlace', 'name location');

    res.json({
      success: true,
      message: 'Winners set successfully',
      data: tournament
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

// @desc    Upload tournament banner
// @route   POST /api/tournaments/:id/upload-banner
exports.uploadBanner = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a banner image'
      });
    }

    // Delete old banner if exists
    if (tournament.media && tournament.media.bannerImage) {
      const oldPath = path.join(__dirname, '..', tournament.media.bannerImage);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update banner image path
    const bannerPath = `/uploads/tournaments/${req.file.filename}`;

    if (!tournament.media) {
      tournament.media = {};
    }
    tournament.media.bannerImage = bannerPath;

    await tournament.save();

    res.json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        bannerImage: bannerPath
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload tournament gallery images
// @route   POST /api/tournaments/:id/upload-gallery
exports.uploadGallery = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    // Add new images to gallery
    const newImages = req.files.map(file => `/uploads/tournaments/gallery/${file.filename}`);

    if (!tournament.media) {
      tournament.media = { gallery: [] };
    }
    if (!tournament.media.gallery) {
      tournament.media.gallery = [];
    }

    tournament.media.gallery.push(...newImages);
    await tournament.save();

    res.json({
      success: true,
      message: `${newImages.length} image(s) uploaded successfully`,
      data: {
        gallery: tournament.media.gallery
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete gallery image
// @route   DELETE /api/tournaments/:id/gallery/:imageIndex
exports.deleteGalleryImage = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const imageIndex = parseInt(req.params.imageIndex);

    if (!tournament.media || !tournament.media.gallery || imageIndex < 0 || imageIndex >= tournament.media.gallery.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    // Delete file from filesystem
    const imagePath = tournament.media.gallery[imageIndex];
    const fullPath = path.join(__dirname, '..', imagePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // Remove from gallery array
    tournament.media.gallery.splice(imageIndex, 1);
    await tournament.save();

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: {
        gallery: tournament.media.gallery
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Set Man of the Tournament
// @route   PUT /api/tournaments/:id/man-of-tournament
exports.setManOfTournament = async (req, res) => {
  try {
    const { playerName, team, stats } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Validate team if provided
    if (team) {
      const teamExists = await Team.findById(team);
      if (!teamExists) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }
    }

    // Handle photo upload if file is present
    let photoPath = tournament.manOfTheTournament?.photo;
    if (req.file) {
      // Delete old photo if exists
      if (photoPath) {
        const oldPath = path.join(__dirname, '..', photoPath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      photoPath = `/uploads/tournaments/${req.file.filename}`;
    }

    // Parse stats if it's a JSON string (from FormData)
    let parsedStats = { goals: 0, assists: 0, matchesPlayed: 0 };
    if (stats) {
      try {
        parsedStats = typeof stats === 'string' ? JSON.parse(stats) : stats;
      } catch (e) {
        parsedStats = { goals: 0, assists: 0, matchesPlayed: 0 };
      }
    }

    tournament.manOfTheTournament = {
      playerName,
      team: team || null,
      photo: photoPath,
      stats: parsedStats
    };

    await tournament.save();
    await tournament.populate('manOfTheTournament.team', 'name location');

    res.json({
      success: true,
      message: 'Man of the Tournament set successfully',
      data: tournament.manOfTheTournament
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add teams to tournament
// @route   POST /api/tournaments/:id/add-teams
exports.addTeamsToTournament = async (req, res) => {
  try {
    const { teamIds } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide team IDs array'
      });
    }

    // Validate teams exist
    const teams = await Team.find({ '_id': { $in: teamIds } });
    if (teams.length !== teamIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more teams not found'
      });
    }

    // Filter out already registered teams
    const newTeams = teamIds.filter(id => !tournament.registeredTeams.includes(id));

    // Check max teams limit
    if (tournament.registeredTeams.length + newTeams.length > tournament.maxTeams) {
      return res.status(400).json({
        success: false,
        message: `Cannot exceed maximum of ${tournament.maxTeams} teams`
      });
    }

    // Add new teams
    tournament.registeredTeams.push(...newTeams);
    tournament.currentTeams = tournament.registeredTeams.length;

    await tournament.save();
    await tournament.populate('registeredTeams', 'name location teamType');

    res.json({
      success: true,
      message: `${newTeams.length} team(s) added successfully`,
      data: tournament.registeredTeams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove team from tournament
// @route   DELETE /api/tournaments/:id/remove-team/:teamId
exports.removeTeamFromTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const teamIndex = tournament.registeredTeams.indexOf(req.params.teamId);

    if (teamIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Team not registered in this tournament'
      });
    }

    tournament.registeredTeams.splice(teamIndex, 1);
    tournament.currentTeams = tournament.registeredTeams.length;

    await tournament.save();
    await tournament.populate('registeredTeams', 'name location teamType');

    res.json({
      success: true,
      message: 'Team removed successfully',
      data: tournament.registeredTeams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Filter tournaments
// @route   GET /api/tournaments/filter
exports.filterTournaments = async (req, res) => {
  try {
    const { timeRange, customStartDate, customEndDate, state, city, status } = req.query;

    let query = {};

    // Time filter
    if (timeRange) {
      const now = new Date();
      let startDate;

      switch(timeRange) {
        case 'last_month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'last_3_months':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            query.startDate = {
              $gte: new Date(customStartDate),
              $lte: new Date(customEndDate)
            };
          }
          break;
        default:
          break;
      }

      if (startDate && timeRange !== 'custom') {
        query.startDate = { $gte: startDate };
      }
    }

    // Location filter
    if (state) {
      query['location.state'] = state;
    }
    if (city) {
      query['location.city'] = city;
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    const tournaments = await Tournament.find(query)
      .populate('registeredTeams', 'name location')
      .populate('winners.champion', 'name')
      .populate('winners.runnerUp', 'name')
      .populate('winners.thirdPlace', 'name')
      .sort({ startDate: -1 });

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

// @desc    Generate Tournament Final Report + Calculate Man of the Tournament
// @route   POST /api/tournaments/:id/generate-final-report
// @access  Private (Admin only)
exports.generateTournamentFinalReport = async (req, res) => {
  try {
    const { id: tournamentId } = req.params;

    console.log(`\n🏆 Generating Final Report for Tournament ${tournamentId}...`);

    const tournament = await Tournament.findById(tournamentId)
      .populate('registeredTeams', 'name color members');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Get all matches for this tournament
    const matches = await Match.find({ tournament: tournamentId })
      .populate('teamA teamB', 'name color');

    if (matches.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No matches found for this tournament'
      });
    }

    // Get all drone reports for this tournament
    const reports = await DroneReport.find({ tournament: tournamentId })
      .populate('team', 'name color members');

    if (reports.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No reports found. Complete at least one match first.'
      });
    }

    console.log(`   📊 Found ${reports.length} reports across ${matches.length} matches`);

    // ============================================================
    // CALCULATE MAN OF THE TOURNAMENT
    // ============================================================
    const pilotStats = {};

    reports.forEach(report => {
      const pilotId = report.pilotId;

      if (!pilotStats[pilotId]) {
        pilotStats[pilotId] = {
          pilotId: report.pilotId,
          pilotName: report.pilotName,
          team: report.team,
          photo: null,
          totalScore: 0,
          matchesPlayed: new Set(),
          roundsPlayed: 0,
          avgPerformance: 0,
          bestPerformance: 0,
          totalDistance: 0,
          avgSpeed: 0,
          totalBatteryUsed: 0,
          mlMetrics: {
            aggressiveness: 0,
            defensiveness: 0,
            teamwork: 0,
            efficiency: 0
          }
        };
      }

      const stats = pilotStats[pilotId];
      stats.totalScore += report.performanceScore || 0;
      stats.matchesPlayed.add(report.match.toString());
      stats.roundsPlayed++;
      stats.totalDistance += report.totalDistance || 0;
      stats.avgSpeed += report.averageSpeed || 0;
      stats.totalBatteryUsed += report.batteryUsage?.consumed || 0;

      if (report.performanceScore > stats.bestPerformance) {
        stats.bestPerformance = report.performanceScore;
      }

      if (report.mlAnalysis) {
        stats.mlMetrics.aggressiveness += report.mlAnalysis.aggressiveness || 0;
        stats.mlMetrics.defensiveness += report.mlAnalysis.defensiveness || 0;
        stats.mlMetrics.teamwork += report.mlAnalysis.teamwork || 0;
        stats.mlMetrics.efficiency += report.mlAnalysis.efficiency || 0;
      }
    });

    // Calculate averages and find Man of the Tournament
    let bestPlayer = null;
    let highestScore = 0;

    Object.values(pilotStats).forEach(stats => {
      const count = stats.roundsPlayed;
      stats.avgPerformance = Math.round(stats.totalScore / count);
      stats.avgSpeed = Math.round((stats.avgSpeed / count) * 10) / 10;
      stats.totalDistance = Math.round(stats.totalDistance * 10) / 10;
      stats.totalBatteryUsed = Math.round(stats.totalBatteryUsed * 10) / 10;

      stats.mlMetrics.aggressiveness = Math.round(stats.mlMetrics.aggressiveness / count);
      stats.mlMetrics.defensiveness = Math.round(stats.mlMetrics.defensiveness / count);
      stats.mlMetrics.teamwork = Math.round(stats.mlMetrics.teamwork / count);
      stats.mlMetrics.efficiency = Math.round(stats.mlMetrics.efficiency / count);

      // Tournament Score = (Avg Performance × 0.5) + (Best Performance × 0.3) + (Matches Played × 2)
      const tournamentScore = (stats.avgPerformance * 0.5) + (stats.bestPerformance * 0.3) + (stats.matchesPlayed.size * 2);

      if (tournamentScore > highestScore) {
        highestScore = tournamentScore;
        bestPlayer = stats;
      }
    });

    // Find pilot photo from team members
    if (bestPlayer) {
      const member = bestPlayer.team.members.find(m => m._id.toString() === bestPlayer.pilotId);
      bestPlayer.photo = member?.photo || null;

      // Update tournament with Man of the Tournament
      tournament.manOfTheTournament = {
        playerName: bestPlayer.pilotName,
        team: bestPlayer.team._id,
        photo: bestPlayer.photo,
        stats: {
          goals: 0, // Can be calculated from match data if needed
          assists: 0,
          matchesPlayed: bestPlayer.matchesPlayed.size
        }
      };

      console.log(`   ⭐ Man of the Tournament: ${bestPlayer.pilotName} (${bestPlayer.team.name})`);
      console.log(`      Avg Performance: ${bestPlayer.avgPerformance}/100`);
      console.log(`      Best Performance: ${bestPlayer.bestPerformance}/100`);
      console.log(`      Matches Played: ${bestPlayer.matchesPlayed.size}`);
    }

    // ============================================================
    // CALCULATE TEAM RANKINGS
    // ============================================================
    const teamStats = {};

    reports.forEach(report => {
      const teamId = report.team._id.toString();

      if (!teamStats[teamId]) {
        teamStats[teamId] = {
          team: report.team,
          totalScore: 0,
          reportsCount: 0,
          matchesPlayed: new Set(),
          wins: 0,
          draws: 0,
          losses: 0
        };
      }

      teamStats[teamId].totalScore += report.performanceScore || 0;
      teamStats[teamId].reportsCount++;
      teamStats[teamId].matchesPlayed.add(report.match.toString());
    });

    // Add match results to team stats
    matches.forEach(match => {
      if (match.status === 'completed') {
        const teamAId = match.teamA._id.toString();
        const teamBId = match.teamB._id.toString();

        if (teamStats[teamAId]) {
          if (match.finalScoreA > match.finalScoreB) {
            teamStats[teamAId].wins++;
          } else if (match.finalScoreA === match.finalScoreB) {
            teamStats[teamAId].draws++;
          } else {
            teamStats[teamAId].losses++;
          }
        }

        if (teamStats[teamBId]) {
          if (match.finalScoreB > match.finalScoreA) {
            teamStats[teamBId].wins++;
          } else if (match.finalScoreA === match.finalScoreB) {
            teamStats[teamBId].draws++;
          } else {
            teamStats[teamBId].losses++;
          }
        }
      }
    });

    // Sort teams by performance
    const teamRankings = Object.values(teamStats).map(stats => {
      const points = (stats.wins * 3) + (stats.draws * 1);
      const avgPerformance = Math.round(stats.totalScore / stats.reportsCount);

      return {
        team: stats.team,
        points,
        wins: stats.wins,
        draws: stats.draws,
        losses: stats.losses,
        matchesPlayed: stats.matchesPlayed.size,
        avgPerformance
      };
    }).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.avgPerformance - a.avgPerformance;
    });

    // Update tournament winners
    if (teamRankings.length >= 1) {
      tournament.winners.champion = teamRankings[0].team._id;
      console.log(`   🥇 Champion: ${teamRankings[0].team.name}`);
    }
    if (teamRankings.length >= 2) {
      tournament.winners.runnerUp = teamRankings[1].team._id;
      console.log(`   🥈 Runner Up: ${teamRankings[1].team.name}`);
    }
    if (teamRankings.length >= 3) {
      tournament.winners.thirdPlace = teamRankings[2].team._id;
      console.log(`   🥉 Third Place: ${teamRankings[2].team.name}`);
    }

    // Save tournament
    await tournament.save();

    console.log(`\n✅ Tournament Final Report Generated Successfully!\n`);

    res.json({
      success: true,
      message: 'Tournament final report generated successfully',
      data: {
        tournament: {
          _id: tournament._id,
          name: tournament.name,
          status: tournament.status,
          manOfTheTournament: tournament.manOfTheTournament,
          winners: tournament.winners
        },
        statistics: {
          totalMatches: matches.length,
          completedMatches: matches.filter(m => m.status === 'completed').length,
          totalReports: reports.length,
          totalPilots: Object.keys(pilotStats).length,
          teamRankings
        },
        topPilots: Object.values(pilotStats)
          .sort((a, b) => b.avgPerformance - a.avgPerformance)
          .slice(0, 10)
          .map(pilot => ({
            pilotName: pilot.pilotName,
            team: pilot.team.name,
            avgPerformance: pilot.avgPerformance,
            bestPerformance: pilot.bestPerformance,
            matchesPlayed: pilot.matchesPlayed.size,
            roundsPlayed: pilot.roundsPlayed
          }))
      }
    });

  } catch (error) {
    console.error('❌ Error generating tournament final report:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
