// Clear old drone reports from database
const mongoose = require('mongoose');
require('dotenv').config();

const DroneReport = require('./models/DroneReport');

async function clearReports() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Delete all existing drone reports
    const result = await DroneReport.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} old reports`);

    console.log('✅ Done! Now re-generate reports by clicking on rounds again.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearReports();
