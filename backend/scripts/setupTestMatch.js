// backend/scripts/setupTestMatch.js
const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';

// ✅ Updated Team IDs (from your current system)
const TEAM_A_ID = '690b445223fe5f7ff3108dcf';  // DroneNova (Red)
const TEAM_B_ID = '690b442323fe5f7ff3108dc0';  // The Student Scoop (Blue)
const TOURNAMENT_ID = '690ef84fd72821094f2e125e';  // Test Championship 2025

// ✅ Complete 8 drones setup for drone soccer
const setupCompleteMatch = async () => {
  try {
    console.log('🎮 Setting up complete test match...\n');
    
    // Step 1: Create Match
    console.log('1️⃣ Creating match...');
    const matchResponse = await axios.post(`${BACKEND_URL}/api/matches`, {
      tournament: TOURNAMENT_ID,
      teamA: TEAM_A_ID,
      teamB: TEAM_B_ID,
      scheduledTime: new Date().toISOString()
    });
    
    const matchId = matchResponse.data.data._id;
    console.log(`✅ Match created: ${matchId}\n`);
    
    // Step 2: Register Round 1 Drones (8 drones - 4 per team)
    console.log('2️⃣ Registering Round 1 drones...');
    await axios.post(`${BACKEND_URL}/api/matches/${matchId}/register-drones`, {
      roundNumber: 1,
      drones: [
        // Team A (Red) - 4 drones
        { droneNumber: 1, droneId: 'R1', team: TEAM_A_ID },
        { droneNumber: 2, droneId: 'R2', team: TEAM_A_ID },
        { droneNumber: 3, droneId: 'R3', team: TEAM_A_ID },
        { droneNumber: 4, droneId: 'R4', team: TEAM_A_ID },
        // Team B (Blue) - 4 drones
        { droneNumber: 5, droneId: 'B1', team: TEAM_B_ID },
        { droneNumber: 6, droneId: 'B2', team: TEAM_B_ID },
        { droneNumber: 7, droneId: 'B3', team: TEAM_B_ID },
        { droneNumber: 8, droneId: 'B4', team: TEAM_B_ID }
      ]
    });
    console.log('✅ Round 1: 8 drones registered (R1-R4, B1-B4)\n');
    
    // Step 3: Register Round 2 Drones (same drones)
    console.log('3️⃣ Registering Round 2 drones...');
    await axios.post(`${BACKEND_URL}/api/matches/${matchId}/register-drones`, {
      roundNumber: 2,
      drones: [
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
    console.log('✅ Round 2: 8 drones registered\n');
    
    // Step 4: Register Round 3 Drones (same drones)
    console.log('4️⃣ Registering Round 3 drones...');
    await axios.post(`${BACKEND_URL}/api/matches/${matchId}/register-drones`, {
      roundNumber: 3,
      drones: [
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
    console.log('✅ Round 3: 8 drones registered\n');
    
    console.log('=====================================');
    console.log('✅ MATCH SETUP COMPLETE!');
    console.log('=====================================');
    console.log(`Match ID: ${matchId}`);
    console.log(`Tournament: Test Championship 2025`);
    console.log(`Team A: DroneNova (Red)`);
    console.log(`Team B: The Student Scoop (Blue)`);
    console.log(`Total Rounds: 3`);
    console.log(`Drones per Round: 8 (R1-R4, B1-B4)`);
    console.log('=====================================\n');
    
    console.log('📝 NEXT STEPS:');
    console.log(`\n1. Update virtual drone script:`);
    console.log(`   MATCH_ID = "${matchId}"`);
    console.log(`\n2. Start Round 1:`);
    console.log(`   PUT http://localhost:5000/api/matches/${matchId}/start-round`);
    console.log(`   Body: { "roundNumber": 1 }`);
    console.log(`\n3. Start virtual drones:`);
    console.log(`   python fast_multi_drone.py`);
    console.log(`\n4. End Round 1 (after 1-2 minutes):`);
    console.log(`   PUT http://localhost:5000/api/matches/${matchId}/end-round`);
    console.log(`\n5. Check Reports:`);
    console.log(`   GET http://localhost:5000/api/reports/match/${matchId}\n`);
    
    return matchId;
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

// Run the setup
setupCompleteMatch();