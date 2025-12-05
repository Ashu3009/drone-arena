// backend/models/User.js - Public User Model (Players, Captains, Organizers)
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ============================================
  // AUTHENTICATION
  // ============================================
  authMethod: {
    type: String,
    enum: ['email', 'google'],
    required: true,
    default: 'email'
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  googleId: {
    type: String,
    sparse: true, // Allows null values with unique constraint
    unique: true
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },

  // ============================================
  // VERIFICATION
  // ============================================
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    select: false
  },
  verificationTokenExpiry: {
    type: Date,
    select: false
  },

  // ============================================
  // USER ROLE
  // ============================================
  role: {
    type: String,
    enum: ['player', 'team_captain', 'tournament_organizer'],
    default: 'player'
  },

  // ============================================
  // PROFILE (Common for all roles)
  // ============================================
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  photo: {
    type: String, // URL from Google or uploaded file path
    default: null
  },
  phone: {
    type: String,
    sparse: true, // Optional but unique if provided
    match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
  },
  location: {
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'India' }
  },
  dateOfBirth: {
    type: Date
  },

  // ============================================
  // PLAYER-SPECIFIC PROFILE
  // ============================================
  playerProfile: {
    preferredRole: {
      type: String,
      enum: ['Forward', 'Striker', 'Defender', 'Keeper', null],
      default: null
    },
    alternateRoles: [{
      type: String,
      enum: ['Forward', 'Striker', 'Defender', 'Keeper']
    }],
    skillLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', null],
      default: null
    },
    experienceYears: {
      type: Number,
      min: 0,
      default: 0
    },
    availableAsSubstitute: {
      type: Boolean,
      default: false
    }
  },

  // ============================================
  // TEAM CAPTAIN - Reference to Team
  // ============================================
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },

  // ============================================
  // TOURNAMENT ORGANIZER - Specific Fields
  // ============================================
  organizerProfile: {
    assignedTournaments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    }],
    permissions: {
      canCreateTournament: { type: Boolean, default: true },
      canEditTournament: { type: Boolean, default: true },
      canDeleteTournament: { type: Boolean, default: false },
      canApproveTeams: { type: Boolean, default: true },
      canRejectTeams: { type: Boolean, default: true },
      canScheduleMatches: { type: Boolean, default: true },
      canStartRounds: { type: Boolean, default: true },
      canEndRounds: { type: Boolean, default: true },
      canViewReports: { type: Boolean, default: true },
      canDownloadReports: { type: Boolean, default: true }
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin', // Which admin created this organizer
      default: null
    }
  },

  // ============================================
  // PLAYER STATS (Auto-calculated)
  // ============================================
  stats: {
    matchesPlayed: { type: Number, default: 0 },
    totalGoals: { type: Number, default: 0 },
    totalAssists: { type: Number, default: 0 },
    avgPerformance: { type: Number, default: 0 },
    tournamentsParticipated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    }]
  },

  // ============================================
  // SECURITY & TRACKING
  // ============================================
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpiry: {
    type: Date,
    select: false
  }

}, {
  timestamps: true // createdAt, updatedAt
});

// ============================================
// INDEXES for Performance
// ============================================
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'organizerProfile.assignedTournaments': 1 });

// ============================================
// PRE-SAVE MIDDLEWARE - Hash Password
// ============================================
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and auth method is email
  if (!this.isModified('password') || this.authMethod === 'google') {
    return next();
  }

  // Password is required for email auth
  if (this.authMethod === 'email' && !this.password) {
    return next(new Error('Password is required for email authentication'));
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

// Compare password for login
userSchema.methods.comparePassword = async function(enteredPassword) {
  if (this.authMethod !== 'email') {
    throw new Error('Password comparison not available for OAuth users');
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate email verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  this.verificationToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Token expires in 24 hours
  this.verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000;

  return token; // Return unhashed token to send via email
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Token expires in 1 hour
  this.passwordResetExpiry = Date.now() + 60 * 60 * 1000;

  return token;
};

// Check if user is organizer
userSchema.methods.isOrganizer = function() {
  return this.role === 'tournament_organizer';
};

// Check if user has access to specific tournament (for organizers)
userSchema.methods.hasAccessToTournament = function(tournamentId) {
  if (this.role !== 'tournament_organizer') return false;
  return this.organizerProfile.assignedTournaments.some(
    id => id.toString() === tournamentId.toString()
  );
};

// ============================================
// STATIC METHODS
// ============================================

// Find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Find user by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

module.exports = mongoose.model('User', userSchema);
