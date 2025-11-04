// backend/routes/droneReportRoutes.js
const express = require('express');
const router = express.Router();
const DroneReport = require('../models/DroneReport');
const { protect } = require('../middleware/auth');

// @desc    Get all reports for a tournament
// @route   GET /api/reports/tournament/:tournamentId
// @access  Public
router.get('/tournament/:tournamentId', async (req, res) => {
  try {
    const reports = await DroneReport.find({ tournament: req.params.tournamentId })
      .populate('match', 'teamA teamB')
      .populate('team', 'name color')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all reports for a match
// @route   GET /api/reports/match/:matchId
// @access  Public
router.get('/match/:matchId', async (req, res) => {
  try {
    const reports = await DroneReport.find({ match: req.params.matchId })
      .populate('team', 'name color')
      .sort({ roundNumber: 1, droneId: 1 });

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get report by ID
// @route   GET /api/reports/:reportId
// @access  Public
router.get('/:reportId', async (req, res) => {
  try {
    const report = await DroneReport.findById(req.params.reportId)
      .populate('match', 'teamA teamB')
      .populate('team', 'name color')
      .populate('tournament', 'name');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
