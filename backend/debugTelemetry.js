// Debug script to check telemetry data
const mongoose = require('mongoose');
require('dotenv').config();

const DroneTelemetry = require('./models/DroneTelemetry');
const ESPDevice = require('./models/ESPDevice');
const Team = require('./models/Team');
const Match = require('./models/Match');

async function debugTelemetry() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    // 1. Check registered ESP devices
    console.log('========================================');
    console.log('📋 REGISTERED ESP DEVICES');
    console.log('========================================');
    const espDevices = await ESPDevice.find();
    console.log(`Total registered: ${espDevices.length}\n`);
    espDevices.forEach(esp => {
      console.log(`🔸 Drone: ${esp.droneId} | MAC: ${esp.macAddress} | Role: ${esp.role} | Status: ${esp.status}`);
    });

    // 2. Check current match
    console.log('\n========================================');
    console.log('🏟️  CURRENT MATCH');
    console.log('========================================');
    const currentMatch = await Match.findOne({ isCurrentMatch: true })
      .populate('teamA teamB');

    if (currentMatch) {
      console.log(`Match: ${currentMatch.teamA?.name || 'N/A'} vs ${currentMatch.teamB?.name || 'N/A'}`);
      console.log(`Status: ${currentMatch.status}`);
      console.log('\nRounds:');
      currentMatch.rounds.forEach(round => {
        console.log(`  Round ${round.roundNumber}: ${round.status}`);
        console.log(`    Registered drones: ${round.registeredDrones?.map(d => d.droneId).join(', ') || 'None'}`);
      });
    } else {
      console.log('⚠️  No current match set');
    }

    // 3. Check recent telemetry
    console.log('\n========================================');
    console.log('📡 RECENT TELEMETRY DATA');
    console.log('========================================');
    const recentTelemetry = await DroneTelemetry.find()
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`Total telemetry records: ${await DroneTelemetry.countDocuments()}`);
    console.log(`\nLast 10 entries:`);
    recentTelemetry.forEach(tele => {
      console.log(`  ${tele.droneId} | Match: ${tele.matchId} | Round: ${tele.roundNumber} | Logs: ${tele.logs.length} | Time: ${tele.createdAt.toLocaleString()}`);
    });

    // 4. Check telemetry for specific drone (R2)
    console.log('\n========================================');
    console.log('🔍 TELEMETRY FOR DRONE R2');
    console.log('========================================');
    const r2Telemetry = await DroneTelemetry.find({ droneId: 'R2' }).sort({ createdAt: -1 }).limit(5);

    if (r2Telemetry.length > 0) {
      console.log(`Found ${r2Telemetry.length} telemetry records for R2:`);
      r2Telemetry.forEach(tele => {
        console.log(`  Match: ${tele.matchId} | Round: ${tele.roundNumber} | Logs: ${tele.logs.length}`);
        console.log(`  First log: X=${tele.logs[0]?.x.toFixed(2)}, Y=${tele.logs[0]?.y.toFixed(2)}, Z=${tele.logs[0]?.z.toFixed(2)}`);
        console.log(`  Created: ${tele.createdAt.toLocaleString()}\n`);
      });
    } else {
      console.log('❌ No telemetry found for R2');
    }

    console.log('========================================');
    console.log('✅ Debug Complete');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugTelemetry();
