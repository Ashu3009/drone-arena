// backend/controllers/teamController.js
const Team = require('../models/Team');
const path = require('path');
const fs = require('fs');

// @desc    Get all teams
// @route   GET /api/teams
exports.getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('school', 'name location') // Populate school details
      .sort({ name: 1 });

    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('school', 'name location'); // Populate school details

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new team
// @route   POST /api/teams
exports.createTeam = async (req, res) => {
  try {
    const { name, school, teamType, teamSize, location, color, captainName, members, droneIds } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide team name'
      });
    }

    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide team location (city is required)'
      });
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team name already exists'
      });
    }

    const team = await Team.create({
      name,
      school: school || null, // Optional
      teamType: teamType || 'School',
      teamSize: teamSize || '4v4',
      location,
      color: color || '#3B82F6',
      captain: captainName,
      members,
      droneIds: droneIds || []
    });
    
    res.status(201).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Delete all member photos
    if (team.members && team.members.length > 0) {
      team.members.forEach(member => {
        if (member.photo) {
          const photoPath = path.join(__dirname, '..', member.photo);
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Upload member photo
// @route   POST /api/teams/:id/members/:memberIndex/photo
exports.uploadMemberPhoto = async (req, res) => {
  try {
    const { id, memberIndex } = req.params;
    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const index = parseInt(memberIndex);
    if (index < 0 || index >= team.members.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member index'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file uploaded'
      });
    }

    // Delete old photo if exists
    if (team.members[index].photo) {
      const oldPhotoPath = path.join(__dirname, '..', team.members[index].photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update member photo path
    // Use req.file.path for Cloudinary (full URL) or local path
    team.members[index].photo = req.file.path;
    await team.save();

    res.json({
      success: true,
      message: 'Member photo uploaded successfully',
      data: {
        photo: team.members[index].photo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};