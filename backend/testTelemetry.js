// Test script to simulate drone telemetry without physical ESP32
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Sample match and team IDs - Update these with actual IDs from your database
let MATCH_ID = null;
let TEAM_A_ID = null;
let TEAM_B_ID = null;
let ROUND_NUMBER = 1;

// Simulate circular flight path for drones
const simulateDroneFlight = (droneId, teamId, duration = 30000) => {
  let time = 0;
  const radius = 300; // Arena radius in cm
  const speed = 0.002; // Angular speed

  const interval = setInterval(async () => {
    time += 100;

    // Circular path with some height variation
    const angle = time * speed;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = 100 + Math.sin(angle * 2) * 50; // Height oscillation

    const telemetry = {
      droneId,
      matchId: MATCH_ID,
      roundNumber: ROUND_NUMBER,
      teamId,
      x: Math.round(x),
      y: Math.round(y),
      z: Math.round(z),
      pitch: Math.round(Math.sin(angle) * 10),
      roll: Math.round(Math.cos(angle) * 10),
      yaw: Math.round(angle * (180 / Math.PI)),
      battery: 100 - (time / duration) * 20 // Battery drains over time
    };

    try {
      const response = await axios.post(`${API_URL}/telemetry`, telemetry);
      console.log(`✈️  ${droneId}: [${x.toFixed(0)}, ${y.toFixed(0)}, ${z.toFixed(0)}] - Logs: ${response.data.logsCount}`);
    } catch (error) {
      console.error(`❌ ${droneId} error:`, error.response?.data || error.message);
    }

    if (time >= duration) {
      clearInterval(interval);
      console.log(`🛑 ${droneId} simulation complete`);
    }
  }, 100); // Send telemetry every 100ms
};

// Aggressive vs Defensive patterns
const simulateAggressiveDrone = (droneId, teamId, duration = 30000) => {
  let time = 0;

  const interval = setInterval(async () => {
    time += 100;

    // Fast, erratic movements
    const x = Math.random() * 400 - 200;
    const y = Math.random() * 400 - 200;
    const z = 150 + Math.random() * 100;

    const telemetry = {
      droneId, matchId: MATCH_ID, roundNumber: ROUND_NUMBER, teamId,
      x: Math.round(x), y: Math.round(y), z: Math.round(z),
      pitch: Math.round(Math.random() * 30 - 15),
      roll: Math.round(Math.random() * 30 - 15),
      yaw: Math.round(Math.random() * 360),
      battery: 100 - (time / duration) * 30 // Aggressive = more battery drain
    };

    try {
      const response = await axios.post(`${API_URL}/telemetry`, telemetry);
      console.log(`⚡ ${droneId}: [${x.toFixed(0)}, ${y.toFixed(0)}, ${z.toFixed(0)}] - Aggressive mode`);
    } catch (error) {
      console.error(`❌ ${droneId} error:`, error.message);
    }

    if (time >= duration) {
      clearInterval(interval);
      console.log(`🛑 ${droneId} simulation complete`);
    }
  }, 100);
};

// Main simulation
const startSimulation = async () => {
  try {
    console.log('🚀 Starting drone telemetry simulation...\n');

    // Fetch current match
    const matchResponse = await axios.get(`${API_URL}/matches/current`);
    if (!matchResponse.data.success || !matchResponse.data.data) {
      console.error('❌ No current match found! Set a current match first.');
      return;
    }

    const match = matchResponse.data.data;
    MATCH_ID = match._id;
    TEAM_A_ID = match.teamA._id;
    TEAM_B_ID = match.teamB._id;
    ROUND_NUMBER = match.currentRound || 1;

    console.log(`📋 Match: ${match.teamA.name} vs ${match.teamB.name}`);
    console.log(`🔄 Round: ${ROUND_NUMBER}`);
    console.log(`🆔 Match ID: ${MATCH_ID}\n`);

    // Get active round
    const activeRound = match.rounds?.find(r => r.status === 'in_progress');
    if (!activeRound) {
      console.error('❌ No active round! Start a round first.');
      return;
    }

    console.log(`✅ Active drones:`, activeRound.registeredDrones.map(d => d.droneId).join(', '));
    console.log(`\n🎬 Starting 30-second simulation...\n`);

    // Simulate registered drones
    activeRound.registeredDrones.forEach((drone, index) => {
      const teamId = drone.team;

      setTimeout(() => {
        if (drone.droneId.startsWith('R')) {
          // Red team - circular pattern
          simulateDroneFlight(drone.droneId, teamId, 30000);
        } else {
          // Blue team - aggressive pattern
          simulateAggressiveDrone(drone.droneId, teamId, 30000);
        }
      }, index * 500); // Stagger start times
    });

    console.log('💡 Tip: Open http://localhost:3000 to see drones in 3D Arena!\n');

  } catch (error) {
    console.error('❌ Simulation error:', error.response?.data || error.message);
    console.log('\n📝 Setup checklist:');
    console.log('  1. Backend running on port 5000?');
    console.log('  2. Match created with "Set Current Match"?');
    console.log('  3. Round started with drones registered?');
  }
};

// Run simulation
startSimulation();
