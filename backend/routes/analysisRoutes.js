// backend/routes/analysisRoutes.js
const express = require('express');
const router = express.Router();
const { analyzeRound } = require('../controllers/analysisController');
const { protect } = require('../middleware/auth');

// Analyze round performance (admin only)
router.get('/round/:matchId/:roundNumber', protect, analyzeRound);

module.exports = router;
