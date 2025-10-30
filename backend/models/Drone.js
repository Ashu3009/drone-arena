// backend/models/Drone.js
const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema({
  droneNumber: { 
    type: Number, 
    required: true, 
    unique: true,
    min: 1,
    max: 16 
  }, // Physical drone number (1-16)
  
  name: { 
    type: String, 
    required: true 
  }, // "Red Dragon 1" ya "Blue Falcon 5"
  
  status: { 
    type: String, 
    enum: ['available', 'in_use', 'maintenance', 'charging'],
    default: 'available'
  },
  
  batteryLevel: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 100
  },
  
  lastUsed: Date,
  
  totalFlightTime: { 
    type: Number, 
    default: 0 
  }, // in seconds
  
  hardware: {
    espMacAddress: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Drone', droneSchema);