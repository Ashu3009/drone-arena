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

router.route('/')
  .get(getAllTournaments)
  .post(createTournament);

router.route('/:id')
  .get(getTournamentById)
  .put(updateTournament)
  .delete(deleteTournament);

router.post('/:id/register', registerTeamToTournament);

module.exports = router;