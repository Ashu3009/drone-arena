// backend/routes/droneReportRoutes.js
const express = require('express');
const router = express.Router();
const {
  getReportsByTournament,
  getTournamentTeamAggregates,
  getTournamentPilotAggregates,
  getReportsByMatch,
  getReportById,
  downloadReportPDF
} = require('../controllers/droneReportController');
const { protect } = require('../middleware/auth');

// ========================================
// PUBLIC ROUTES (No authentication needed)
// ========================================
router.get('/public/tournaments/:tournamentId/teams', getTournamentTeamAggregates);
router.get('/public/tournaments/:tournamentId/pilots', getTournamentPilotAggregates);
router.get('/public/:reportId/pdf', downloadReportPDF);
router.get('/public/:reportId', getReportById);

// ========================================
// ADMIN-PROTECTED ROUTES
// ========================================
router.get('/tournaments', protect, getReportsByTournament);
router.get('/tournaments/:tournamentId/teams', protect, getTournamentTeamAggregates);
router.get('/tournaments/:tournamentId/pilots', protect, getTournamentPilotAggregates);
router.get('/matches/:matchId', protect, getReportsByMatch);
router.get('/:reportId/pdf', protect, downloadReportPDF); // PDF download route (must be before /:reportId)
router.get('/:reportId', protect, getReportById);

module.exports = router;
