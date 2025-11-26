import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// ==================== AXIOS INTERCEPTOR FOR AUTH ====================
// Add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== TOURNAMENTS ====================

// Get all tournaments
export const getTournaments = async () => {
  const response = await axios.get(`${API_BASE_URL}/tournaments`);
  return response.data;
};

// Get tournament by ID
export const getTournamentById = async (tournamentId) => {
  const response = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}`);
  return response.data;
};

// Create tournament (ADMIN ONLY)
export const createTournament = async (tournamentData) => {
  const response = await axios.post(`${API_BASE_URL}/tournaments`, tournamentData);
  return response.data;
};

// Update tournament (ADMIN ONLY)
export const updateTournament = async (tournamentId, tournamentData) => {
  const response = await axios.put(`${API_BASE_URL}/tournaments/${tournamentId}`, tournamentData);
  return response.data;
};

// Delete tournament (ADMIN ONLY)
export const deleteTournament = async (tournamentId) => {
  const response = await axios.delete(`${API_BASE_URL}/tournaments/${tournamentId}`);
  return response.data;
};

// Upload tournament banner (ADMIN ONLY)
export const uploadTournamentBanner = async (tournamentId, formData) => {
  const response = await axios.post(
    `${API_BASE_URL}/tournaments/${tournamentId}/upload-banner`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data;
};

// Upload tournament gallery images (ADMIN ONLY)
export const uploadTournamentGallery = async (tournamentId, formData) => {
  const response = await axios.post(
    `${API_BASE_URL}/tournaments/${tournamentId}/upload-gallery`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data;
};

// Delete gallery image (ADMIN ONLY)
export const deleteTournamentGalleryImage = async (tournamentId, imageIndex) => {
  const response = await axios.delete(
    `${API_BASE_URL}/tournaments/${tournamentId}/gallery/${imageIndex}`
  );
  return response.data;
};

// Set Man of Tournament (ADMIN ONLY)
export const setManOfTournament = async (tournamentId, formData) => {
  const response = await axios.put(
    `${API_BASE_URL}/tournaments/${tournamentId}/man-of-tournament`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  return response.data;
};

// Add teams to tournament (ADMIN ONLY)
export const addTeamsToTournament = async (tournamentId, teamIds) => {
  const response = await axios.post(
    `${API_BASE_URL}/tournaments/${tournamentId}/add-teams`,
    { teamIds }
  );
  return response.data;
};

// Remove team from tournament (ADMIN ONLY)
export const removeTeamFromTournament = async (tournamentId, teamId) => {
  const response = await axios.delete(
    `${API_BASE_URL}/tournaments/${tournamentId}/remove-team/${teamId}`
  );
  return response.data;
};

// Filter tournaments
export const filterTournaments = async (filters) => {
  const params = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_BASE_URL}/tournaments/filter?${params}`);
  return response.data;
};

// Set tournament winners (ADMIN ONLY)
export const setTournamentWinners = async (tournamentId, winners) => {
  const response = await axios.put(
    `${API_BASE_URL}/tournaments/${tournamentId}/winners`,
    winners
  );
  return response.data;
};

// ==================== TEAMS ====================

// Get all teams
export const getTeams = async () => {
  const response = await axios.get(`${API_BASE_URL}/teams`);
  return response.data;
};

// Get team by ID
export const getTeamById = async (teamId) => {
  const response = await axios.get(`${API_BASE_URL}/teams/${teamId}`);
  return response.data;
};

// Create team (ADMIN ONLY)
export const createTeam = async (teamData) => {
  const response = await axios.post(`${API_BASE_URL}/teams`, teamData);
  return response.data;
};

// Update team (ADMIN ONLY)
export const updateTeam = async (teamId, teamData) => {
  const response = await axios.put(`${API_BASE_URL}/teams/${teamId}`, teamData);
  return response.data;
};

// Delete team (ADMIN ONLY)
export const deleteTeam = async (teamId) => {
  const response = await axios.delete(`${API_BASE_URL}/teams/${teamId}`);
  return response.data;
};

// Upload member photo (ADMIN ONLY)
export const uploadMemberPhoto = async (teamId, memberIndex, photoFile) => {
  const formData = new FormData();
  formData.append('photo', photoFile);
  const response = await axios.post(
    `${API_BASE_URL}/teams/${teamId}/members/${memberIndex}/photo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
};

// ==================== MATCHES ====================

// Get all matches
export const getMatches = async () => {
  const response = await axios.get(`${API_BASE_URL}/matches`);
  return response.data;
};

// Get match by ID
export const getMatchById = async (matchId) => {
  const response = await axios.get(`${API_BASE_URL}/matches/${matchId}`);
  return response.data;
};

// Get current match
export const getCurrentMatch = async () => {
  const response = await axios.get(`${API_BASE_URL}/matches/current`);
  return response.data;
};

// Set current match (ADMIN ONLY)
export const setCurrentMatch = async (matchId) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/set-current`);
  return response.data;
};

// Create match (ADMIN ONLY)
export const createMatch = async (matchData) => {
  const response = await axios.post(`${API_BASE_URL}/matches`, matchData);
  return response.data;
};

// Update match (ADMIN ONLY)
export const updateMatch = async (matchId, matchData) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}`, matchData);
  return response.data;
};

// Delete match (ADMIN ONLY)
export const deleteMatch = async (matchId) => {
  const response = await axios.delete(`${API_BASE_URL}/matches/${matchId}`);
  return response.data;
};

// Complete match (ADMIN ONLY)
export const completeMatch = async (matchId) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/complete`);
  return response.data;
};

// Set Man of the Match (ADMIN ONLY)
export const setManOfTheMatch = async (matchId, data) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/man-of-match`, data);
  return response.data;
};

// ==================== ROUNDS ====================

// Start round (ADMIN ONLY)
export const startRound = async (matchId) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/start-round`);
  return response.data;
};

// End round (ADMIN ONLY)
export const endRound = async (matchId) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/end-round`);
  return response.data;
};

// Update score (ADMIN ONLY)
export const updateScore = async (matchId, roundNumber, teamAScore, teamBScore) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/score`, {
    teamAScore,
    teamBScore
  });
  return response.data;
};

// ==================== TIMER CONTROLS ====================

// Pause timer (ADMIN ONLY)
export const pauseTimer = async (matchId, roundNumber) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/pause`);
  return response.data;
};

// Resume timer (ADMIN ONLY)
export const resumeTimer = async (matchId, roundNumber) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/resume`);
  return response.data;
};

// Reset timer (ADMIN ONLY)
export const resetTimer = async (matchId, roundNumber) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/reset`);
  return response.data;
};

// ==================== DRONE REGISTRATION ====================

// Register drones for round (ADMIN ONLY)
export const registerDronesForRound = async (matchId, roundNumber, drones) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/register-drones`, {
    roundNumber,
    drones
  });
  return response.data;
};

// ==================== BATCH DRONE COMMANDS ====================

// Start all drones (ADMIN ONLY)
export const startAllDrones = async (matchId) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/start-all-drones`);
  return response.data;
};

// Stop all drones (ADMIN ONLY)
export const stopAllDrones = async (matchId) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/stop-all-drones`);
  return response.data;
};

// Reset all drones (ADMIN ONLY)
export const resetAllDrones = async (matchId) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/reset-all-drones`);
  return response.data;
};

// ==================== TELEMETRY ====================

// Get telemetry
export const getTelemetry = async (matchId, droneId, roundNumber) => {
  const response = await axios.get(`${API_BASE_URL}/telemetry/${matchId}/${droneId}/${roundNumber}`);
  return response.data;
};

// Get all telemetry for a match
export const getAllTelemetry = async (matchId) => {
  const response = await axios.get(`${API_BASE_URL}/debug/all-telemetry`);
  return response.data;
};

// ==================== ML ANALYSIS ====================

// Get analysis for a round
export const getAnalysis = async (matchId, roundNumber) => {
  const response = await axios.get(`${API_BASE_URL}/analysis/${matchId}/${roundNumber}`);
  return response.data;
};

// ==================== MANUAL SCORE UPDATE ====================

// Manual score update (ADMIN ONLY)
export const updateMatchScore = async (matchId, team, increment) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/update-score`, {
    team,
    increment
  });
  return response.data;
};

// ==================== DRONE REPORTS ====================

// Get reports for tournament
export const getTournamentReports = async (tournamentId) => {
  const response = await axios.get(`${API_BASE_URL}/reports/tournament/${tournamentId}`);
  return response.data;
};

// Get reports for match
export const getMatchReports = async (matchId) => {
  const response = await axios.get(`${API_BASE_URL}/reports/match/${matchId}`);
  return response.data;
};

// Get single report
export const getReportById = async (reportId) => {
  const response = await axios.get(`${API_BASE_URL}/reports/${reportId}`);
  return response.data;
};

// ==================== DRONES ====================

// Get all drones
export const getAllDrones = async () => {
  const response = await axios.get(`${API_BASE_URL}/drones`);
  return response.data;
};

// Get drones by role
export const getDronesByRole = async (role) => {
  const response = await axios.get(`${API_BASE_URL}/drones/role/${role}`);
  return response.data;
};

// Get role specifications
export const getRoleSpecs = async () => {
  const response = await axios.get(`${API_BASE_URL}/drones/specs/roles`);
  return response.data;
};

// Get drone by ID
export const getDroneById = async (droneId) => {
  const response = await axios.get(`${API_BASE_URL}/drones/${droneId}`);
  return response.data;
};

// Create drone (ADMIN ONLY)
export const createDrone = async (droneData) => {
  const response = await axios.post(`${API_BASE_URL}/drones`, droneData);
  return response.data;
};

// Update drone (ADMIN ONLY)
export const updateDrone = async (droneId, droneData) => {
  const response = await axios.put(`${API_BASE_URL}/drones/${droneId}`, droneData);
  return response.data;
};

// Delete drone (ADMIN ONLY)
export const deleteDrone = async (droneId) => {
  const response = await axios.delete(`${API_BASE_URL}/drones/${droneId}`);
  return response.data;
};

// ==================== SCHOOLS ====================

// Get all schools
export const getAllSchools = async () => {
  const response = await axios.get(`${API_BASE_URL}/schools`);
  return response.data;
};

// Get school by ID
export const getSchoolById = async (schoolId) => {
  const response = await axios.get(`${API_BASE_URL}/schools/${schoolId}`);
  return response.data;
};

// Filter schools by city/state
export const filterSchools = async (city, state) => {
  const params = {};
  if (city) params.city = city;
  if (state) params.state = state;
  const response = await axios.get(`${API_BASE_URL}/schools/filter`, { params });
  return response.data;
};

// Get school statistics
export const getSchoolStats = async (schoolId) => {
  const response = await axios.get(`${API_BASE_URL}/schools/${schoolId}/stats`);
  return response.data;
};

// Create school (ADMIN ONLY)
export const createSchool = async (schoolData) => {
  const response = await axios.post(`${API_BASE_URL}/schools`, schoolData);
  return response.data;
};

// Update school (ADMIN ONLY)
export const updateSchool = async (schoolId, schoolData) => {
  const response = await axios.put(`${API_BASE_URL}/schools/${schoolId}`, schoolData);
  return response.data;
};

// Delete school (ADMIN ONLY)
export const deleteSchool = async (schoolId) => {
  const response = await axios.delete(`${API_BASE_URL}/schools/${schoolId}`);
  return response.data;
};

const apiService = {
  // Tournaments
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,

  // Teams
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,

  // Matches
  getMatches,
  getMatchById,
  getCurrentMatch,
  setCurrentMatch,
  createMatch,
  updateMatch,
  deleteMatch,
  completeMatch,

  // Rounds
  startRound,
  endRound,
  updateScore,

  // Batch Commands
  startAllDrones,
  stopAllDrones,
  resetAllDrones,

  // Telemetry
  getTelemetry,
  getAllTelemetry,

  // ML Analysis
  getAnalysis,

  // Drones
  getAllDrones,
  getDronesByRole,
  getRoleSpecs,
  getDroneById,
  createDrone,
  updateDrone,
  deleteDrone,

  // Schools
  getAllSchools,
  getSchoolById,
  filterSchools,
  getSchoolStats,
  createSchool,
  updateSchool,
  deleteSchool
};

export default apiService;
