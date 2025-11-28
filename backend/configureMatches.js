#!/usr/bin/env node
/**
 * Auto-configure Matches with Rounds and Pilot Assignments
 * Configures Round 1, Round 2, and Round 3 for all existing matches
 * Team A gets RED drones (R1-R4), Team B gets BLUE drones (B1-B4)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const Match = require('./models/Match');
const Team = require('./models/Team');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/drone-arena';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

// Drone assignments (consistent across all rounds)
const RED_DRONES = ['R1', 'R2', 'R3', 'R4'];
const BLUE_DRONES = ['B1', 'B2', 'B3', 'B4'];
const ROLES = ['Forward', 'Center', 'Defender', 'Keeper'];

// Random drone specs
const getRandomSpecs = () => ({
  speed: Math.floor(Math.random() * 20) + 80,
  agility: Math.floor(Math.random() * 20) + 80,
  stability: Math.floor(Math.random() * 20) + 80,
  batteryCapacity: 5000,
  weight: Math.floor(Math.random() * 250) + 200
});

const configureRound = async (match, roundNumber) => {
  try {
    // Populate team data
    await match.populate('teamA teamB');

    const teamA = match.teamA;
    const teamB = match.teamB;

    // Select 4 pilots from each team (first 4 members)
    const teamAPilots = teamA.members.slice(0, 4);
    const teamBPilots = teamB.members.slice(0, 4);

    // Create registered drones array
    const registeredDrones = [];

    // Team A - RED drones
    for (let i = 0; i < 4; i++) {
      registeredDrones.push({
        droneId: RED_DRONES[i],
        team: teamA._id,
        role: ROLES[i],
        pilotId: teamAPilots[i]._id.toString(),
        pilotName: teamAPilots[i].name,
        specifications: getRandomSpecs()
      });
    }

    // Team B - BLUE drones
    for (let i = 0; i < 4; i++) {
      registeredDrones.push({
        droneId: BLUE_DRONES[i],
        team: teamB._id,
        role: ROLES[i],
        pilotId: teamBPilots[i]._id.toString(),
        pilotName: teamBPilots[i].name,
        specifications: getRandomSpecs()
      });
    }

    // Update the round
    const roundIndex = roundNumber - 1;
    match.rounds[roundIndex].registeredDrones = registeredDrones;
    match.rounds[roundIndex].status = 'pending';

    await match.save();

    console.log(`   ✅ Round ${roundNumber} configured:`);
    console.log(`      Team A (${teamA.name}): ${teamAPilots.map(p => p.name).join(', ')} → RED drones`);
    console.log(`      Team B (${teamB.name}): ${teamBPilots.map(p => p.name).join(', ')} → BLUE drones`);

  } catch (error) {
    console.error(`   ❌ Error configuring Round ${roundNumber}:`, error.message);
  }
};

const configureMatches = async () => {
  try {
    console.log('\n⚙️  Auto-configuring Matches with Rounds...\n');
    console.log('=' .repeat(60));

    // Get all scheduled matches
    const matches = await Match.find({ status: 'scheduled' })
      .populate('teamA teamB')
      .sort({ matchNumber: 1 });

    if (matches.length === 0) {
      console.log('\n⚠️  No scheduled matches found!');
      return;
    }

    console.log(`\n📋 Found ${matches.length} scheduled matches\n`);

    for (const match of matches) {
      console.log(`\n⚔️  Match ${match.matchNumber}: ${match.teamA.name} vs ${match.teamB.name}`);

      // Configure Round 1
      await configureRound(match, 1);

      // Configure Round 2
      await configureRound(match, 2);

      // Configure Round 3
      await configureRound(match, 3);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL MATCHES CONFIGURED!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   • Total Matches: ${matches.length}`);
    console.log(`   • Rounds per Match: 3 (Round 1, Round 2, Round 3)`);
    console.log(`   • Team A Drones: RED (R1-R4)`);
    console.log(`   • Team B Drones: BLUE (B1-B4)`);
    console.log(`   • Pilots: 4 pilots per team per round`);
    console.log('\n✅ Ready for testing!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start Backend: cd backend && npm start');
    console.log('   2. Start Frontend: cd frontend && npm start');
    console.log('   3. Start ESP Simulator: python backend/esp_multidrone_simulator.py');
    console.log('   4. Go to Admin → Matches → Select any match');
    console.log('   5. Click "Start Round 1" (pilots already assigned!)');
    console.log('   6. Round ends automatically or click "End Round"');
    console.log('   7. Check Reports → See pilot names and performance!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error configuring matches:', error);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  await configureMatches();
  await mongoose.disconnect();
  console.log('✅ Database disconnected\n');
  process.exit(0);
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
