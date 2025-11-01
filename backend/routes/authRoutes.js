// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { login, getMe, logout, createAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/create-admin', createAdmin);  // Use this once to create first admin

// Protected routes (require authentication)
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
