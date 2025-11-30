// backend/controllers/userAuthController.js - Public User Authentication
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail
} = require('../services/emailService');

// ============================================
// UTILITY: Generate JWT Token
// ============================================
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'user' }, // type: 'user' vs 'admin'
    process.env.JWT_SECRET || 'dronenova-secret-key-2024',
    { expiresIn: '7d' } // Token valid for 7 days
  );
};

// ============================================
// @route   POST /api/users/auth/signup
// @desc    Register new user with email/password
// @access  Public
// ============================================
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, location, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      location,
      authMethod: 'email',
      role: role || 'player', // Default to player
      emailVerified: false
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    // Generate JWT
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please check your email to verify.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          photo: user.photo
        },
        token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message
    });
  }
};

// ============================================
// @route   POST /api/users/auth/login
// @desc    Login user with email/password
// @access  Public
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user used Google OAuth
    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        message: 'Please sign in with Google'
      });
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate JWT
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          photo: user.photo,
          location: user.location
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// ============================================
// @route   POST /api/users/auth/google
// @desc    Google OAuth login/signup
// @access  Public
// ============================================
const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, photo } = req.body;

    // Validation
    if (!googleId || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Google account information'
      });
    }

    // Check if user exists with Google ID
    let user = await User.findByGoogleId(googleId);

    // If not found by Google ID, check by email (user might have signed up with email first)
    if (!user) {
      user = await User.findByEmail(email);
    }

    if (user) {
      // Existing user - update Google ID if not set
      if (!user.googleId && user.authMethod === 'email') {
        // Link Google account to existing email account
        user.googleId = googleId;
        user.authMethod = 'google';
        user.emailVerified = true; // Google emails are verified
        if (!user.photo && photo) {
          user.photo = photo;
        }
        await user.save();
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

    } else {
      // New user - create account
      user = await User.create({
        name,
        email,
        googleId,
        photo,
        authMethod: 'google',
        emailVerified: true, // Google accounts are pre-verified
        role: 'player'
      });
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'Account created successfully' : 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          photo: user.photo,
          location: user.location
        },
        token
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error with Google authentication',
      error: error.message
    });
  }
};

// ============================================
// @route   GET /api/users/auth/verify-email/:token
// @desc    Verify user email
// @access  Public
// ============================================
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check expiry
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() }
    }).select('+verificationToken +verificationTokenExpiry');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now access all features.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified
        }
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

// ============================================
// @route   POST /api/users/auth/resend-verification
// @desc    Resend email verification
// @access  Private (user must be logged in)
// ============================================
const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending verification email',
      error: error.message
    });
  }
};

// ============================================
// @route   GET /api/users/auth/me
// @desc    Get current logged-in user
// @access  Private
// ============================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('teamId', 'name color logo')
      .populate('organizerProfile.assignedTournaments', 'name startDate status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          photo: user.photo,
          phone: user.phone,
          location: user.location,
          playerProfile: user.playerProfile,
          teamId: user.teamId,
          organizerProfile: user.organizerProfile,
          stats: user.stats,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// ============================================
// @route   POST /api/users/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
// ============================================
const logout = async (req, res) => {
  try {
    // In JWT, logout is typically handled client-side by removing the token
    // We can optionally log the logout event

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

// ============================================
// @route   POST /api/users/auth/forgot-password
// @desc    Request password reset email
// @access  Public
// ============================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists or not (security)
      return res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Check if user used Google OAuth
    if (user.authMethod === 'google') {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please login with Google.'
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing password reset request',
      error: error.message
    });
  }
};

// ============================================
// @route   POST /api/users/auth/reset-password/:token
// @desc    Reset password with token
// @access  Public
// ============================================
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the token from URL
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check expiry
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpiry');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

module.exports = {
  signup,
  login,
  googleAuth,
  verifyEmail,
  resendVerification,
  getMe,
  logout,
  forgotPassword,
  resetPassword
};
