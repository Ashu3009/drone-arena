# =====================================================
# TELEMETRY DEBUGGING SCRIPT
# Run this in PowerShell to debug performance analysis
# =====================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DRONE ARENA - TELEMETRY DEBUG SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check MongoDB Connection
Write-Host "[1] Checking MongoDB Connection..." -ForegroundColor Yellow
try {
    $mongoCheck = node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/drone-arena', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => { console.log('✅ MongoDB Connected'); process.exit(0); }).catch(err => { console.log('❌ MongoDB Error:', err.message); process.exit(1); });"
    Write-Host $mongoCheck -ForegroundColor Green
} catch {
    Write-Host "❌ MongoDB connection failed!" -ForegroundColor Red
    exit
}

# Step 2: Count all telemetry records
Write-Host "`n[2] Counting all telemetry records in database..." -ForegroundColor Yellow
$telemetryCount = node -e "const mongoose = require('mongoose'); const Telemetry = require('./backend/models/Telemetry'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const count = await Telemetry.countDocuments(); console.log(count); await mongoose.disconnect(); });"
Write-Host "Total telemetry records: $telemetryCount" -ForegroundColor $(if ($telemetryCount -gt 0) { "Green" } else { "Red" })

# Step 3: Check ESP devices registered
Write-Host "`n[3] Checking registered ESP devices..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const ESPDevice = require('./backend/models/ESPDevice'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const devices = await ESPDevice.find().select('droneId macAddress role -_id'); console.log('Registered ESP Devices:'); devices.forEach(d => console.log('  -', d.droneId, '(', d.role, ') - MAC:', d.macAddress)); await mongoose.disconnect(); });"

# Step 4: Check telemetry for each drone
Write-Host "`n[4] Checking telemetry records per drone..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const Telemetry = require('./backend/models/Telemetry'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const drones = ['R1', 'R2', 'R3', 'R4', 'B1', 'B2', 'B3', 'B4']; for (const droneId of drones) { const count = await Telemetry.countDocuments({ droneId }); console.log(droneId + ':', count, 'records'); } await mongoose.disconnect(); });"

# Step 5: Show latest telemetry for R2
Write-Host "`n[5] Latest telemetry for R2 (last 3 records)..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const Telemetry = require('./backend/models/Telemetry'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const data = await Telemetry.find({ droneId: 'R2' }).sort({ timestamp: -1 }).limit(3); if (data.length === 0) { console.log('❌ NO TELEMETRY DATA FOUND FOR R2'); } else { console.log('✅ Found', data.length, 'records:'); data.forEach((d, i) => { console.log(`  [${i+1}] Time:`, new Date(d.timestamp).toLocaleString(), '| accelX:', d.accelX, '| matchId:', d.matchId); }); } await mongoose.disconnect(); });"

# Step 6: Check current match
Write-Host "`n[6] Checking current match..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const Match = require('./backend/models/Match'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const match = await Match.findOne({ isCurrentMatch: true }).populate('teamA teamB tournament'); if (!match) { console.log('❌ No current match set'); } else { console.log('✅ Current Match:', match._id); console.log('  Teams:', match.teamA.name, 'vs', match.teamB.name); console.log('  Rounds:', match.rounds.length); match.rounds.forEach((r, i) => { console.log('    Round', r.roundNumber, '-', r.status, '- Drones:', r.registeredDrones.length); }); } await mongoose.disconnect(); });"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEBUG COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
