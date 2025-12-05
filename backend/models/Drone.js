// backend/models/Drone.js
const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  droneId: {
    type: String,
    required: [true, 'Please provide drone ID'],
    unique: true,
    trim: true
  },
  role: {
    type: String,
    required: [true, 'Please provide drone role'],
    enum: ['Forward', 'Striker', 'Defender', 'Keeper'],
    default: 'Forward'
  },
  specifications: {
    speed: {
      type: Number,
      default: 100,
      min: 0,
      max: 200
    },
    agility: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    stability: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    batteryCapacity: {
      type: Number,
      default: 2000,
      min: 1000,
      max: 5000
    },
    weight: {
      type: Number,
      default: 250,
      min: 100,
      max: 500
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Predefined specifications for each role
droneSchema.statics.ROLE_SPECS = {
  Forward: {
    speed: 150,
    agility: 90,
    stability: 70,
    batteryCapacity: 2200,
    weight: 250
  },
  Striker: {
    speed: 160,
    agility: 95,
    stability: 65,
    batteryCapacity: 2100,
    weight: 240
  },
  Defender: {
    speed: 100,
    agility: 75,
    stability: 90,
    batteryCapacity: 2800,
    weight: 310
  },
  Keeper: {
    speed: 120,
    agility: 85,
    stability: 80,
    batteryCapacity: 2500,
    weight: 280
  }
};

// Pre-save hook to auto-fill specs based on role if not provided
droneSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    const roleSpecs = droneSchema.statics.ROLE_SPECS[this.role];
    if (roleSpecs) {
      // Only auto-fill if specifications are default/empty
      if (!this.specifications.speed || this.specifications.speed === 100) {
        this.specifications = roleSpecs;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Drone', droneSchema);