// backend/services/mlService.js
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

class MLService {
  
  // Health check
  async healthCheck() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('❌ ML Service health check failed:', error.message);
      return null;
    }
  }
  
  // Analyze single team's drones
  async analyzeTeamStability(matchId, teamId, roundNo, drones) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/analyze`, {
        match_id: matchId,
        team_id: teamId,
        round_no: roundNo,
        drones: drones
      }, {
        timeout: 30000 // 30 seconds timeout
      });
      
      return response.data;
      
    } catch (error) {
      console.error('❌ ML Analysis failed:', error.message);
      throw new Error(`ML Analysis failed: ${error.message}`);
    }
  }
  
  // Analyze both teams at once
  async analyzeBothTeams(matchId, teamAData, teamBData) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/batch-analyze`, {
        match_id: matchId,
        teams: [teamAData, teamBData]
      }, {
        timeout: 60000 // 60 seconds for batch
      });
      
      return response.data;
      
    } catch (error) {
      console.error('❌ Batch ML Analysis failed:', error.message);
      throw new Error(`Batch ML Analysis failed: ${error.message}`);
    }
  }
}

module.exports = new MLService();