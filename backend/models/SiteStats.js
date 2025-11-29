const mongoose = require('mongoose');

const siteStatsSchema = new mongoose.Schema({
  // Auto-calculated stats
  totalMatches: {
    type: Number,
    default: 0,
    description: 'Total matches played (auto-calculated)'
  },
  activeTeams: {
    type: Number,
    default: 0,
    description: 'Total active teams (auto-calculated)'
  },
  activeDrones: {
    type: Number,
    default: 16,
    description: 'Active drones in system (default 16)'
  },
  totalTournaments: {
    type: Number,
    default: 0,
    description: 'Total tournaments (auto-calculated)'
  },

  // Manual override flags
  manualOverride: {
    totalMatches: { type: Boolean, default: false },
    activeTeams: { type: Boolean, default: false },
    activeDrones: { type: Boolean, default: false },
    totalTournaments: { type: Boolean, default: false }
  },

  // Manual override values (used when override is true)
  manualValues: {
    totalMatches: { type: Number, default: 0 },
    activeTeams: { type: Number, default: 0 },
    activeDrones: { type: Number, default: 16 },
    totalTournaments: { type: Number, default: 0 }
  },

  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Only allow one document (singleton pattern)
siteStatsSchema.statics.getInstance = async function() {
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({});
  }
  return stats;
};

// Calculate stats from database
siteStatsSchema.methods.calculateStats = async function() {
  const Match = mongoose.model('Match');
  const Team = mongoose.model('Team');
  const Tournament = mongoose.model('Tournament');

  // Auto-calculate
  const totalMatches = await Match.countDocuments();
  const activeTeams = await Team.countDocuments();
  const totalTournaments = await Tournament.countDocuments();

  // Update only if not manually overridden
  if (!this.manualOverride.totalMatches) {
    this.totalMatches = totalMatches;
  }
  if (!this.manualOverride.activeTeams) {
    this.activeTeams = activeTeams;
  }
  if (!this.manualOverride.totalTournaments) {
    this.totalTournaments = totalTournaments;
  }

  this.lastUpdated = new Date();
  await this.save();
  return this;
};

// Get final display values (manual override or auto-calculated)
siteStatsSchema.methods.getDisplayStats = function() {
  return {
    totalMatches: this.manualOverride.totalMatches ? this.manualValues.totalMatches : this.totalMatches,
    activeTeams: this.manualOverride.activeTeams ? this.manualValues.activeTeams : this.activeTeams,
    activeDrones: this.manualOverride.activeDrones ? this.manualValues.activeDrones : this.activeDrones,
    totalTournaments: this.manualOverride.totalTournaments ? this.manualValues.totalTournaments : this.totalTournaments,
    lastUpdated: this.lastUpdated
  };
};

module.exports = mongoose.model('SiteStats', siteStatsSchema);
