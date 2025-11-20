// backend/scripts/mockTelemetryGenerator.js
const axios = require('axios');

const BACKEND_URL = 'http://localhost:5000';

// ✅ Mock drone configurations
const mockDrones = [
  { droneNumber: 2, droneId: 'R2', team: 'A', espMac: 'AA:BB:CC:DD:EE:02' },
  { droneNumber: 3, droneId: 'R3', team: 'A', espMac: 'AA:BB:CC:DD:EE:03' },
  { droneNumber: 4, droneId: 'R4', team: 'A', espMac: 'AA:BB:CC:DD:EE:04' },
  { droneNumber: 6, droneId: 'B2', team: 'B', espMac: 'AA:BB:CC:DD:EE:06' },
  { droneNumber: 7, droneId: 'B3', team: 'B', espMac: 'AA:BB:CC:DD:EE:07' },
  { droneNumber: 8, droneId: 'B4', team: 'B', espMac: 'AA:BB:CC:DD:EE:08' },
];

// Round 2 drones
const mockDronesRound2 = [
  { droneNumber: 9, droneId: 'R5', team: 'A', espMac: 'AA:BB:CC:DD:EE:09' },
  { droneNumber: 10, droneId: 'R6', team: 'A', espMac: 'AA:BB:CC:DD:EE:10' },
  { droneNumber: 11, droneId: 'R7', team: 'A', espMac: 'AA:BB:CC:DD:EE:11' },
  { droneNumber: 12, droneId: 'R8', team: 'A', espMac: 'AA:BB:CC:DD:EE:12' },
  { droneNumber: 13, droneId: 'B5', team: 'B', espMac: 'AA:BB:CC:DD:EE:13' },
  { droneNumber: 14, droneId: 'B6', team: 'B', espMac: 'AA:BB:CC:DD:EE:14' },
  { droneNumber: 15, droneId: 'B7', team: 'B', espMac: 'AA:BB:CC:DD:EE:15' },
  { droneNumber: 16, droneId: 'B8', team: 'B', espMac: 'AA:BB:CC:DD:EE:16' },
];

let isRunning = false;
let currentMatchId = null;
let currentRound = 1;

// Generate realistic telemetry data
const generateTelemetryData = (drone, timestamp) => {
  const time = timestamp / 1000; // seconds
  
  return {
    droneId: drone.droneId,
    matchId: currentMatchId,
    roundNumber: currentRound,
    espMacAddress: drone.espMac,
    
    // Simulated flight pattern - circular motion
    x: 50 + 30 * Math.cos(time * 0.5 + drone.droneNumber),
    y: 50 + 30 * Math.sin(time * 0.5 + drone.droneNumber),
    altitude: 15 + 5 * Math.sin(time * 0.3),
    
    speed: 10 + 5 * Math.random(),
    battery: Math.max(20, 100 - (time / 10)), // Decreases over time
    
    pitch: Math.sin(time * 0.2) * 15,
    roll: Math.cos(time * 0.3) * 10,
    yaw: (time * 20) % 360,
    
    timestamp: new Date().toISOString()
  };
};

// Send telemetry for one drone
const sendTelemetry = async (drone, timestamp) => {
  try {
    const data = generateTelemetryData(drone, timestamp);
    
    await axios.post(`${BACKEND_URL}/api/telemetry`, data);
    console.log(`✅ Mock telemetry sent: ${drone.droneId}`);
  } catch (error) {
    console.error(`❌ Error sending telemetry for ${drone.droneId}:`, error.message);
  }
};

// Main simulation loop
const startMockTelemetry = async (matchId, roundNumber, durationSeconds = 60) => {
  currentMatchId = matchId;
  currentRound = roundNumber;
  isRunning = true;
  
  console.log('\n🚁 Starting Mock Telemetry Generator');
  console.log(`Match ID: ${matchId}`);
  console.log(`Round: ${roundNumber}`);
  console.log(`Duration: ${durationSeconds} seconds`);
  console.log(`Mock Drones: ${roundNumber === 1 ? mockDrones.length : mockDronesRound2.length}`);
  console.log('=====================================\n');
  
  const startTime = Date.now();
  const endTime = startTime + (durationSeconds * 1000);
  
  const activeDrones = roundNumber === 1 ? mockDrones : mockDronesRound2;
  
  while (Date.now() < endTime && isRunning) {
    const currentTime = Date.now() - startTime;
    
    // Send telemetry for all mock drones
    const promises = activeDrones.map(drone => 
      sendTelemetry(drone, currentTime)
    );
    
    await Promise.all(promises);
    
    // Wait 100ms before next batch
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n✅ Mock telemetry generation completed!\n');
  isRunning = false;
};

// Stop simulation
const stopMockTelemetry = () => {
  isRunning = false;
  console.log('🛑 Stopping mock telemetry...');
};

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node mockTelemetryGenerator.js <matchId> <roundNumber> [duration]');
    console.log('Example: node mockTelemetryGenerator.js 690xxxxx 1 60');
    process.exit(1);
  }
  
  const [matchId, roundNumber, duration] = args;
  startMockTelemetry(matchId, parseInt(roundNumber), parseInt(duration) || 60);
}

module.exports = {
  startMockTelemetry,
  stopMockTelemetry
};