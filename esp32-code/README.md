# ESP32 Drone Arena - Arduino Code

## 📁 Files

1. **ESP32_Dev_DroneArena.ino** - For ESP32 DevKit V1 Type-C
2. **ESP32_CAM_DroneArena.ino** - For ESP32-CAM MB

## 🔧 Hardware Setup

### ESP32 DevKit V1 + MPU6050
```
MPU6050 → ESP32 Dev
VCC     → 3.3V
GND     → GND
SDA     → GPIO 21
SCL     → GPIO 22
```

### ESP32-CAM + MPU6050
```
MPU6050 → ESP32-CAM
VCC     → 3.3V
GND     → GND
SDA     → GPIO 14
SCL     → GPIO 15
```

**Note:** ESP32-CAM uses different I2C pins (GPIO14/15) to avoid conflicts with the camera module.

## 📚 Required Libraries

Install these libraries via Arduino IDE Library Manager:

1. **Adafruit MPU6050** (by Adafruit)
2. **Adafruit Unified Sensor** (by Adafruit)
3. **ArduinoJson** (by Benoit Blanchon) - Version 6.x

Built-in libraries (no installation needed):
- WiFi.h
- HTTPClient.h
- Wire.h

## 🚀 Installation Steps

### 1. Install Arduino IDE
- Download from: https://www.arduino.cc/en/software
- Install latest version (2.x recommended)

### 2. Install ESP32 Board Support
1. Open Arduino IDE
2. Go to `File` → `Preferences`
3. Add to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to `Tools` → `Board` → `Boards Manager`
5. Search "ESP32" and install "esp32 by Espressif Systems"

### 3. Install Libraries
1. Go to `Tools` → `Manage Libraries`
2. Search and install:
   - "Adafruit MPU6050"
   - "Adafruit Unified Sensor"
   - "ArduinoJson" (Version 6.x)

### 4. Configure Board
**For ESP32 DevKit V1:**
- Board: "ESP32 Dev Module"
- Upload Speed: 115200
- CPU Frequency: 240MHz
- Flash Frequency: 80MHz
- Flash Mode: QIO
- Flash Size: 4MB
- Partition Scheme: Default
- Port: (Select your COM port)

**For ESP32-CAM:**
- Board: "AI Thinker ESP32-CAM"
- Upload Speed: 115200
- CPU Frequency: 240MHz
- Flash Frequency: 80MHz
- Flash Mode: QIO
- Flash Size: 4MB
- Partition Scheme: Default
- Port: (Select your COM port)

**Note:** ESP32-CAM requires FTDI programmer for uploading. Connect:
- FTDI RX → ESP32-CAM TX
- FTDI TX → ESP32-CAM RX
- FTDI GND → ESP32-CAM GND
- FTDI 5V → ESP32-CAM 5V
- Short GPIO0 to GND during upload, then remove

### 5. Update Server URL
Before uploading, update the backend URL in the code:

```cpp
const char* SERVER_URL = "https://your-backend-url.onrender.com";
```

Replace with your actual deployed backend URL.

## 📡 WiFi Configuration

Current settings:
```cpp
const char* WIFI_SSID = "AAAA";
const char* WIFI_PASSWORD = "12345678";
```

To change WiFi credentials, edit these lines in the .ino file.

## 🔄 How It Works

### 1. Boot Sequence
1. ESP32 powers on
2. Reads its MAC address (permanent hardware ID)
3. Connects to WiFi network "AAAA"
4. Initializes MPU6050 sensor
5. Announces to backend: `GET /api/esp/announce?mac=XX:XX:XX:XX:XX:XX`

### 2. Registration Check
- Backend checks if MAC is registered
- If **registered**: Returns droneId (R1-R8, B1-B8) and role
- If **not registered**: Shows warning, waits for admin registration

### 3. Main Loop (when registered)
- **Every 100ms (10 Hz)**: Send telemetry data
  - Reads MPU6050 sensor (x, y, z, pitch, roll, yaw)
  - POST to `/api/telemetry`
- **Every 10 seconds**: Send heartbeat to stay online
  - POST to `/api/esp/heartbeat`

### 4. Backend Intelligence
- Backend receives MAC address + sensor data
- Backend determines current match, team, round automatically
- No hardcoded values in ESP code!

## 🧪 Testing

### 1. Upload Code
1. Connect ESP32 via USB
2. Select correct board and port
3. Click "Upload" button
4. Wait for "Done uploading" message

### 2. Open Serial Monitor
1. Go to `Tools` → `Serial Monitor`
2. Set baud rate to **115200**
3. Watch for boot messages

### Expected Output:
```
========================================
ESP32 Drone Arena - Starting Up
========================================
📡 MAC Address: AA:BB:CC:DD:EE:01
🔌 I2C Initialized (SDA=21, SCL=22)
🔧 Initializing MPU6050...
✅ MPU6050 Found!
⚙️  MPU6050 Configuration:
   Accelerometer: ±8G
   Gyroscope: ±500°/s
   Filter: 21 Hz
📶 Connecting to WiFi: AAAA
.....
✅ WiFi Connected!
📍 IP Address: 192.168.x.x
📢 Announcing to backend...
🌐 URL: https://dronearena-backend.onrender.com/api/esp/announce?mac=AA:BB:CC:DD:EE:01
📥 Response: {"success":true,"registered":true,"data":{"droneId":"R1","role":"Forward"}}
✅ Registration Successful!
🆔 Drone ID: R1
⚡ Role: Forward
========================================
✅ Setup Complete - Starting Main Loop
========================================

💓 Heartbeat sent
📊 Telemetry Data:
   X: 0.12 | Y: 0.03 | Z: 9.81
   Pitch: 1.23° | Roll: -0.45° | Yaw: 0.02°/s
```

### 3. Register ESP in Admin Panel
If you see "⚠️ ESP not registered yet!", follow these steps:

1. Go to Admin Dashboard
2. Click "ESP Devices"
3. Click "+ Register ESP"
4. Enter:
   - **MAC Address**: (from Serial Monitor output)
   - **Drone ID**: R1, R2, ... B8
   - **Role**: Forward/Striker/Defender/Keeper
   - **Device Type**: ESP32-Dev or ESP32-CAM
5. Click "Register"
6. Reset ESP (press RESET button or power cycle)
7. ESP will auto-announce and get its identity

## 🐛 Troubleshooting

### MPU6050 Not Found
- Check wiring (VCC, GND, SDA, SCL)
- Verify I2C address (default: 0x68)
- Try I2C scanner sketch to detect device

### WiFi Connection Failed
- Verify WiFi credentials (SSID and password)
- Check WiFi signal strength
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

### Backend Connection Failed
- Verify SERVER_URL is correct
- Check if backend is running
- Test URL in browser: `https://your-backend.com/api/esp/announce?mac=AA:BB:CC:DD:EE:01`

### Upload Failed (ESP32-CAM)
- Ensure GPIO0 is grounded during upload
- Remove GPIO0 ground wire after upload
- Press RESET button after upload
- Check FTDI connections

## 📊 Data Format

### Telemetry Payload (POST /api/telemetry)
```json
{
  "macAddress": "AA:BB:CC:DD:EE:01",
  "droneId": "R1",
  "sensorData": {
    "x": 0.12,
    "y": 0.03,
    "z": 9.81,
    "pitch": 1.23,
    "roll": -0.45,
    "yaw": 0.02
  }
}
```

### Heartbeat Payload (POST /api/esp/heartbeat)
```json
{
  "mac": "AA:BB:CC:DD:EE:01",
  "ipAddress": "192.168.1.100"
}
```

## 🔮 Future Enhancements

- [ ] EEPROM storage for WiFi credentials
- [ ] WiFiManager for web-based configuration
- [ ] ESP32-CAM image streaming
- [ ] Battery voltage monitoring
- [ ] Advanced sensor calibration
- [ ] OTA (Over-The-Air) firmware updates

## 📞 Support

If you encounter issues:
1. Check Serial Monitor output
2. Verify hardware connections
3. Test with simple MPU6050 example sketch first
4. Check backend logs for errors
5. Ensure ESP is registered in admin panel
