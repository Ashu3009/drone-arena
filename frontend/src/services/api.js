import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.64:5000/api';

// Get all tournaments
export const getTournaments = async () => {
  const response = await axios.get(`${API_BASE_URL}/tournaments`);
  return response.data;
};

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

// Start round
export const startRound = async (matchId, roundNumber) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/start`);
  return response.data;
};

// End round
export const endRound = async (matchId, roundNumber, scores) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/end`, scores);
  return response.data;
};

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

export default {
  getTournaments,
  getMatches,
  getMatchById,
  startRound,
  endRound,
  getTelemetry,
  getAllTelemetry
};