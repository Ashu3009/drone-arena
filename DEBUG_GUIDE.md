# 🐛 Debugging Guide - Drone Live & Reports Not Showing

## Problem: Drones not appearing in 3D Arena & Reports missing

### Quick Checks:

#### 1. Backend Server Running?
```bash
# Check if port 5000 is active
netstat -ano | findstr "5000"
```
**Expected**: Should show LISTENING on port 5000

#### 2. Frontend Server Running?
```bash
# Check if port 3000 is active
netstat -ano | findstr "3000"
```
**Expected**: Should show LISTENING on port 3000

#### 3. Socket.io Connected?
- Open browser console (F12) at http://localhost:3000
- Look for: `✅ Socket.io connected: [socket-id]`
- If not connected, check backend logs for Socket.io initialization

#### 4. Match Setup Correct?
**Required Steps:**
1. ✅ Tournament created
2. ✅ Teams created (Team A, Team B)
3. ✅ Match created with both teams
4. ✅ "Set Current Match" clicked
5. ✅ Drones selected (e.g., R1, R2, B1, B2)
6. ✅ Round started (click "Start Round")

**Check in browser console:**
```javascript
// Should see in console:
"🔗 Joined match room: [match-id]"
"Round started: {roundNumber: 1, ...}"
```

---

## Testing Live Drones (Simulation)

### Step 1: Verify Backend
```bash
cd backend
npm run dev
```

**Backend Console Output (Expected):**
```
🚀 Server running on port 5000
📡 Socket.io ready for real-time updates
✅ MQTT Broker connected
MongoDB Connected
```

### Step 2: Start Match
1. Go to: http://localhost:3000/admin/login
2. Login with admin credentials
3. Match Manager → Select/Create Match
4. Click "Set Current Match"
5. Select drones (R1, R2 for Red, B1, B2 for Blue)
6. Click "Start Round"

**Expected in Backend Console:**
```
Round 1 started for match [match-id]
```

### Step 3: Run Telemetry Simulation
```bash
cd backend
node testTelemetry.js
```

**Expected Output:**
```
🚀 Starting drone telemetry simulation...
📋 Match: Team A vs Team B
🔄 Round: 1
🆔 Match ID: [match-id]
✅ Active drones: R1, R2, B1, B2
🎬 Starting 30-second simulation...

✈️  R1: [300, 0, 150] - Logs: 1
✈️  R1: [298, 52, 155] - Logs: 2
⚡ B1: [120, -180, 200] - Aggressive mode
⚡ B2: [-50, 220, 180] - Aggressive mode
```

### Step 4: Check 3D Arena
1. Open Public View: http://localhost:3000
2. Look for "3D Arena View" section
3. Should see colored spheres moving:
   - **Red spheres** (R1, R2) - Circular flight
   - **Blue spheres** (B1, B2) - Aggressive movement

**If NOT showing drones:**

#### Browser Console Check (F12):
```javascript
// Should see:
✅ Socket.io connected: xyz123
🔗 Joined match room: [match-id]

// When telemetry arrives:
{droneId: "R1", x: 300, y: 0, z: 150, ...}
```

#### Common Issues:

**Issue 1: Socket.io not connecting**
- **Fix**: Restart backend server
- **Check**: Backend logs for Socket.io initialization

**Issue 2: No telemetry events**
- **Check Backend Console**: Should see `📡 Telemetry appended: R1 [2 logs]`
- **If missing**: Backend not receiving telemetry
- **Fix**: Check testTelemetry.js has correct API_URL

**Issue 3: Drones in Arena but not moving**
- **Check**: Browser console for telemetry data
- **If telemetry arriving but not rendering**: Check Arena3D scale (line 63)
- **Current scale**: 0.01 (1cm = 0.01 units)
- **Adjust if needed**: Try scale = 0.02 for larger movements

---

## Reports Not Showing

### When are reports created?
Reports are generated **AFTER** round ends:
1. Round starts → Timer running
2. Telemetry collected during round
3. Click "End Round" → **Reports generated here**
4. Go to "Reports" tab → View drone reports

### Check Reports:

#### Backend - DroneReport Creation
After ending round, backend console should show:
```
📊 Report created for R1: { score, batteryUsed, stabilityScore }
📊 Report created for R2: { score, batteryUsed, stabilityScore }
```

**If NOT showing:**
- Check [matchController.js:endRound()](backend/controllers/matchController.js) around line 200
- Should call DroneReport.create() for each drone

#### Frontend - Reports Display
1. Admin Dashboard → Click "Reports" tab
2. Should show hierarchy:
   - Tournament Name
     - Match: Team A vs Team B
       - Round 1
         - R1 Report (score, battery, stability)
         - R2 Report
       - Round 2
         - ...

**If Reports tab empty:**

**Check API Response:**
```bash
# Test API directly
curl http://localhost:5000/api/drone-reports?tournamentId=[your-tournament-id]
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "droneId": "R1",
      "roundNumber": 1,
      "batteryUsage": {...},
      "stabilityScore": 85,
      "bonusPoints": 15
    }
  ]
}
```

**If empty array:**
- Reports not created during endRound
- Check matchController.js:endRound() function
- Verify telemetry was collected before ending round

---

## Complete Test Flow

### 1. Setup (One time)
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 2. Create Match
1. http://localhost:3000/admin/login
2. Create Tournament, Teams, Match
3. Set Current Match
4. Register drones: R1, R2, B1, B2
5. Start Round

### 3. Send Telemetry
```bash
# Terminal 3 - Simulation
cd backend
node testTelemetry.js
```

**Watch for:**
- Backend console: `📡 Telemetry appended: R1 [X logs]`
- Public view: Drones moving in 3D Arena
- Browser console: Telemetry events arriving

### 4. End Round & Check Reports
1. Admin Dashboard → End Round
2. Backend console: `📊 Report created for R1`
3. Admin Dashboard → Reports tab
4. Should see Round 1 reports for all drones

---

## Still Not Working?

### Debug Mode - Detailed Logs

#### Backend Console Logs:
```javascript
// Add to telemetryController.js after line 31
console.log('📍 Telemetry data:', { droneId, x, y, z, matchId, logsCount: telemetry.logs.length });

// Add to matchController.js in endRound after report creation
console.log('📊 Report saved:', report);
```

#### Frontend Console Logs:
```javascript
// PublicViewer.js - Check telemetry state
useEffect(() => {
  console.log('📊 Current telemetry data:', telemetryData);
}, [telemetryData]);
```

### Network Tab Check:
1. Open browser DevTools (F12)
2. Network tab → WS (WebSocket)
3. Should see Socket.io connection
4. Click on WS connection → Messages tab
5. Should see `2["telemetry", {...}]` when simulation runs

---

## Quick Fix Commands

```bash
# Restart everything
# Kill all Node processes
taskkill /F /IM node.exe

# Start fresh
cd backend && npm run dev
# In new terminal:
cd frontend && npm start

# Test telemetry
cd backend && node testTelemetry.js
```

---

## Expected Console Outputs

### Backend (Healthy):
```
🚀 Server running on port 5000
📡 Socket.io ready for real-time updates
✅ MQTT Broker connected
MongoDB Connected
📡 Telemetry appended: R1 [5 logs]
📡 Telemetry appended: R2 [3 logs]
📊 Report created for R1: score=125
```

### Frontend (Healthy):
```
✅ Socket.io connected: abc123
🔗 Joined match room: 507f1f77bcf86cd799439011
Round started: {roundNumber: 1, status: 'in_progress'}
Telemetry: {droneId: 'R1', x: 300, y: 0, z: 150}
```

### Simulation (Healthy):
```
🚀 Starting drone telemetry simulation...
📋 Match: Team Red vs Team Blue
✅ Active drones: R1, R2, B1, B2
✈️  R1: [300, 0, 150] - Logs: 15
⚡ B1: [120, -180, 200] - Aggressive mode
🛑 R1 simulation complete
```