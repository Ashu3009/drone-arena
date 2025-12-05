# =====================================================
# TELEMETRY DEBUGGING SCRIPT (FIXED)
# Run this in PowerShell to debug performance analysis
# =====================================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DRONE ARENA - TELEMETRY DEBUG SCRIPT" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Change to backend directory
cd c:\Users\ADMIN\Desktop\drone-arena\backend

# Step 1: Check MongoDB Connection
Write-Host "[1] Checking MongoDB Connection..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/drone-arena', {useNewUrlParser: true, useUnifiedTopology: true}).then(() => { console.log('✅ MongoDB Connected'); mongoose.disconnect(); }).catch(err => { console.log('❌ MongoDB Error:', err.message); process.exit(1); });"

# Step 2: Count all telemetry records (DroneTelemetry model)
Write-Host "`n[2] Counting all telemetry records in database..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const DroneTelemetry = require('./models/DroneTelemetry'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const count = await DroneTelemetry.countDocuments(); console.log('✅ Total telemetry records:', count); if (count === 0) { console.log('❌ NO TELEMETRY RECORDS FOUND! ESP is not sending data or not being saved.'); } await mongoose.disconnect(); });"

# Step 3: Check ESP devices registered
Write-Host "`n[3] Checking registered ESP devices..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const ESPDevice = require('./models/ESPDevice'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const devices = await ESPDevice.find().select('droneId macAddress role -_id'); console.log('✅ Registered ESP Devices:'); if (devices.length === 0) { console.log('❌ NO ESP DEVICES REGISTERED!'); } else { devices.forEach(d => console.log('  -', d.droneId, '(', d.role, ') - MAC:', d.macAddress)); } await mongoose.disconnect(); });"

# Step 4: Check telemetry for each drone
Write-Host "`n[4] Checking telemetry records per drone..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const DroneTelemetry = require('./models/DroneTelemetry'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const drones = ['R1', 'R2', 'R3', 'R4', 'B1', 'B2', 'B3', 'B4']; for (const droneId of drones) { const count = await DroneTelemetry.countDocuments({ droneId }); const indicator = count > 0 ? '✅' : '❌'; console.log(indicator, droneId + ':', count, 'records'); } await mongoose.disconnect(); });"

# Step 5: Show latest telemetry for each drone
Write-Host "`n[5] Latest telemetry for each registered drone..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const DroneTelemetry = require('./models/DroneTelemetry'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const drones = ['R1', 'R2', 'R3', 'R4', 'B1', 'B2', 'B3', 'B4']; for (const droneId of drones) { const data = await DroneTelemetry.findOne({ droneId }).sort({ 'logs.timestamp': -1 }); if (data) { const lastLog = data.logs[data.logs.length - 1]; console.log('✅', droneId, '- Match:', data.matchId, '| Round:', data.roundNumber, '| Logs:', data.logs.length, '| Last:', new Date(lastLog.timestamp).toLocaleTimeString()); } } await mongoose.disconnect(); });"

# Step 6: Check current match
Write-Host "`n[6] Checking current match..." -ForegroundColor Yellow
node -e "const mongoose = require('mongoose'); const Match = require('./models/Match'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const match = await Match.findOne({ isCurrentMatch: true }).populate('teamA teamB tournament'); if (!match) { console.log('❌ NO CURRENT MATCH SET! Set a match as current first.'); } else { console.log('✅ Current Match ID:', match._id); console.log('  Teams:', match.teamA.name, 'vs', match.teamB.name); console.log('  Status:', match.status); console.log('  Rounds:', match.rounds.length); match.rounds.forEach((r, i) => { console.log('    Round', r.roundNumber, '-', r.status, '- Drones:', r.registeredDrones.map(d => d.droneId).join(', ')); }); } await mongoose.disconnect(); });"

# Step 7: Test telemetry API endpoint
Write-Host "`n[7] Testing Telemetry API Endpoint..." -ForegroundColor Yellow
Write-Host "Sending test telemetry data..." -ForegroundColor Gray
$testPayload = @{
    macAddress = "44:1D:64:F9:2D:14"
    sensorData = @{
        x = 5.5
        y = -3.2
        z = 9.8
        pitch = 10.0
        roll = -5.0
        yaw = 45.0
        battery = 85
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/telemetry/receive" -Method POST -Body $testPayload -ContentType "application/json"
    Write-Host "✅ Telemetry API Response:" -ForegroundColor Green
    Write-Host "   Success: $($response.success)" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Green
    Write-Host "   Drone ID: $($response.droneId)" -ForegroundColor Green
    if ($response.logsCount) {
        Write-Host "   Logs Count: $($response.logsCount)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Telemetry API Error:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEBUG COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "`nNEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. If telemetry count is 0, ESP is not sending data" -ForegroundColor White
Write-Host "2. If no current match, set one in Admin Dashboard" -ForegroundColor White
Write-Host "3. If no active round, start a round first" -ForegroundColor White
Write-Host "4. Check ESP Serial Monitor to see if it is sending data" -ForegroundColor White
Write-Host "5. Run this script AFTER ending a round to verify data" -ForegroundColor White
Write-Host "" -ForegroundColor White
