// backend/routes/schoolRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  filterSchools,
  getSchoolStats
} = require('../controllers/schoolController');

const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllSchools);
router.get('/filter', filterSchools); // GET /api/schools/filter?city=XX&state=YY
router.get('/:id', getSchoolById);
router.get('/:id/stats', getSchoolStats);

// Protected routes (Admin only)
router.post('/', protect, createSchool);
router.put('/:id', protect, updateSchool);
router.delete('/:id', protect, deleteSchool);

module.exports = router;
