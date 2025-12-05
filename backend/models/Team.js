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
    photo: {
      type: String, // File path for member photo
      default: null
    },
    role: {
      type: String,
      enum: ['Forward', 'Striker', 'Defender', 'Keeper', 'Substitute'],
      required: true
    },
    jerseyNumber: {
      type: Number,
      min: 1,
      max: 99
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