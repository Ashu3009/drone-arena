// backend/routes/droneRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllDrones,
  getDronesByRole,
  getDrone,
  createDrone,
  updateDrone,
  deleteDrone,
  getRoleSpecs
} = require('../controllers/droneController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllDrones);
router.get('/specs/roles', getRoleSpecs);
router.get('/role/:role', getDronesByRole);
router.get('/:id', getDrone);

// Protected routes (Admin only)
router.post('/', protect, createDrone);
router.put('/:id', protect, updateDrone);
router.delete('/:id', protect, deleteDrone);

module.exports = router;