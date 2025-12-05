# ESP32 Simulator - Usage Guide

## 🎯 Purpose

This Python script simulates an ESP32 DevKit V1 drone with MPU6050 sensor, allowing you to test the complete telemetry system **without physical hardware**.

## ✨ Features

✅ **Exact ESP32 Behavior:**
- Announces to backend with MAC address
- Checks registration status
- Sends heartbeat every 10 seconds
- Sends telemetry every 100ms (10 Hz)
- Auto-retry registration if not registered

✅ **Simulated Sensor Data:**
- 3 simulation modes: `static`, `moving`, `spinning`
- Realistic MPU6050 data (x, y, z, pitch, roll, yaw)
- Random noise for realistic behavior

✅ **Visual Terminal Output:**
- Color-coded messages
- Real-time telemetry display
- Status updates

## 📋 Requirements

### Install Python (if not already installed)

**Check if Python is installed:**
```bash
python --version
```

If not installed, download from: https://www.python.org/downloads/ (Python 3.7+)

### Install Required Libraries

```bash
pip install requests
```

That's it! Only 1 library needed.

## 🚀 Quick Start

### Step 1: Configure the Simulator

Open `esp32-simulator.py` and edit these lines:

```python
# Line 15-16: Server URL
SERVER_URL = "http://localhost:5000"  # For local testing
# SERVER_URL = "https://dronearena-backend.onrender.com"  # For deployed backend

# Line 19: MAC Address (Change this to test different ESPs)
MAC_ADDRESS = "AA:BB:CC:DD:EE:09"

# Line 24: Simulation Mode
SIMULATION_MODE = "moving"  # Options: "static", "moving", "spinning"
```

### Step 2: Run the Simulator

**Windows:**
```bash
cd c:\Users\ADMIN\Desktop\drone-arena\esp32-code
python esp32-simulator.py
```

**Alternative (double-click):**
Just double-click `esp32-simulator.py` file

### Step 3: Register in Admin Panel

When simulator starts, you'll see:
```
📡 MAC Address: AA:BB:CC:DD:EE:09
⚠️  ESP not registered yet!
👉 Please register this MAC via Admin Panel
```

**Go to Admin Panel:**
1. Open browser → Admin Dashboard
2. Click **"ESP Devices"**
3. Click **"+ Register ESP"**
4. Fill form:
   - **MAC Address:** `AA:BB:CC:DD:EE:09` (from simulator output)
   - **Drone ID:** `R1` (or R2-R8, B1-B8)
   - **Role:** `Forward` (or Striker/Defender/Keeper)
   - **Device Type:** `ESP32-Dev`
5. Click **"Register"**

### Step 4: Watch It Work!

After registration, simulator will automatically:
- Detect registration
- Start sending telemetry
- Show real-time data in terminal

**Terminal Output:**
```
✅ Registration Successful!
🆔 Drone ID: R1
⚡ Role: Forward
💓 Heartbeat sent
📊 Telemetry Data:
   X:   1.23 | Y:  -0.45 | Z:   9.81
   Pitch:   5.67° | Roll:  -3.21° | Yaw:   0.52°/s
```

**Admin Panel:**
- ESP status will show: 🟢 **Online**
- Last Seen: "Just now"

**Public Viewer (if match is running):**
- 3D visualization will show drone movement
- Real-time telemetry updates

## 🎮 Simulation Modes

### 1. Static Mode (`SIMULATION_MODE = "static"`)
- Drone stationary (hovering)
- Small random movements (sensor noise)
- Good for: Testing registration, heartbeat, basic telemetry

### 2. Moving Mode (`SIMULATION_MODE = "moving"`)
- Drone moves in circular pattern
- Realistic pitch/roll/yaw changes
- Good for: Testing 3D visualization, movement tracking
- **Default mode** - Most realistic

### 3. Spinning Mode (`SIMULATION_MODE = "spinning"`)
- Drone tumbling/spinning (crash scenario)
- Random extreme movements
- Good for: Testing error handling, extreme values

## 📊 Testing Multiple Drones

**Run multiple simulators simultaneously:**

### Method 1: Multiple Terminal Windows
1. Copy `esp32-simulator.py` to `esp32-simulator-R1.py`, `esp32-simulator-R2.py`, etc.
2. Edit each file with different MAC addresses:
   ```python
   # esp32-simulator-R1.py
   MAC_ADDRESS = "AA:BB:CC:DD:EE:01"

   # esp32-simulator-R2.py
   MAC_ADDRESS = "AA:BB:CC:DD:EE:02"
   ```
3. Run each in separate terminal:
   ```bash
   python esp32-simulator-R1.py
   python esp32-simulator-R2.py
   ```

### Method 2: Batch Script (Windows)

Create `run-multiple-drones.bat`:
```batch
@echo off
start python esp32-simulator-R1.py
start python esp32-simulator-R2.py
start python esp32-simulator-R3.py
start python esp32-simulator-R4.py
```

## 🧪 Testing Scenarios

### Scenario 1: Basic Registration Test
1. Start simulator with new MAC
2. Verify "ESP not registered" message
3. Register via admin panel
4. Verify auto-detection and telemetry start

### Scenario 2: Reconnection Test
1. Stop simulator (Ctrl+C)
2. Wait 30 seconds (ESP should go offline)
3. Restart simulator
4. Verify it comes back online

### Scenario 3: Match Telemetry Test
1. Register 4 simulators (R1, R2, B1, B2)
2. Create match in admin panel
3. Select these drones for round
4. Start round
5. Watch real-time telemetry in public viewer

### Scenario 4: Performance Test (16 Drones)
1. Run 16 simulators simultaneously
2. All registered (R1-R8, B1-B8)
3. Verify backend handles all telemetry
4. Check Socket.io real-time updates

## ⚙️ Advanced Configuration

### Change Telemetry Rate
```python
TELEMETRY_INTERVAL = 0.1  # 10 Hz (default)
TELEMETRY_INTERVAL = 0.05  # 20 Hz (faster)
TELEMETRY_INTERVAL = 0.2   # 5 Hz (slower)
```

### Change Heartbeat Interval
```python
HEARTBEAT_INTERVAL = 10  # 10 seconds (default)
HEARTBEAT_INTERVAL = 5   # 5 seconds (more frequent)
```

### Custom Movement Pattern
Edit `generate_sensor_data()` function to create custom patterns:
```python
elif mode == "figure8":
    # Figure-8 pattern
    angle = angular_velocity * simulation_time
    x = radius * math.sin(angle)
    y = radius * math.sin(2 * angle) / 2
```

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"
**Problem:** Backend server not running or wrong URL

**Fix:**
- Check `SERVER_URL` in script
- Verify backend is running (`npm start` in backend folder)
- For deployed backend, use full URL: `https://dronearena-backend.onrender.com`

### Error: "ModuleNotFoundError: No module named 'requests'"
**Problem:** requests library not installed

**Fix:**
```bash
pip install requests
```

### Simulator shows registered but no telemetry
**Problem:** Match not started or drone not selected

**Fix:**
- Create match in admin panel
- Start round with registered drones
- Check admin panel shows round as "in_progress"

### Multiple simulators conflict
**Problem:** Using same MAC address

**Fix:**
- Each simulator must have **unique MAC address**
- Edit `MAC_ADDRESS` in each copy

## 📝 MAC Address Format

**Valid formats:**
```
AA:BB:CC:DD:EE:01
AA:BB:CC:DD:EE:02
...
AA:BB:CC:DD:EE:FF
```

**Recommended for testing:**
- Red Team: `AA:BB:CC:DD:EE:01` to `AA:BB:CC:DD:EE:08`
- Blue Team: `BB:BB:CC:DD:EE:01` to `BB:BB:CC:DD:EE:08`

## 🎯 Next Steps After Testing

Once simulator works perfectly:

1. ✅ **Backend APIs verified** - Announce, heartbeat, telemetry working
2. ✅ **Admin Panel tested** - Registration, status tracking working
3. ✅ **Real-time updates tested** - Socket.io, 3D visualization working
4. 🔌 **Connect Real ESP32** - Just upload Arduino code, same behavior!

Real ESP32 will work **exactly the same** as simulator because:
- Same API endpoints
- Same data format
- Same registration flow
- Same telemetry structure

## 💡 Tips

- **Keep simulator running** during frontend development
- **Test edge cases** - disconnection, re-registration
- **Simulate match scenarios** - multiple drones, round start/end
- **Check network tab** in browser dev tools to see real-time updates

## 🚀 Production Deployment

When deploying to production:

1. Update `SERVER_URL` to deployed backend
2. Real ESP32 devices will have actual MAC addresses
3. Register real MACs in admin panel
4. Remove simulator registrations

---

**Happy Testing!** 🎉

Any issues? Check backend logs and simulator terminal output for errors.
