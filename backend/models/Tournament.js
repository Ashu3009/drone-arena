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
  url: {
    type: String,
    trim: true,
    default: ''
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
  },

  // Registered Teams
  registeredTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],

  // Tournament Settings
  settings: {
    matchType: {
      type: String,
      enum: ['Best of 2', 'Best of 3'],
      default: 'Best of 2'
    },
    hasTiebreaker: {
      type: Boolean,
      default: true  // Round 3 if draw in Best of 2
    },
    roundDuration: {
      type: Number,
      default: 3,  // minutes
      min: 1,
      max: 10
    }
  },

  // Man of the Tournament
  manOfTheTournament: {
    playerName: {
      type: String,
      trim: true
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    photo: {
      type: String  // URL or file path
    },
    stats: {
      goals: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      matchesPlayed: { type: Number, default: 0 }
    }
  },

  // Tournament Awards (Auto-calculated from match data)
  awards: {
    bestStriker: {
      playerName: { type: String, trim: true },
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      photo: { type: String },
      goals: { type: Number, default: 0 }
    },
    bestForward: {
      playerName: { type: String, trim: true },
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      photo: { type: String },
      assists: { type: Number, default: 0 }
    },
    bestDefender: {
      playerName: { type: String, trim: true },
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
      photo: { type: String },
      saves: { type: Number, default: 0 }
    }
  },

  // Location Information
  location: {
    city: {
      type: String,
      required: [true, 'Tournament city is required'],
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
    },
    venue: {
      type: String,
      trim: true,
      maxlength: [200, 'Venue name cannot exceed 200 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters']
    }
  },

  // Prize & Awards Information
  prizePool: {
    totalAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP']
    },
    prizes: [{
      position: {
        type: String,
        required: true,
        enum: ['1st', '2nd', '3rd', 'Participation']
      },
      amount: {
        type: Number,
        default: 0,
        min: 0
      },
      description: {
        type: String,
        trim: true,
        maxlength: [200, 'Prize description cannot exceed 200 characters']
      }
    }]
  },

  // Winners (Populated after tournament completion)
  winners: {
    champion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    runnerUp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    thirdPlace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    }
  },

  // Media & Branding
  media: {
    bannerImage: {
      type: String, // URL
      default: ''
    },
    logoImage: {
      type: String, // URL
      default: ''
    },
    gallery: [{
      type: String // Array of image URLs
    }],
    socialLinks: {
      website: {
        type: String,
        trim: true
      },
      facebook: {
        type: String,
        trim: true
      },
      twitter: {
        type: String,
        trim: true
      },
      instagram: {
        type: String,
        trim: true
      },
      youtube: {
        type: String,
        trim: true
      }
    }
  },

  // Organizer Information
  organizer: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    }
  },

  // Registration Settings
  registration: {
    isOpen: {
      type: Boolean,
      default: true
    },
    deadline: {
      type: Date
    },
    fee: {
      type: Number,
      default: 0,
      min: 0
    }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Index for faster queries
tournamentSchema.index({ status: 1, startDate: -1 });
tournamentSchema.index({ 'location.city': 1, 'location.state': 1 });

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