import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/complete`);
  return response.data;
};

// ==================== ROUNDS ====================

// Start round (ADMIN ONLY)
export const startRound = async (matchId, roundNumber) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/start`);
  return response.data;
};

// End round (ADMIN ONLY)
export const endRound = async (matchId, roundNumber, scores) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/end`, scores);
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

export default {
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
  getAnalysis
};
