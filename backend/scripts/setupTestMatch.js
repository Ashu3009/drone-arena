// backend/scripts/setupTestMatch.js
const axios = require('axios');

const BACKEND_URL = 'http://192.168.0.136:5000';

// Team IDs (update with your actual IDs)
const TEAM_A_ID = '68f88b24e557ffe58546ca66';
const TEAM_B_ID = '68f88c3ae557ffe58546ca69';
const TOURNAMENT_ID = '68f37f53373f70e91f121825';

// ✅ Complete 16 drones setup
const setupCompleteMatch = async () => {
  try {
    console.log('🎮 Setting up complete test match...\n');
    
    // Step 1: Create Match
    console.log('1️⃣ Creating match...');
    const matchResponse = await axios.post(`${BACKEND_URL}/api/matches`, {
      tournamentId: TOURNAMENT_ID,
      teamAId: TEAM_A_ID,
      teamBId: TEAM_B_ID
    });
    
    const matchId = matchResponse.data.data._id;
    console.log(`✅ Match created: ${matchId}\n`);
    
    // Step 2: Register Round 1 Drones (8 drones)
    console.log('2️⃣ Registering Round 1 drones...');
    await axios.post(`${BACKEND_URL}/api/matches/${matchId}/register-drones`, {
      roundNumber: 1,
      drones: [
        // Team A
        { droneNumber: 1, droneId: 'R1', team: TEAM_A_ID },  // ✅ Physical ESP #1
        { droneNumber: 2, droneId: 'R2', team: TEAM_A_ID },  // 🤖 Mock
        { droneNumber: 3, droneId: 'R3', team: TEAM_A_ID },  // 🤖 Mock
        { droneNumber: 4, droneId: 'R4', team: TEAM_A_ID },  // 🤖 Mock
        // Team B
        { droneNumber: 5, droneId: 'B1', team: TEAM_B_ID },  // ✅ Physical ESP #2
        { droneNumber: 6, droneId: 'B2', team: TEAM_B_ID },  // 🤖 Mock
        { droneNumber: 7, droneId: 'B3', team: TEAM_B_ID },  // 🤖 Mock
        { droneNumber: 8, droneId: 'B4', team: TEAM_B_ID }   // 🤖 Mock
      ]
    });
    console.log('✅ Round 1: 8 drones registered (2 physical + 6 mock)\n');
    
    // Step 3: Register Round 2 Drones (8 more drones)
    console.log('3️⃣ Registering Round 2 drones...');
    await axios.post(`${BACKEND_URL}/api/matches/${matchId}/register-drones`, {
      roundNumber: 2,
      drones: [
        // Team A
        { droneNumber: 9, droneId: 'R5', team: TEAM_A_ID },   // 🤖 Mock
        { droneNumber: 10, droneId: 'R6', team: TEAM_A_ID },  // 🤖 Mock
        { droneNumber: 11, droneId: 'R7', team: TEAM_A_ID },  // 🤖 Mock
        { droneNumber: 12, droneId: 'R8', team: TEAM_A_ID },  // 🤖 Mock
        // Team B
        { droneNumber: 13, droneId: 'B5', team: TEAM_B_ID },  // 🤖 Mock
        { droneNumber: 14, droneId: 'B6', team: TEAM_B_ID },  // 🤖 Mock
        { droneNumber: 15, droneId: 'B7', team: TEAM_B_ID },  // 🤖 Mock
        { droneNumber: 16, droneId: 'B8', team: TEAM_B_ID }   // 🤖 Mock
      ]
    });
    console.log('✅ Round 2: 8 drones registered (all mock)\n');
    
    // Step 4: Register Round 3 Drones (optional - can reuse drones)
    console.log('4️⃣ Registering Round 3 drones...');
    await axios.post(`${BACKEND_URL}/api/matches/${matchId}/register-drones`, {
      roundNumber: 3,
      drones: [
        // Reuse Round 1 drones
        { droneNumber: 1, droneId: 'R1', team: TEAM_A_ID },
        { droneNumber: 2, droneId: 'R2', team: TEAM_A_ID },
        { droneNumber: 3, droneId: 'R3', team: TEAM_A_ID },
        { droneNumber: 4, droneId: 'R4', team: TEAM_A_ID },
        { droneNumber: 5, droneId: 'B1', team: TEAM_B_ID },
        { droneNumber: 6, droneId: 'B2', team: TEAM_B_ID },
        { droneNumber: 7, droneId: 'B3', team: TEAM_B_ID },
        { droneNumber: 8, droneId: 'B4', team: TEAM_B_ID }
      ]
    });
    console.log('✅ Round 3: 8 drones registered (reusing Round 1 drones)\n');
    
    console.log('=====================================');
    console.log('✅ MATCH SETUP COMPLETE!');
    console.log('=====================================');
    console.log(`Match ID: ${matchId}`);
    console.log(`Total Rounds: 3`);
    console.log(`Total Drones: 16 unique drones`);
    console.log(`Physical ESPs: 2 (R1, B1)`);
    console.log(`Mock Drones: 14`);
    console.log('=====================================\n');
    
    console.log('📝 NEXT STEPS:');
    console.log(`1. Set Match ID in ESP #1 (R1): MATCH:${matchId}`);
    console.log(`2. Set Match ID in ESP #2 (B1): MATCH:${matchId}`);
    console.log(`3. Start Round 1: PUT /api/matches/${matchId}/start-round`);
    console.log(`4. Start mock telemetry: node mockTelemetryGenerator.js ${matchId} 1 60`);
    console.log(`5. End Round 1: PUT /api/matches/${matchId}/end-round`);
    console.log(`6. Check ML Reports: GET /api/matches/${matchId}/rounds/1/ml-reports\n`);
    
    return matchId;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

// Run the setup
setupCompleteMatch();