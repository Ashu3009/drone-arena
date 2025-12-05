// Script to create a test tournament with 2 matches (NO DRAW rounds)
// Usage: node scripts/createTestTournament.js

const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');

async function createTestTournament() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/drone-arena');
    console.log('✅ Connected to MongoDB\n');

    // Find Team 1 and Team 2
    console.log('🔍 Finding Team 1 and Team 2...');
    const team1 = await Team.findOne({ name: 'Team 1' });
    const team2 = await Team.findOne({ name: 'Team 2' });

    if (!team1 || !team2) {
      console.log('❌ Team 1 or Team 2 not found!');
      console.log('Please create teams first via Admin Panel');
      process.exit(1);
    }

    console.log('✅ Found Team 1:', team1.name, '- ID:', team1._id);
    console.log('✅ Found Team 2:', team2.name, '- ID:', team2._id);
    console.log('');

    // Create Tournament
    console.log('📋 Creating Tournament...');
    const tournament = await Tournament.create({
      name: 'ESP32 Test Tournament',
      description: 'Automated test tournament with 2 matches - 3 minute rounds',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
      status: 'ongoing',
      teams: [team1._id, team2._id]
    });

    console.log('✅ Tournament Created:', tournament.name);
    console.log('   ID:', tournament._id);
    console.log('');

    // Create Match 1
    console.log('🎮 Creating Match 1...');
    const match1 = await Match.create({
      tournament: tournament._id,
      teamA: team1._id,
      teamB: team2._id,
      scheduledTime: new Date(),
      status: 'scheduled',
      rounds: [
        {
          roundNumber: 1,
          status: 'not_started',
          duration: 180, // 3 minutes
          registeredDrones: []
        },
        {
          roundNumber: 2,
          status: 'not_started',
          duration: 180, // 3 minutes
          registeredDrones: []
        }
      ],
      isCurrentMatch: false
    });

    console.log('✅ Match 1 Created');
    console.log('   ID:', match1._id);
    console.log('   Teams:', team1.name, 'vs', team2.name);
    console.log('   Rounds: 2 (3 minutes each - NO DRAW)');
    console.log('');

    // Create Match 2
    console.log('🎮 Creating Match 2...');
    const match2 = await Match.create({
      tournament: tournament._id,
      teamA: team1._id,
      teamB: team2._id,
      scheduledTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes later
      status: 'scheduled',
      rounds: [
        {
          roundNumber: 1,
          status: 'not_started',
          duration: 180, // 3 minutes
          registeredDrones: []
        },
        {
          roundNumber: 2,
          status: 'not_started',
          duration: 180, // 3 minutes
          registeredDrones: []
        }
      ],
      isCurrentMatch: false
    });

    console.log('✅ Match 2 Created');
    console.log('   ID:', match2._id);
    console.log('   Teams:', team1.name, 'vs', team2.name);
    console.log('   Rounds: 2 (3 minutes each - NO DRAW)');
    console.log('');

    // Update tournament with matches
    tournament.matches = [match1._id, match2._id];
    await tournament.save();

    console.log('========================================');
    console.log('✅ TEST TOURNAMENT CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log('');
    console.log('📊 Summary:');
    console.log('   Tournament:', tournament.name);
    console.log('   Tournament ID:', tournament._id);
    console.log('   Teams: Team 1 vs Team 2');
    console.log('   Matches: 2');
    console.log('   Rounds per match: 2 (NO DRAW rounds)');
    console.log('   Round duration: 3 minutes (180 seconds)');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Go to Admin Dashboard → Matches');
    console.log('   2. Select Match 1');
    console.log('   3. Click "Set as Current Match"');
    console.log('   4. Register ESP device: 84:1F:E8:68:71:34');
    console.log('   5. Select drones for round');
    console.log('   6. Start Round → Wait 10-15 sec → End Round');
    console.log('   7. Check Performance Reports');
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestTournament();
