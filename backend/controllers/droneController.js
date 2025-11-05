// backend/controllers/droneController.js
const Drone = require('../models/Drone');

// @desc    Get all drones
// @route   GET /api/drones
// @access  Public
const getAllDrones = async (req, res) => {
  try {
    const drones = await Drone.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: drones.length,
      data: drones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get drones by role
// @route   GET /api/drones/role/:role
// @access  Public
const getDronesByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    const validRoles = ['Forward', 'Center', 'Defender', 'Keeper'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    const drones = await Drone.find({ role, status: 'Active' }).sort({ droneId: 1 });

    res.status(200).json({
      success: true,
      role,
      count: drones.length,
      data: drones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single drone
// @route   GET /api/drones/:id
// @access  Public
const getDrone = async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found'
      });
    }

    res.status(200).json({
      success: true,
      data: drone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create drone
// @route   POST /api/drones
// @access  Admin
const createDrone = async (req, res) => {
  try {
    const { droneId, role, specifications, status } = req.body;

    // Check if drone ID already exists
    const existingDrone = await Drone.findOne({ droneId });
    if (existingDrone) {
      return res.status(400).json({
        success: false,
        message: `Drone with ID ${droneId} already exists`
      });
    }

    // Create drone (pre-save hook will auto-fill specs based on role)
    const drone = await Drone.create({
      droneId,
      role,
      specifications: specifications || {},
      status: status || 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Drone created successfully',
      data: drone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update drone
// @route   PUT /api/drones/:id
// @access  Admin
const updateDrone = async (req, res) => {
  try {
    const { droneId, role, specifications, status } = req.body;

    let drone = await Drone.findById(req.params.id);

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found'
      });
    }

    // Check if new droneId conflicts with existing
    if (droneId && droneId !== drone.droneId) {
      const existingDrone = await Drone.findOne({ droneId });
      if (existingDrone) {
        return res.status(400).json({
          success: false,
          message: `Drone with ID ${droneId} already exists`
        });
      }
    }

    // Update fields
    if (droneId) drone.droneId = droneId;
    if (role) drone.role = role;
    if (specifications) drone.specifications = { ...drone.specifications, ...specifications };
    if (status) drone.status = status;

    await drone.save();

    res.status(200).json({
      success: true,
      message: 'Drone updated successfully',
      data: drone
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete drone
// @route   DELETE /api/drones/:id
// @access  Admin
const deleteDrone = async (req, res) => {
  try {
    const drone = await Drone.findById(req.params.id);

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: 'Drone not found'
      });
    }

    await drone.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Drone deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get role specifications
// @route   GET /api/drones/specs/roles
// @access  Public
const getRoleSpecs = async (req, res) => {
  try {
    const roleSpecs = Drone.ROLE_SPECS;

    res.status(200).json({
      success: true,
      data: roleSpecs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllDrones,
  getDronesByRole,
  getDrone,
  createDrone,
  updateDrone,
  deleteDrone,
  getRoleSpecs
};