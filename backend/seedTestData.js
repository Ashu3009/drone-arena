#!/usr/bin/env node
/**
 * Comprehensive Test Data Seeder
 * Creates: 1 tournament, 5 teams, 16 drones, 7 matches
 *
 * Usage: node backend/seedTestData.js (from root)
 *        OR node seedTestData.js (from backend folder)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
const Team = require('./models/Team');
const Drone = require('./models/Drone');
const Match = require('./models/Match');
const School = require('./models/School');
const Admin = require('./models/Admin');

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

// Team configurations
const TEAMS_DATA = [
  {
    name: 'Red Eagles',
    color: '#ff0000',
    members: [
      { name: 'John Doe', grade: '10th', role: 'Forward', photo: 'https://i.pravatar.cc/150?img=12' },
      { name: 'Jane Smith', grade: '10th', role: 'Striker', photo: 'https://i.pravatar.cc/150?img=23' },
      { name: 'Mike Johnson', grade: '11th', role: 'Defender', photo: 'https://i.pravatar.cc/150?img=33' },
      { name: 'Sarah Williams', grade: '11th', role: 'Central', photo: 'https://i.pravatar.cc/150?img=44' },
      { name: 'David Brown', grade: '10th', role: 'Substitute', photo: 'https://i.pravatar.cc/150?img=55' }
    ],
    coach: { name: 'Coach Anderson', email: 'anderson@school.com', phone: '9876543211' }
  },
  {
    name: 'Blue Hawks',
    color: '#0000ff',
    members: [
      { name: 'Tom Brown', grade: '10th', role: 'Forward', photo: 'https://i.pravatar.cc/150?img=15' },
      { name: 'Lisa Davis', grade: '10th', role: 'Striker', photo: 'https://i.pravatar.cc/150?img=25' },
      { name: 'Chris Wilson', grade: '11th', role: 'Defender', photo: 'https://i.pravatar.cc/150?img=35' },
      { name: 'Emma Taylor', grade: '11th', role: 'Central', photo: 'https://i.pravatar.cc/150?img=45' },
      { name: 'Alex Martinez', grade: '10th', role: 'Substitute', photo: 'https://i.pravatar.cc/150?img=56' }
    ],
    coach: { name: 'Coach Peterson', email: 'peterson@school.com', phone: '9876543212' }
  },
  {
    name: 'Green Vipers',
    color: '#00ff00',
    members: [
      { name: 'Ryan Garcia', grade: '10th', role: 'Forward', photo: 'https://i.pravatar.cc/150?img=17' },
      { name: 'Sophie Lee', grade: '10th', role: 'Striker', photo: 'https://i.pravatar.cc/150?img=27' },
      { name: 'James Clark', grade: '11th', role: 'Defender', photo: 'https://i.pravatar.cc/150?img=37' },
      { name: 'Olivia Moore', grade: '11th', role: 'Central', photo: 'https://i.pravatar.cc/150?img=47' },
      { name: 'Daniel White', grade: '10th', role: 'Substitute', photo: 'https://i.pravatar.cc/150?img=57' }
    ],
    coach: { name: 'Coach Roberts', email: 'roberts@school.com', phone: '9876543213' }
  },
  {
    name: 'Yellow Titans',
    color: '#ffff00',
    members: [
      { name: 'Kevin Hall', grade: '10th', role: 'Forward', photo: 'https://i.pravatar.cc/150?img=18' },
      { name: 'Mia Young', grade: '10th', role: 'Striker', photo: 'https://i.pravatar.cc/150?img=28' },
      { name: 'Lucas King', grade: '11th', role: 'Defender', photo: 'https://i.pravatar.cc/150?img=38' },
      { name: 'Ava Wright', grade: '11th', role: 'Central', photo: 'https://i.pravatar.cc/150?img=48' },
      { name: 'Noah Scott', grade: '10th', role: 'Substitute', photo: 'https://i.pravatar.cc/150?img=58' }
    ],
    coach: { name: 'Coach Thompson', email: 'thompson@school.com', phone: '9876543214' }
  },
  {
    name: 'Purple Storm',
    color: '#800080',
    members: [
      { name: 'Ethan Hill', grade: '10th', role: 'Forward', photo: 'https://i.pravatar.cc/150?img=19' },
      { name: 'Isabella Green', grade: '10th', role: 'Striker', photo: 'https://i.pravatar.cc/150?img=29' },
      { name: 'Mason Adams', grade: '11th', role: 'Defender', photo: 'https://i.pravatar.cc/150?img=39' },
      { name: 'Charlotte Baker', grade: '11th', role: 'Central', photo: 'https://i.pravatar.cc/150?img=49' },
      { name: 'Logan Nelson', grade: '10th', role: 'Substitute', photo: 'https://i.pravatar.cc/150?img=59' }
    ],
    coach: { name: 'Coach Davis', email: 'davis@school.com', phone: '9876543215' }
  }
];

const seedData = async () => {
  try {
    console.log('\n🌱 Starting Comprehensive Test Data Seeding...\n');
    console.log('=' .repeat(60));

    // 1. Create Admin User
    console.log('\n👤 Creating admin user...');
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
      await Admin.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('   ✅ Admin created (username: admin, password: admin123)');
    } else {
      console.log('   ℹ️  Admin already exists (username: admin, password: admin123)');
    }

    // 2. Create School
    console.log('\n📚 Creating school...');
    let school = await School.findOne({ name: 'Test High School' });
    if (!school) {
      school = await School.create({
        name: 'Test High School',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: '400001',
          address: '123 Test Street'
        },
        contactEmail: 'test@school.com',
        contactPhone: '9876543210'
      });
      console.log('   ✅ School created: Test High School');
    } else {
      console.log('   ℹ️  School already exists');
    }

    // 3. Create Tournament
    console.log('\n🏆 Creating tournament...');
    let tournament = await Tournament.findOne({ name: 'Test Tournament 2025' });
    if (!tournament) {
      tournament = await Tournament.create({
        name: 'Test Tournament 2025',
        description: 'Comprehensive test tournament with 5 teams and 7 matches',
        location: {
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          venue: 'Test Arena',
          address: '456 Tournament Road'
        },
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-01-17'),
        registrationDeadline: new Date('2025-01-10'),
        maxTeams: 16,
        status: 'upcoming',
        rules: ['Standard drone arena rules', 'No manual interference'],
        awards: {
          winner: { title: 'Champion Trophy', prize: '₹50,000' },
          runnerUp: { title: 'Runner Up Trophy', prize: '₹25,000' },
          thirdPlace: { title: 'Third Place Trophy', prize: '₹10,000' }
        }
      });
      console.log('   ✅ Tournament created: Test Tournament 2025');
    } else {
      console.log('   ℹ️  Tournament already exists');
    }

    // 4. Create 5 Teams
    console.log('\n👥 Creating 5 teams...');
    const teams = [];
    for (const teamData of TEAMS_DATA) {
      let team = await Team.findOne({ name: teamData.name });
      if (!team) {
        team = await Team.create({
          name: teamData.name,
          school: school._id,
          color: teamData.color,
          location: {
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India'
          },
          members: teamData.members,
          coach: teamData.coach
        });
        console.log(`   ✅ Created ${teamData.name} (${teamData.members.length} pilots)`);
      } else {
        console.log(`   ℹ️  ${teamData.name} already exists`);
      }
      teams.push(team);
    }

    // 5. Create Drones (R1-R8, B1-B8)
    console.log('\n🚁 Creating 16 drones...');
    const allDrones = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];
    const roles = ['Forward', 'Striker', 'Defender', 'Central', 'Forward', 'Striker', 'Defender', 'Central'];

    let createdCount = 0;
    for (let i = 0; i < allDrones.length; i++) {
      const existingDrone = await Drone.findOne({ droneId: allDrones[i] });
      if (!existingDrone) {
        await Drone.create({
          droneId: allDrones[i],
          name: `Drone ${allDrones[i]}`,
          model: 'DJI-X1',
          role: roles[i % 8],
          status: 'Active',
          specifications: {
            speed: Math.floor(Math.random() * 20) + 80,
            agility: Math.floor(Math.random() * 20) + 80,
            stability: Math.floor(Math.random() * 20) + 80,
            batteryCapacity: 5000,
            weight: Math.floor(Math.random() * 250) + 200
          }
        });
        createdCount++;
      }
    }
    console.log(`   ✅ Created ${createdCount} new drones (Total: 16)`);

    // 6. Create 7 Matches
    console.log('\n⚔️  Creating 7 matches...');

    // Match combinations (team indices)
    const matchPairs = [
      [0, 1], // Red Eagles vs Blue Hawks
      [2, 3], // Green Vipers vs Yellow Titans
      [4, 0], // Purple Storm vs Red Eagles
      [1, 2], // Blue Hawks vs Green Vipers
      [3, 4], // Yellow Titans vs Purple Storm
      [0, 3], // Red Eagles vs Yellow Titans
      [2, 4]  // Green Vipers vs Purple Storm
    ];

    const existingMatches = await Match.countDocuments({ tournament: tournament._id });
    const startingMatchNumber = existingMatches + 1;

    for (let i = 0; i < matchPairs.length; i++) {
      const [teamAIdx, teamBIdx] = matchPairs[i];
      const teamA = teams[teamAIdx];
      const teamB = teams[teamBIdx];

      const match = await Match.create({
        tournament: tournament._id,
        matchNumber: startingMatchNumber + i,
        teamA: teamA._id,
        teamB: teamB._id,
        scheduledTime: new Date(Date.now() + i * 3600000), // 1 hour apart
        rounds: [
          { roundNumber: 1, status: 'pending', teamAScore: 0, teamBScore: 0 },
          { roundNumber: 2, status: 'pending', teamAScore: 0, teamBScore: 0 },
          { roundNumber: 3, status: 'pending', teamAScore: 0, teamBScore: 0 }
        ],
        currentRound: 0,
        status: 'scheduled'
      });

      console.log(`   ✅ Match ${startingMatchNumber + i}: ${teamA.name} vs ${teamB.name}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 COMPREHENSIVE TEST DATA SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log(`   • Tournament: Test Tournament 2025`);
    console.log(`   • School: Test High School`);
    console.log(`   • Admin: username=admin, password=admin123`);
    console.log(`   • Teams: 5 teams with 5 pilots each`);
    teams.forEach((team, idx) => {
      console.log(`     ${idx + 1}. ${team.name}`);
    });
    console.log(`   • Drones: 16 drones (R1-R8, B1-B8)`);
    console.log(`   • Matches: 7 matches created`);
    console.log('\n✅ Ready for testing!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Start Backend: cd backend && npm start');
    console.log('   2. Start Frontend: cd frontend && npm start');
    console.log('   3. Login: username=admin, password=admin123');
    console.log('   4. Start ESP Simulator: python backend/esp_multidrone_simulator.py');
    console.log('   5. Go to Admin → Matches → Select any match');
    console.log('   6. Configure Round → Select pilots → Start Round');
    console.log('   7. End Round → Check Reports!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  await seedData();
  await mongoose.disconnect();
  console.log('✅ Database disconnected (this is normal!)\n');
  process.exit(0);
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
