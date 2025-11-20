// backend/controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const TournamentStanding = require('../models/TournamentStanding');
const Team = require('../models/Team');
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
      .populate('registeredTeams', 'name location teamType')
      .populate('winners.champion', 'name location')
      .populate('winners.runnerUp', 'name location')
      .populate('winners.thirdPlace', 'name location')
      .populate('manOfTheTournament.team', 'name location');

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