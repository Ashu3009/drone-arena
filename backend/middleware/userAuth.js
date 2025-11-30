// backend/middleware/userAuth.js - Protect Public User Routes
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ============================================
// Protect User Routes - Verify JWT Token
// ============================================
const protectUser = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please login to access this route.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'dronenova-secret-key-2024'
      );

      // Check token type (must be 'user', not 'admin')
      if (decoded.type !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'Invalid token type. Please use user authentication.'
        });
      }

      // Get user from token
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Token may be invalid.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated.'
        });
      }

      // Attach user to request object
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// ============================================
// Require Email Verification
// ============================================
const requireEmailVerification = (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email to access this feature.',
      emailVerified: false
    });
  }
  next();
};

// ============================================
// Restrict to Specific Roles
// ============================================
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `This action is only available for: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// ============================================
// Check Tournament Access (for Organizers)
// ============================================
const checkTournamentAccess = (req, res, next) => {
  const { tournamentId } = req.params;

  // Admin-level check would go here if needed
  // For now, just check if user is organizer and has access

  if (req.user.role === 'tournament_organizer') {
    if (!req.user.hasAccessToTournament(tournamentId)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this tournament.'
      });
    }
  }

  next();
};

module.exports = {
  protectUser,
  requireEmailVerification,
  restrictTo,
  checkTournamentAccess
};
