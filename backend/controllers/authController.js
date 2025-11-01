// backend/controllers/authController.js
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'drone-arena-secret-key-2025', {
    expiresIn: '30d'  // Token expires in 30 days
  });
};

// @desc    Admin login
// @route   POST /api/auth/login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Find admin (include password for comparison)
    const admin = await Admin.findOne({ username }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Compare passwords
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(admin._id);

    console.log(`✅ Admin logged in: ${admin.username}`);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    // req.admin is set by auth middleware
    const admin = await Admin.findById(req.admin.id);

    res.json({
      success: true,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        isActive: admin.isActive
      }
    });

  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin logout (optional - frontend can just remove token)
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  try {
    console.log(`✅ Admin logged out: ${req.admin?.username || 'Unknown'}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Error in logout:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create first admin (use this once to create admin account)
// @route   POST /api/auth/create-admin
const createAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists'
      });
    }

    // Create admin
    const admin = await Admin.create({
      username,
      password,
      role: 'admin'
    });

    console.log(`✅ Admin created: ${admin.username}`);

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Error in createAdmin:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  login,
  getMe,
  logout,
  createAdmin
};
