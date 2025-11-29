const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStats,
  manualOverride,
  resetToAuto,
  getDetailsForAdmin
} = require('../controllers/siteStatsController');

// Public route - get current stats
router.get('/', getStats);

// Admin routes - require authentication
router.get('/details', protect, getDetailsForAdmin);
router.put('/manual-override', protect, manualOverride);
router.put('/reset', protect, resetToAuto);

module.exports = router;
