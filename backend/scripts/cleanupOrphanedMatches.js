const mongoose = require('mongoose');
require('dotenv').config();

const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const DroneReport = require('../models/DroneReport');

async function cleanupOrphanedMatches() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all matches
    const allMatches = await Match.find({});
    console.log(`📊 Total matches in database: ${allMatches.length}`);

    let orphanedCount = 0;
    let deletedReportsCount = 0;

    for (const match of allMatches) {
      // Check if tournament exists
      const tournamentExists = await Tournament.findById(match.tournament);

      if (!tournamentExists) {
        console.log(`❌ Found orphaned match: ${match._id} (Tournament: ${match.tournament})`);

        // Delete associated drone reports first
        const deletedReports = await DroneReport.deleteMany({ match: match._id });
        deletedReportsCount += deletedReports.deletedCount || 0;

        // Delete the match
        await Match.findByIdAndDelete(match._id);
        orphanedCount++;
      }
    }

    console.log('\n✅ Cleanup Complete!');
    console.log(`🗑️  Deleted ${orphanedCount} orphaned matches`);
    console.log(`🗑️  Deleted ${deletedReportsCount} associated drone reports`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedMatches();
