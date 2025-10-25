// backend/routes/droneLogRoutes.js

const express = require('express');
const router = express.Router();
const {
  receiveTelemetry,
  getMatchLogs,
  clearMatchLogs
} = require('../controllers/droneLogController');

// ESP32 sends data here
router.post('/', receiveTelemetry);

// Get logs for a match
router.get('/:matchId', getMatchLogs);

// Clear logs (testing only)
router.delete('/:matchId', clearMatchLogs);

module.exports = router;