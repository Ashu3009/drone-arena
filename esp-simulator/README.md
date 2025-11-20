# 🚁 Virtual ESP32 Drone Simulator

Simulates ESP32-CAM drone behavior without physical hardware.

## ✅ Features

- **MQTT Communication**: Connects to MQTT broker and listens for commands
- **Realistic Telemetry**: Sends position, orientation, battery data every 1 second
- **Command Handling**: Responds to START, STOP, RESET commands
- **Random Movement**: Simulates drone flight with random walk algorithm
- **Battery Simulation**: Drains battery over time
- **Multiple Drones**: Run multiple instances for different drone IDs

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install paho-mqtt requests
```

### 2. Make Sure Backend is Running
```bash
# Backend should be on port 5000
# MQTT broker should be on port 1883
```

### 3. Run Simulator
```bash
cd esp-simulator
python virtual_drone.py
```

### 4. Expected Output
```
==================================================
🚁 VIRTUAL ESP32 DRONE SIMULATOR
==================================================
Drone ID: R1
MQTT Broker: localhost:1883
Backend: http://localhost:5000/api/telemetry
==================================================

📡 Connecting to MQTT...
✅ MQTT Connected!
   📡 Subscribed: drone/R1/config
   📡 Subscribed: drone/all/command

⏳ Waiting for commands...
```

### 5. Start Round from Admin Dashboard
- Login to Admin Dashboard
- Create/Select Match
- Register R1 drone
- Click "Start Round"

### 6. Simulator Will Show:
```
📨 MQTT Message: drone/R1/config
   Command: START
🚀 START COMMAND RECEIVED!
   Match ID: 673b1234567890abcdef
   Round: 1
   Status: active
⏱️  Telemetry thread started

📡 Telemetry sent: X=0.5, Y=0.5, Z=2.0, Battery=100.0%
📡 Telemetry sent: X=0.7, Y=0.6, Z=2.1, Battery=99.99%
📡 Telemetry sent: X=0.9, Y=0.4, Z=2.2, Battery=99.98%
...
```

## ⚙️ Configuration

Edit `virtual_drone.py` to change:

```python
DRONE_ID = "R1"  # Change to R2, R3, B1, B2, etc.
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
BACKEND_URL = "http://localhost:5000/api/telemetry"
```

## 🔢 Running Multiple Drones

Copy the file and change DRONE_ID:

```bash
# Terminal 1 - R1
python virtual_drone.py

# Terminal 2 - R2 (after editing DRONE_ID)
python virtual_drone_R2.py

# Terminal 3 - B1 (after editing DRONE_ID)
python virtual_drone_B1.py
```

## 🛑 Stop Simulator

Press `Ctrl+C` to stop gracefully.

## 📊 Telemetry Data Sent

```json
{
  "droneId": "R1",
  "matchId": "673b...",
  "teamId": "673a...",
  "roundNumber": 1,
  "timestamp": "2025-11-06T12:00:00.000Z",
  "position": {
    "x": 25.5,
    "y": 30.2,
    "z": 3.5
  },
  "orientation": {
    "pitch": 0.1,
    "roll": -0.05,
    "yaw": 1.2
  },
  "battery": 98.5,
  "status": "active"
}
```

## ✅ Benefits Over Physical Hardware

- ✅ No wiring issues
- ✅ No sensor detection problems
- ✅ No power supply issues
- ✅ Easy to debug
- ✅ Can run multiple drones simultaneously
- ✅ Consistent behavior for testing
- ✅ No hardware damage risk

## 🔧 Troubleshooting

### "Connection refused" error
- Make sure MQTT broker (Mosquitto) is running on port 1883
- Make sure backend is running on port 5000

### "No telemetry received"
- Check backend terminal for errors
- Verify DRONE_ID matches registered drone in Admin Dashboard

### "START command not received"
- Make sure you registered the drone before starting round
- Check MQTT broker logs
