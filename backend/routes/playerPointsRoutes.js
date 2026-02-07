// backend/routes/playerPointsRoutes.js
// NEW ROUTES - Player Points Management
const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams to access :tournamentId
const {
  savePlayerPoints,
  getMatchPlayerPoints,
  getTournamentPlayerPoints,
  calculateTournamentAwards,
  getPlayerStats,
  deleteMatchPlayerPoints,
  autoGenerateRoundPoints
} = require('../controllers/playerPointsController');
const { protect } = require('../middleware/auth'); // Admin authentication

// Public routes
router.get('/', getTournamentPlayerPoints);
router.get('/match/:matchId', getMatchPlayerPoints);
router.get('/awards/calculate', calculateTournamentAwards);
router.get('/player-stats/:playerName', getPlayerStats);

// Protected routes (Admin only)
router.post('/', protect, savePlayerPoints);
router.post('/auto-generate', protect, autoGenerateRoundPoints);
router.delete('/match/:matchId', protect, deleteMatchPlayerPoints);

module.exports = router;
