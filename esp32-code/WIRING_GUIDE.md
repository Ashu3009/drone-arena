# ESP32-CAM Wiring Guide (Without Camera)

## Hardware Required
- ESP32-CAM board (Camera module removed/not used)
- MPU6050 Gyro/Accelerometer sensor
- Jumper wires (4 wires minimum)
- USB to Serial adapter (FTDI or similar) for programming

---

## Wiring Connections

### MPU6050 → ESP32-CAM

| MPU6050 Pin | ESP32-CAM Pin | Description |
|-------------|---------------|-------------|
| **VCC**     | **3.3V**      | Power supply (NOT 5V!) |
| **GND**     | **GND**       | Ground |
| **SDA**     | **GPIO 21**   | I2C Data line |
| **SCL**     | **GPIO 22**   | I2C Clock line |

---

## Visual Wiring Diagram

```
MPU6050                    ESP32-CAM
┌─────────┐               ┌──────────┐
│         │               │          │
│   VCC   ├───────────────┤  3.3V    │
│   GND   ├───────────────┤  GND     │
│   SDA   ├───────────────┤  GPIO21  │
│   SCL   ├───────────────┤  GPIO22  │
│         │               │          │
└─────────┘               └──────────┘
```

---

## Important Notes

### ⚠️ Power Supply
- **ALWAYS use 3.3V for MPU6050** (NOT 5V!)
- Some MPU6050 modules can tolerate 5V, but 3.3V is safer
- ESP32-CAM provides 3.3V output pin

### ⚠️ GPIO Pin Selection
- **GPIO 21 and GPIO 22** are used because camera is removed
- If camera was present, we would use GPIO 14/15 to avoid conflicts
- These are standard I2C pins for ESP32

### ⚠️ I2C Address
- MPU6050 default address: **0x68**
- If AD0 pin is HIGH: **0x69**
- Our code uses default (0x68)

---

## Troubleshooting

### Problem: "Failed to find MPU6050 chip!"

**Solution Checklist:**

1. **Check Power**
   - Verify 3.3V connection
   - Check if MPU6050 LED is lit (if it has one)
   - Try connecting to 5V pin (some modules need it)

2. **Check Wiring**
   - Verify SDA → GPIO 21
   - Verify SCL → GPIO 22
   - Check for loose connections
   - Try different jumper wires

3. **I2C Scanner Test**
   - Run I2C scanner code to detect devices
   - Should show "Device found at 0x68" or "0x69"

4. **Try Different Pins**
   - If GPIO 21/22 don't work, try:
     - GPIO 14/15
     - GPIO 13/16
   - Update code with new pin numbers

5. **Check MPU6050 Module**
   - Try with a different MPU6050 module
   - Some modules are defective

---

## Testing Your Wiring

### Step 1: Upload Code
```
1. Open: esp32-code/ESP32_CAM_NoCamera.ino
2. Update WiFi SSID and Password
3. Update SERVER_URL with your computer's IP
4. Upload to ESP32-CAM
```

### Step 2: Open Serial Monitor
- Baud rate: **115200**
- You should see:
```
✅ WiFi Connected!
📍 IP Address: 10.93.x.x
✅ MPU6050 Found!
```

### Step 3: Register ESP
1. Copy the MAC address from Serial Monitor
2. Go to Admin Panel → ESP Devices
3. Register the MAC with a Drone ID (R1-R4, B1-B4)

### Step 4: Test Telemetry
1. Keep Serial Monitor open
2. Set current match in Admin Dashboard
3. Start a round
4. You should see:
```
📊 Telemetry Data:
   X: 1.23 | Y: -0.45 | Z: 9.81
   Pitch: 5.2° | Roll: -2.1° | Yaw: 0.0°/s
   ✅ Sent to backend
```

---

## MAC Address Reference

**Your Current MAC Addresses:**
- ESP32 DevKit: `44:1D:64:F9:2D:14` (Registered as R3)
- ESP32-CAM: `84:1F:E8:69:B9:A4` (Register this one)

---

## Files to Use

| File Name | Use Case |
|-----------|----------|
| `ESP32_DevKit_DroneArena.ino` | ESP32 DevKit V1 board |
| `ESP32_CAM_DroneArena.ino` | ESP32-CAM with camera |
| `ESP32_CAM_NoCamera.ino` | **ESP32-CAM without camera** ← USE THIS |

---

## Next Steps After Wiring

1. ✅ Connect wires properly
2. ✅ Upload `ESP32_CAM_NoCamera.ino`
3. ✅ Verify MPU6050 is detected
4. ✅ Check WiFi connection
5. ✅ Register MAC address in Admin Panel
6. ✅ Run test match
7. ✅ Check Performance Reports

---

## Quick Reference - Pin Numbers

**ESP32-CAM Pin Layout:**
```
     ┌─────────┐
     │  ESP32  │
     │   CAM   │
     ├─────────┤
  3V3├○       ○├GND
  GND├○       ○├GPIO1
GPIO3├○       ○├GPIO2
     ...
GPIO21├○      ○├GPIO22  ← I2C pins when camera removed
     ...
     └─────────┘
```

---

Good luck! 🚀
