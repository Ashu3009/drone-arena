// backend/models/School.js
const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'School name cannot exceed 100 characters']
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
  contactInfo: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      trim: true
    },
    coordinatorName: {
      type: String,
      trim: true
    }
  },
  established: {
    type: Number,
    min: [1800, 'Invalid establishment year'],
    max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
  },
  logo: {
    type: String, // URL to logo image
    default: ''
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  // Statistics
  totalTeams: {
    type: Number,
    default: 0,
    min: 0
  },
  tournamentsParticipated: {
    type: Number,
    default: 0,
    min: 0
  },
  wins: {
    type: Number,
    default: 0,
    min: 0
  },
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Index for faster queries
schoolSchema.index({ name: 1, 'location.city': 1 });

// Virtual to get all teams (will be populated later)
schoolSchema.virtual('teams', {
  ref: 'Team',
  localField: '_id',
  foreignField: 'school'
});

// Method to increment total teams
schoolSchema.methods.incrementTeams = function() {
  this.totalTeams += 1;
  return this.save();
};

// Method to decrement total teams
schoolSchema.methods.decrementTeams = function() {
  if (this.totalTeams > 0) {
    this.totalTeams -= 1;
    return this.save();
  }
};

module.exports = mongoose.model('School', schoolSchema);
