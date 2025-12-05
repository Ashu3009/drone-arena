// backend/models/ESPDevice.js
const mongoose = require('mongoose');

const espDeviceSchema = new mongoose.Schema({
  macAddress: {
    type: String,
    required: [true, 'MAC address is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  droneId: {
    type: String,
    enum: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8',
           'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'],
    required: [true, 'Drone ID is required']
  },
  role: {
    type: String,
    enum: ['Forward', 'Striker', 'Defender', 'Keeper'],
    required: [true, 'Role is required']
  },
  nickname: {
    type: String,
    trim: true,
    default: ''
  },
  deviceType: {
    type: String,
    enum: ['ESP32-Dev', 'ESP32-CAM'],
    default: 'ESP32-Dev'
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    default: ''
  },
  firmwareVersion: {
    type: String,
    default: '1.0.0'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
espDeviceSchema.index({ macAddress: 1 });
espDeviceSchema.index({ droneId: 1 });
espDeviceSchema.index({ status: 1 });

// Virtual for team color (R = Red, B = Blue)
espDeviceSchema.virtual('teamColor').get(function() {
  return this.droneId.startsWith('R') ? 'Red' : 'Blue';
});

// Method to update last seen and status
espDeviceSchema.methods.updateStatus = async function(status = 'online') {
  this.status = status;
  this.lastSeen = new Date();
  await this.save();
};

module.exports = mongoose.model('ESPDevice', espDeviceSchema);
