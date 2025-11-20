// backend/controllers/schoolController.js
const School = require('../models/School');
const Team = require('../models/Team');

// @desc    Get all schools
// @route   GET /api/schools
// @access  Public
exports.getAllSchools = async (req, res) => {
  try {
    const schools = await School.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      data: schools
    });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching schools',
      error: error.message
    });
  }
};

// @desc    Get school by ID
// @route   GET /api/schools/:id
// @access  Public
exports.getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Get teams for this school
    const teams = await Team.find({ school: req.params.id });

    res.status(200).json({
      success: true,
      data: {
        ...school.toObject(),
        teams
      }
    });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching school',
      error: error.message
    });
  }
};

// @desc    Create new school
// @route   POST /api/schools
// @access  Private (Admin only)
exports.createSchool = async (req, res) => {
  try {
    const { name, location, contactInfo, established, logo, description } = req.body;

    // Check if school with same name already exists
    const existingSchool = await School.findOne({ name });
    if (existingSchool) {
      return res.status(400).json({
        success: false,
        message: 'School with this name already exists'
      });
    }

    const school = await School.create({
      name,
      location,
      contactInfo,
      established,
      logo,
      description
    });

    res.status(201).json({
      success: true,
      message: 'School created successfully',
      data: school
    });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating school',
      error: error.message
    });
  }
};

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private (Admin only)
exports.updateSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Update fields
    const allowedUpdates = ['name', 'location', 'contactInfo', 'established', 'logo', 'description', 'status'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        school[field] = req.body[field];
      }
    });

    await school.save();

    res.status(200).json({
      success: true,
      message: 'School updated successfully',
      data: school
    });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating school',
      error: error.message
    });
  }
};

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private (Admin only)
exports.deleteSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Check if school has teams
    const teams = await Team.find({ school: req.params.id });
    if (teams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete school. It has ${teams.length} team(s). Please delete teams first or reassign them.`
      });
    }

    await school.deleteOne();

    res.status(200).json({
      success: true,
      message: 'School deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting school',
      error: error.message
    });
  }
};

// @desc    Get schools by city/state
// @route   GET /api/schools/filter?city=XX&state=YY
// @access  Public
exports.filterSchools = async (req, res) => {
  try {
    const { city, state } = req.query;
    const filter = {};

    if (city) filter['location.city'] = { $regex: city, $options: 'i' };
    if (state) filter['location.state'] = { $regex: state, $options: 'i' };

    const schools = await School.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: schools.length,
      data: schools
    });
  } catch (error) {
    console.error('Error filtering schools:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while filtering schools',
      error: error.message
    });
  }
};

// @desc    Get school statistics
// @route   GET /api/schools/:id/stats
// @access  Public
exports.getSchoolStats = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found'
      });
    }

    // Get teams
    const teams = await Team.find({ school: req.params.id });

    // Calculate total wins across all teams
    const totalWins = teams.reduce((sum, team) => sum + team.wins, 0);
    const totalLosses = teams.reduce((sum, team) => sum + team.losses, 0);
    const totalPoints = teams.reduce((sum, team) => sum + team.points, 0);

    res.status(200).json({
      success: true,
      data: {
        schoolName: school.name,
        totalTeams: teams.length,
        totalWins,
        totalLosses,
        totalPoints,
        teams: teams.map(t => ({
          name: t.name,
          wins: t.wins,
          losses: t.losses,
          points: t.points
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching school stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching school stats',
      error: error.message
    });
  }
};
