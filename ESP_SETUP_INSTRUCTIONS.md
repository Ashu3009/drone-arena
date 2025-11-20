# ESP32 Drone R1 Setup Instructions

## Required Libraries (Arduino IDE):
1. **Adafruit MPU6050** (by Adafruit)
2. **Adafruit Unified Sensor** (by Adafruit)
3. **ArduinoJson** (by Benoit Blanchon) - Version 6.x
4. **PubSubClient** (by Nick O'Leary) - For MQTT

## Board Setup:
1. File → Preferences → Additional Board URLs:
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```

2. Tools → Board → ESP32 Arduino → **AI Thinker ESP32-CAM**

3. Upload Settings:
   - Upload Speed: **115200**
   - Flash Frequency: **80MHz**
   - Flash Mode: **QIO**
   - Partition Scheme: **Huge APP (3MB No OTA)**
   - Core Debug Level: **None**

## WiFi & Network Configuration:
- **WiFi SSID**: The Student Scoop
- **WiFi Password**: TSS@2023
- **MQTT Broker IP**: 192.168.0.64
- **MQTT Port**: 1883
- **Backend Server**: http://192.168.0.64:5000

## Drone Configuration (R1):
```cpp
const char* droneId = "R1";  // ← This is your drone ID
```

## Upload Process:
1. Connect ESP32-CAM to FTDI programmer
2. **IMPORTANT**: Connect GPIO 0 to GND (Programming mode)
3. Press RESET button on ESP32
4. Click Upload in Arduino IDE
5. When "Connecting..." appears, press RESET again
6. Wait for upload to complete
7. **DISCONNECT GPIO 0 from GND**
8. Press RESET one final time
9. Open Serial Monitor (115200 baud)

## Expected Serial Output:
```
================================
🚁 ESP32 DRONE WITH MQTT
================================
Drone ID: R1

🔧 Initializing MPU-6050...
✅ MPU-6050 Found!

📊 Calibrating...
✅ Calibration Complete!

📡 Connecting to WiFi...
✅ WiFi Connected!
   IP: 192.168.0.XXX
   RSSI: -XX dBm

📡 Setting up MQTT...
✅ MQTT Connected!
📍 Subscribed to: drone/R1/cmd

🚁 Drone R1 Ready!
Waiting for commands...
```

## Testing:
1. Backend should be running on port 5000
2. MQTT broker should be running on port 1883
3. From Admin Dashboard:
   - Create match
   - Set as current
   - Select drones (including R1)
   - Start round
4. ESP32 Serial Monitor will show:
   ```
   📩 MQTT MESSAGE
   🚀 DRONE ACTIVATED
      Match ID: xxxxx
      Round: 1
   ```

## Troubleshooting:
- **MPU-6050 NOT FOUND**: Check I2C wiring (SDA=GPIO15, SCL=GPIO14)
- **WiFi Failed**: Check WiFi credentials
- **MQTT Failed**: Check broker IP (192.168.0.64) and port (1883)
- **Upload Failed**: Make sure GPIO 0 is connected to GND during upload