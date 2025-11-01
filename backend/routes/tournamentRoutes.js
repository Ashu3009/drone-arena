// backend/routes/tournamentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  registerTeamToTournament
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);

// Protected routes (admin only)
router.post('/', protect, createTournament);
router.put('/:id', protect, updateTournament);
router.delete('/:id', protect, deleteTournament);
router.post('/:id/register', protect, registerTeamToTournament);

module.exports = router;