/**
 * Script to create 13 matches for Aerial Knights Championship
 * Teams: Blaze United, Shadow Wings, Phoenix Strikers, Neon Falcons, Thunder Hawks, Storm Riders
 */

require('dotenv').config({ path: '.env.development' }); // Using Atlas
const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
const Team = require('./models/Team');
const Match = require('./models/Match');

// Match data (without scores - you'll set manually)
const matchesData = [
  { match: 3, teamA: 'Blaze United', teamB: 'Shadow Wings' },
  { match: 4, teamA: 'Phoenix Strikers', teamB: 'Neon Falcons' },
  { match: 5, teamA: 'Thunder Hawks', teamB: 'Storm Riders' },
  { match: 6, teamA: 'Blaze United', teamB: 'Shadow Wings' },
  { match: 7, teamA: 'Phoenix Strikers', teamB: 'Storm Riders' },
  { match: 8, teamA: 'Thunder Hawks', teamB: 'Blaze United' },
  { match: 9, teamA: 'Neon Falcons', teamB: 'Shadow Wings' },
  { match: 10, teamA: 'Phoenix Strikers', teamB: 'Blaze United' },
  { match: 11, teamA: 'Thunder Hawks', teamB: 'Shadow Wings' },
  { match: 12, teamA: 'Neon Falcons', teamB: 'Blaze United' },
  { match: 13, teamA: 'Phoenix Strikers', teamB: 'Shadow Wings' },
  { match: 14, teamA: 'Thunder Hawks', teamB: 'Neon Falcons' },
  { match: 15, teamA: 'Storm Riders', teamB: 'Blaze United' }
];

async function createMatches() {
  try {
    console.log('\n========================================');
    console.log('  Creating Matches for Tournament');
    console.log('========================================\n');

    // Connect to MongoDB
    console.log('[1/5] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[OK] Connected to:', process.env.MONGODB_URI);
    console.log();

    // Find tournament
    console.log('[2/5] Finding tournament "Aerial Knights Championship"...');

    // First check all tournaments
    const allTournaments = await Tournament.find({}, 'name status');
    console.log(`[INFO] Total tournaments in database: ${allTournaments.length}`);

    if (allTournaments.length === 0) {
      console.log('[ERROR] No tournaments found in database!');
      console.log('[INFO] Please create "Aerial Knights Championship" tournament first');
      process.exit(1);
    }

    console.log('[INFO] Available tournaments:');
    allTournaments.forEach(t => console.log(`  - "${t.name}" (Status: ${t.status})`));
    console.log();

    // Try exact match first
    let tournament = await Tournament.findOne({
      name: 'Aerial Knights Championship'
    });

    // If not found, try case-insensitive
    if (!tournament) {
      tournament = await Tournament.findOne({
        name: /Aerial Knights Championship/i
      });
    }

    // If still not found, try partial match
    if (!tournament) {
      tournament = await Tournament.findOne({
        name: { $regex: 'Aerial Knights', $options: 'i' }
      });
    }

    if (!tournament) {
      console.log('[ERROR] Tournament "Aerial Knights Championship" not found!');
      console.log('[SOLUTION] Create the tournament first or update the script with correct name');
      process.exit(1);
    }

    console.log('[OK] Found tournament:', tournament.name);
    console.log('[OK] Tournament ID:', tournament._id);
    console.log();

    // Get all unique team base names
    const teamBaseNames = [...new Set(matchesData.flatMap(m => [m.teamA, m.teamB]))];
    console.log('[3/5] Finding teams...');
    console.log('[INFO] Teams needed (base names):', teamBaseNames.join(', '));

    // Find teams using regex to match base names (ignoring short codes)
    const teams = [];
    for (const baseName of teamBaseNames) {
      // Match "Phoenix Strikers" or "Phoenix Strikers(PHX)" or "Phoenix Strikers (PHX)"
      const team = await Team.findOne({
        name: { $regex: `^${baseName}`, $options: 'i' }
      });

      if (team) {
        teams.push(team);
        console.log(`[OK] Found: "${team.name}" for "${baseName}"`);
      } else {
        console.log(`[ERROR] Not found: "${baseName}"`);
      }
    }

    if (teams.length !== teamBaseNames.length) {
      console.log('\n[ERROR] Some teams not found!');
      console.log('[INFO] Found teams:', teams.map(t => t.name).join(', '));

      const foundBaseNames = teams.map(t => {
        // Extract base name from "Team Name(CODE)"
        return t.name.replace(/\([A-Z]+\)/, '').trim();
      });
      const missing = teamBaseNames.filter(name => !foundBaseNames.includes(name));
      console.log('[INFO] Missing teams:', missing);

      console.log('\n[INFO] All teams in database:');
      const allTeams = await Team.find({}, 'name');
      allTeams.forEach(t => console.log(`  - ${t.name}`));

      process.exit(1);
    }

    console.log('[OK] All teams found!');
    teams.forEach(team => console.log(`  - ${team.name} (${team._id})`));
    console.log();

    // Create team lookup (map base names to team IDs)
    const teamMap = {};
    teams.forEach(team => {
      // Extract base name from "Team Name(CODE)"
      const baseName = team.name.replace(/\s*\([A-Z]+\)/, '').trim();
      teamMap[baseName] = team._id;
    });

    console.log('[DEBUG] Team mapping:');
    Object.keys(teamMap).forEach(key => {
      console.log(`  "${key}" → ${teamMap[key]}`);
    });
    console.log();

    // Create matches
    console.log('[4/5] Creating matches...');
    let created = 0;
    let skipped = 0;

    for (const matchData of matchesData) {
      // Check if match already exists
      const existing = await Match.findOne({
        tournament: tournament._id,
        matchNumber: matchData.match
      });

      if (existing) {
        console.log(`[SKIP] Match ${matchData.match} already exists`);
        skipped++;
        continue;
      }

      // Create new match with 2 rounds
      const newMatch = new Match({
        tournament: tournament._id,
        matchNumber: matchData.match,
        teamA: teamMap[matchData.teamA],
        teamB: teamMap[matchData.teamB],
        status: 'scheduled', // NOT completed, so tournament doesn't end
        scheduledTime: new Date(),
        currentRound: 0, // No round started yet
        finalScoreA: 0,
        finalScoreB: 0,
        winner: null,
        // Pre-create 2 rounds
        rounds: [
          {
            roundNumber: 1,
            registeredDrones: [],
            teamAScore: 0,
            teamBScore: 0,
            status: 'pending',
            timerStatus: 'not_started',
            elapsedTime: 0
          },
          {
            roundNumber: 2,
            registeredDrones: [],
            teamAScore: 0,
            teamBScore: 0,
            status: 'pending',
            timerStatus: 'not_started',
            elapsedTime: 0
          }
        ]
      });

      await newMatch.save();
      console.log(`[OK] Created Match ${matchData.match}: ${matchData.teamA} vs ${matchData.teamB}`);
      created++;
    }

    console.log();
    console.log('[5/5] Summary:');
    console.log(`  - Matches created: ${created}`);
    console.log(`  - Matches skipped (already exist): ${skipped}`);
    console.log();

    console.log('========================================');
    console.log('  MATCHES CREATED SUCCESSFULLY!');
    console.log('========================================');
    console.log();
    console.log('[INFO] All matches are set to "scheduled" status');
    console.log('[INFO] Round will NOT end automatically');
    console.log('[INFO] Set scores manually in the UI');
    console.log();

    mongoose.connection.close();

  } catch (error) {
    console.error('\n[ERROR] Script failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
createMatches();
