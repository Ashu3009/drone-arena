// backend/routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllMatches,
  getMatchById,
  createMatch,
  deleteMatch,
  startRound,
  pauseTimer,
  resumeTimer,
  resetTimer,
  updateScore,
  endRound,
  completeMatch,
  registerDrones,
  setCurrentMatch,
  getCurrentMatch,
  startAllDrones,
  stopAllDrones,
  resetAllDrones,
  setManOfTheMatch
} = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllMatches);
router.get('/current', getCurrentMatch);
router.get('/:matchId', getMatchById);

// Protected routes (admin only)
router.post('/', protect, createMatch);
router.delete('/:matchId', protect, deleteMatch);
router.put('/:matchId/start-round', protect, startRound);
router.put('/:matchId/update-score', protect, updateScore);
router.put('/:matchId/end-round', protect, endRound);
router.put('/:matchId/complete', protect, completeMatch);
router.post('/:matchId/register-drones', protect, registerDrones);
router.put('/:matchId/set-current', protect, setCurrentMatch);

// Timer control routes (admin only)
router.put('/:matchId/rounds/:roundNumber/pause', protect, pauseTimer);
router.put('/:matchId/rounds/:roundNumber/resume', protect, resumeTimer);
router.put('/:matchId/rounds/:roundNumber/reset', protect, resetTimer);

// Batch drone commands (admin only)
router.post('/:matchId/start-all-drones', protect, startAllDrones);
router.post('/:matchId/stop-all-drones', protect, stopAllDrones);
router.post('/:matchId/reset-all-drones', protect, resetAllDrones);

// Man of the Match (admin only)
router.put('/:matchId/man-of-match', protect, setManOfTheMatch);

module.exports = router;