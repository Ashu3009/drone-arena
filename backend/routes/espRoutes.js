// backend/routes/espRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getAllESPs,
  getAvailableESPs,
  registerESP,
  announceESP,
  heartbeat,
  updateESP,
  deleteESP,
  whoAmI,
  checkOfflineESPs
} = require('../controllers/espController');

// ========================================
// PUBLIC ROUTES (ESP devices access these)
// ========================================

// ESP announces itself when it powers on
router.get('/announce', announceESP);

// ESP queries "Who am I?" to get its drone ID and role
router.get('/whoami', whoAmI);

// ESP sends heartbeat to keep status online
router.post('/heartbeat', heartbeat);

// ========================================
// PROTECTED ROUTES (Admin only)
// ========================================

// Get all registered ESPs
router.get('/', protect, getAllESPs);

// Get available (online) ESPs
router.get('/available', protect, getAvailableESPs);

// Register new ESP device
router.post('/register', protect, registerESP);

// Update ESP device
router.put('/:id', protect, updateESP);

// Delete ESP device
router.delete('/:id', protect, deleteESP);

// Check and mark offline ESPs
router.post('/check-offline', protect, checkOfflineESPs);

module.exports = router;
