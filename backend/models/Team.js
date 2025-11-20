// backend/models/Team.js
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide team name'],
    trim: true,
    unique: true
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null // OPTIONAL: null = independent/corporate team
  },
  teamType: {
    type: String,
    enum: ['School', 'Corporate', 'Independent'],
    default: 'School'
  },
  location: {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    }
  },
  color: {
    type: String,
    required: [true, 'Please provide team color'],
    default: '#3B82F6'
  },
  captain: {
    type: String,
    trim: true
  },
  members: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['Forward', 'Center', 'Defender', 'Keeper', 'All-rounder'],
      required: true
    },
    contactEmail: {
      type: String,
      trim: true
    },
    isPrimary: {
      type: Boolean,
      default: true
    }
  }],
  wins: {
    type: Number,
    default: 0
  },
  losses: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);