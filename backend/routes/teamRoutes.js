// backend/routes/teamRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  uploadMemberPhoto
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const { uploadMemberPhoto: upload } = require('../config/multer');

// Public routes
router.get('/', getAllTeams);
router.get('/:id', getTeamById);

// Protected routes (admin only)
router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);
router.post('/:id/members/:memberIndex/photo', protect, upload.single('photo'), uploadMemberPhoto);

module.exports = router;