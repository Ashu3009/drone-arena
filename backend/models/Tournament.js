// backend/models/Tournament.js
const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    maxlength: [100, 'Tournament name cannot exceed 100 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['upcoming', 'ongoing', 'completed'],
      message: 'Status must be either upcoming, ongoing, or completed'
    },
    default: 'upcoming'
  },
  maxTeams: {
    type: Number,
    default: 16,
    min: [2, 'At least 2 teams required'],
    max: [32, 'Maximum 32 teams allowed']
  },
  currentTeams: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Index for faster queries
tournamentSchema.index({ status: 1, startDate: -1 });

// Virtual field to check if tournament is full
tournamentSchema.virtual('isFull').get(function() {
  return this.currentTeams >= this.maxTeams;
});

// Method to check if tournament is active
tournamentSchema.methods.isActive = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
};

// Pre-save middleware to auto-update status based on dates
tournamentSchema.pre('save', function(next) {
  const now = new Date();
  
  if (this.startDate > now) {
    this.status = 'upcoming';
  } else if (this.endDate < now) {
    this.status = 'completed';
  } else {
    this.status = 'ongoing';
  }
  
  next();
});

module.exports = mongoose.model('Tournament', tournamentSchema);