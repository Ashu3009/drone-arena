// backend/routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getTeamStanding,
  updateStandings
} = require('../controllers/leaderboardController');

// Get tournament leaderboard
router.get('/:tournamentId', getLeaderboard);

// Get specific team standing
router.get('/:tournamentId/:teamId', getTeamStanding);

// Update standings (internal API)
router.post('/update', updateStandings);

module.exports = router;