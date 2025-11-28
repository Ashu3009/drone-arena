// backend/routes/tournamentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  setWinners,
  registerTeamToTournament,
  uploadBanner,
  uploadGallery,
  deleteGalleryImage,
  setManOfTournament,
  addTeamsToTournament,
  removeTeamFromTournament,
  filterTournaments,
  generateTournamentFinalReport
} = require('../controllers/tournamentController');
const { protect } = require('../middleware/auth');
const { uploadBanner: uploadBannerMulter, uploadGallery: uploadGalleryMulter, uploadMOT } = require('../config/multer');

// Public routes
router.get('/', getAllTournaments);
router.get('/filter', filterTournaments);
router.get('/:id', getTournamentById);

// Protected routes (admin only)
router.post('/', protect, createTournament);
router.put('/:id', protect, updateTournament);
router.delete('/:id', protect, deleteTournament);
router.put('/:id/winners', protect, setWinners);
router.post('/:id/register', protect, registerTeamToTournament);

// File upload routes
router.post('/:id/upload-banner', protect, uploadBannerMulter.single('banner'), uploadBanner);
router.post('/:id/upload-gallery', protect, uploadGalleryMulter.array('images', 10), uploadGallery);
router.delete('/:id/gallery/:imageIndex', protect, deleteGalleryImage);

// Man of Tournament
router.put('/:id/man-of-tournament', protect, uploadMOT.single('photo'), setManOfTournament);

// Team management
router.post('/:id/add-teams', protect, addTeamsToTournament);
router.delete('/:id/remove-team/:teamId', protect, removeTeamFromTournament);

// Tournament Final Report
router.post('/:id/generate-final-report', protect, generateTournamentFinalReport);

module.exports = router;

