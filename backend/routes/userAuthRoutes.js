// backend/routes/userAuthRoutes.js - Public User Auth Routes
const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  getMe,
  logout,
  forgotPassword,
  resetPassword
} = require('../controllers/userAuthController');
const { protectUser } = require('../middleware/userAuth');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// @route   POST /api/users/auth/signup
// @desc    Register with email/password
router.post('/signup', signup);

// @route   POST /api/users/auth/login
// @desc    Login with email/password
router.post('/login', login);

// @route   POST /api/users/auth/google
// @desc    Google OAuth login/signup
router.post('/google', googleAuth);

// @route   GET /api/users/auth/verify-email/:token
// @desc    Verify email address
router.get('/verify-email/:token', verifyEmail);

// @route   POST /api/users/auth/forgot-password
// @desc    Request password reset email
router.post('/forgot-password', forgotPassword);

// @route   POST /api/users/auth/reset-password/:token
// @desc    Reset password with token
router.post('/reset-password/:token', resetPassword);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// @route   GET /api/users/auth/me
// @desc    Get current user profile
router.get('/me', protectUser, getMe);

// @route   POST /api/users/auth/resend-verification
// @desc    Resend verification email
router.post('/resend-verification', protectUser, resendVerification);

// @route   POST /api/users/auth/logout
// @desc    Logout user
router.post('/logout', protectUser, logout);

module.exports = router;
