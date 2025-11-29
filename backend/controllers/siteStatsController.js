const SiteStats = require('../models/SiteStats');

// GET /api/stats - Get current site stats (public)
exports.getStats = async (req, res) => {
  try {
    const stats = await SiteStats.getInstance();

    // Auto-calculate before returning
    await stats.calculateStats();

    const displayStats = stats.getDisplayStats();

    res.json({
      success: true,
      data: displayStats
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site statistics',
      error: error.message
    });
  }
};

// PUT /api/stats/manual-override - Forcefully override stats (admin only)
exports.manualOverride = async (req, res) => {
  try {
    const { totalMatches, activeTeams, activeDrones, totalTournaments } = req.body;

    const stats = await SiteStats.getInstance();

    // Update manual override flags and values
    if (totalMatches !== undefined) {
      stats.manualOverride.totalMatches = true;
      stats.manualValues.totalMatches = totalMatches;
    }
    if (activeTeams !== undefined) {
      stats.manualOverride.activeTeams = true;
      stats.manualValues.activeTeams = activeTeams;
    }
    if (activeDrones !== undefined) {
      stats.manualOverride.activeDrones = true;
      stats.manualValues.activeDrones = activeDrones;
    }
    if (totalTournaments !== undefined) {
      stats.manualOverride.totalTournaments = true;
      stats.manualValues.totalTournaments = totalTournaments;
    }

    stats.lastUpdated = new Date();
    await stats.save();

    res.json({
      success: true,
      message: 'Stats manually overridden successfully',
      data: stats.getDisplayStats()
    });
  } catch (error) {
    console.error('Error overriding stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override statistics',
      error: error.message
    });
  }
};

// PUT /api/stats/reset - Reset to auto-calculated stats (admin only)
exports.resetToAuto = async (req, res) => {
  try {
    const { fields } = req.body; // Array of field names to reset ['totalMatches', 'activeTeams', etc]

    const stats = await SiteStats.getInstance();

    if (fields && Array.isArray(fields)) {
      // Reset specific fields
      fields.forEach(field => {
        if (stats.manualOverride[field] !== undefined) {
          stats.manualOverride[field] = false;
          stats.manualValues[field] = 0;
        }
      });
    } else {
      // Reset all fields
      stats.manualOverride = {
        totalMatches: false,
        activeTeams: false,
        activeDrones: false,
        totalTournaments: false
      };
      stats.manualValues = {
        totalMatches: 0,
        activeTeams: 0,
        activeDrones: 16,
        totalTournaments: 0
      };
    }

    // Recalculate auto stats
    await stats.calculateStats();

    res.json({
      success: true,
      message: 'Stats reset to auto-calculated values',
      data: stats.getDisplayStats()
    });
  } catch (error) {
    console.error('Error resetting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset statistics',
      error: error.message
    });
  }
};

// GET /api/stats/details - Get detailed stats info (admin only)
exports.getDetailsForAdmin = async (req, res) => {
  try {
    const stats = await SiteStats.getInstance();
    await stats.calculateStats();

    res.json({
      success: true,
      data: {
        autoCalculated: {
          totalMatches: stats.totalMatches,
          activeTeams: stats.activeTeams,
          activeDrones: stats.activeDrones,
          totalTournaments: stats.totalTournaments
        },
        manualOverride: stats.manualOverride,
        manualValues: stats.manualValues,
        displayStats: stats.getDisplayStats(),
        lastUpdated: stats.lastUpdated
      }
    });
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed statistics',
      error: error.message
    });
  }
};
