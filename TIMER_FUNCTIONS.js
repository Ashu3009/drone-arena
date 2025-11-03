// ADD THESE FUNCTIONS TO backend/controllers/matchController.js (after updateScore function, before endRound)

// @desc    Pause round timer
// @route   PUT /api/matches/:matchId/rounds/:roundNumber/pause
const pauseTimer = async (req, res) => {
  try {
    const { matchId, roundNumber } = req.params;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const round = match.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ success: false, message: 'Round not found' });
    if (round.timerStatus !== 'running') return res.status(400).json({ success: false, message: 'Timer is not running' });

    const now = new Date();
    round.elapsedTime = Math.floor((now - round.startTime) / 1000);
    round.pausedAt = now;
    round.timerStatus = 'paused';
    await match.save();

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Resume round timer
// @route   PUT /api/matches/:matchId/rounds/:roundNumber/resume
const resumeTimer = async (req, res) => {
  try {
    const { matchId, roundNumber } = req.params;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const round = match.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ success: false, message: 'Round not found' });
    if (round.timerStatus !== 'paused') return res.status(400).json({ success: false, message: 'Timer is not paused' });

    const pauseDuration = new Date() - round.pausedAt;
    round.startTime = new Date(round.startTime.getTime() + pauseDuration);
    round.pausedAt = null;
    round.timerStatus = 'running';
    await match.save();

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset round timer
// @route   PUT /api/matches/:matchId/rounds/:roundNumber/reset
const resetTimer = async (req, res) => {
  try {
    const { matchId, roundNumber } = req.params;
    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });

    const round = match.rounds.find(r => r.roundNumber === parseInt(roundNumber));
    if (!round) return res.status(404).json({ success: false, message: 'Round not found' });

    round.startTime = new Date();
    round.elapsedTime = 0;
    round.pausedAt = null;
    round.timerStatus = 'running';
    await match.save();

    res.json({ success: true, data: match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================================
// ALSO ADD TO module.exports (at end of matchController.js):
// ========================================
/*
module.exports = {
  getAllMatches,
  getMatchById,
  createMatch,
  deleteMatch,
  startRound,
  pauseTimer,     // ADD THIS
  resumeTimer,    // ADD THIS
  resetTimer,     // ADD THIS
  updateScore,
  endRound,
  completeMatch,
  registerDrones,
  setCurrentMatch,
  getCurrentMatch,
  startAllDrones,
  stopAllDrones,
  resetAllDrones
};
*/

// ========================================
// ADD ROUTES TO backend/routes/matchRoutes.js:
// ========================================
/*
const { protect } = require('../middleware/auth');

router.put('/:matchId/rounds/:roundNumber/pause', protect, pauseTimer);
router.put('/:matchId/rounds/:roundNumber/resume', protect, resumeTimer);
router.put('/:matchId/rounds/:roundNumber/reset', protect, resetTimer);
*/
