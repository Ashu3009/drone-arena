# Drone Arena - Round Management Implementation Guide

## ✅ Already Completed:
1. Match model updated with timer fields
2. Round schema supports 16 drones (R1-R8, B1-B8)
3. DroneReport model created
4. Timer functions created (see TIMER_FUNCTIONS.js)

---

## 📋 TODO List (Step by Step):

### Phase 1: Backend APIs

#### 1. Add Timer Functions to Match Controller
- Open `backend/controllers/matchController.js`
- Copy functions from `TIMER_FUNCTIONS.js` and paste after `updateScore` function
- Add to module.exports: `pauseTimer, resumeTimer, resetTimer`

#### 2. Add Timer Routes
- Open `backend/routes/matchRoutes.js`
- Add after line 33:
```js
router.put('/:matchId/rounds/:roundNumber/pause', protect, pauseTimer);
router.put('/:matchId/rounds/:roundNumber/resume', protect, resumeTimer);
router.put('/:matchId/rounds/:roundNumber/reset', protect, resetTimer);
```
- Import in destructuring: `pauseTimer, resumeTimer, resetTimer`

#### 3. Update startRound to Initialize Timer
- In `startRound` function (line ~214), add:
```js
nextRound.timerStatus = 'running'; // ADD THIS LINE
```

#### 4. Update registerDrones API
- Find `registerDrones` function
- Change to accept `roundNumber` in params
- Update to register drones per round

---

### Phase 2: Frontend - Drone Registration UI

#### 1. Create DroneSelector Component
File: `frontend/src/components/Admin/DroneSelector.js`

```jsx
import React, { useState } from 'react';

const DroneSelector = ({ matchId, roundNumber, teamA, teamB, onRegister }) => {
  const [selectedDrones, setSelectedDrones] = useState({
    teamA: [],
    teamB: []
  });

  const redDrones = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8'];
  const blueDrones = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];

  const toggleDrone = (team, droneId) => {
    setSelectedDrones(prev => ({
      ...prev,
      [team]: prev[team].includes(droneId)
        ? prev[team].filter(d => d !== droneId)
        : [...prev[team], droneId]
    }));
  };

  const handleRegister = async () => {
    await onRegister(roundNumber, selectedDrones);
  };

  return (
    <div style={styles.container}>
      <h4>Register Drones for Round {roundNumber}</h4>

      <div style={styles.teamSection}>
        <h5>{teamA?.name} (Red Drones)</h5>
        <div style={styles.droneGrid}>
          {redDrones.map(droneId => (
            <button
              key={droneId}
              onClick={() => toggleDrone('teamA', droneId)}
              style={{
                ...styles.droneButton,
                backgroundColor: selectedDrones.teamA.includes(droneId) ? '#ff4444' : '#333'
              }}
            >
              {droneId}
            </button>
          ))}
        </div>
        <p>Selected: {selectedDrones.teamA.length} / 4</p>
      </div>

      <div style={styles.teamSection}>
        <h5>{teamB?.name} (Blue Drones)</h5>
        <div style={styles.droneGrid}>
          {blueDrones.map(droneId => (
            <button
              key={droneId}
              onClick={() => toggleDrone('teamB', droneId)}
              style={{
                ...styles.droneButton,
                backgroundColor: selectedDrones.teamB.includes(droneId) ? '#4444ff' : '#333'
              }}
            >
              {droneId}
            </button>
          ))}
        </div>
        <p>Selected: {selectedDrones.teamB.length} / 4</p>
      </div>

      <button onClick={handleRegister} style={styles.registerButton}>
        Register Drones
      </button>
    </div>
  );
};

const styles = {
  container: { padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px', marginBottom: '20px' },
  teamSection: { marginBottom: '20px' },
  droneGrid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px', marginBottom: '10px' },
  droneButton: { padding: '10px', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
  registerButton: { backgroundColor: '#4CAF50', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default DroneSelector;
```

---

### Phase 3: Timer Controls UI

#### 1. Create TimerDisplay Component
File: `frontend/src/components/Admin/TimerDisplay.js`

```jsx
import React, { useState, useEffect } from 'react';

const TimerDisplay = ({ round, matchId, onPause, onResume, onReset }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const MAX_TIME = 180; // 3 minutes

  useEffect(() => {
    if (round.timerStatus === 'running') {
      const interval = setInterval(() => {
        const now = Date.now();
        const start = new Date(round.startTime).getTime();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedTime(elapsed);

        // Auto end at 3 minutes
        if (elapsed >= MAX_TIME) {
          // Call end round API
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else if (round.timerStatus === 'paused') {
      setElapsedTime(round.elapsedTime);
    }
  }, [round]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remaining = MAX_TIME - elapsedTime;

  return (
    <div style={styles.container}>
      <div style={styles.timerDisplay}>
        <span style={styles.timeLabel}>Time Remaining:</span>
        <span style={{...styles.time, color: remaining < 30 ? '#ff4444' : '#4CAF50'}}>
          {formatTime(remaining)}
        </span>
      </div>

      <div style={styles.controls}>
        {round.timerStatus === 'running' && (
          <button onClick={() => onPause(matchId, round.roundNumber)} style={styles.pauseButton}>
            Pause
          </button>
        )}
        {round.timerStatus === 'paused' && (
          <button onClick={() => onResume(matchId, round.roundNumber)} style={styles.resumeButton}>
            Resume
          </button>
        )}
        <button onClick={() => onReset(matchId, round.roundNumber)} style={styles.resetButton}>
          Reset
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '20px' },
  timerDisplay: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '20px' },
  timeLabel: { fontSize: '18px', color: '#aaa' },
  time: { fontSize: '48px', fontWeight: 'bold', fontFamily: 'monospace' },
  controls: { display: 'flex', gap: '10px', justifyContent: 'center' },
  pauseButton: { backgroundColor: '#ff9800', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  resumeButton: { backgroundColor: '#4CAF50', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  resetButton: { backgroundColor: '#666', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
};

export default TimerDisplay;
```

---

### Phase 4: Update API Service

Add to `frontend/src/services/api.js`:

```js
// Timer controls
export const pauseTimer = async (matchId, roundNumber) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/pause`);
  return response.data;
};

export const resumeTimer = async (matchId, roundNumber) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/resume`);
  return response.data;
};

export const resetTimer = async (matchId, roundNumber) => {
  const response = await axios.put(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/reset`);
  return response.data;
};

// Drone registration
export const registerDronesForRound = async (matchId, roundNumber, drones) => {
  const response = await axios.post(`${API_BASE_URL}/matches/${matchId}/rounds/${roundNumber}/register-drones`, drones);
  return response.data;
};
```

---

### Phase 5: Cascade Delete for Reports

In `backend/controllers/matchController.js`, update `deleteMatch`:

```js
const DroneReport = require('../models/DroneReport');

const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Delete all reports for this match
    await DroneReport.deleteMany({ match: req.params.matchId });

    await Match.findByIdAndDelete(req.params.matchId);

    res.json({ success: true, message: 'Match and all reports deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

---

## 🎯 Next Steps After Implementation:

1. Test drone registration
2. Test timer pause/resume/reset
3. Test 3 min auto-end
4. Implement Reports UI
5. Update 3D Arena visualization

---

## 🚀 Quick Start Commands:

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm start

# Test Timer API
curl -X PUT http://localhost:5000/api/matches/MATCH_ID/rounds/1/pause \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Implementation Status:** Phase 1 (Models) ✅ | Phase 2-5 (APIs + UI) 🔄 In Progress
