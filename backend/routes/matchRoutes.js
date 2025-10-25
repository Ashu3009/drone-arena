// backend/routes/matchRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllMatches,
  getMatchById,
  createMatch,
  startRound,
  updateScore,
  endRound,
  completeMatch
} = require('../controllers/matchController');

router.route('/')
  .get(getAllMatches)
  .post(createMatch);

router.get('/:matchId', getMatchById);
router.put('/:matchId/start-round', startRound);
router.put('/:matchId/update-score', updateScore);
router.put('/:matchId/end-round', endRound);
router.put('/:matchId/complete', completeMatch);

module.exports = router;