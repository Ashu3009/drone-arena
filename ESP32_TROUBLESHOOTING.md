# ESP32 + MPU6050 Troubleshooting Guide

## Current Status
- **ESP MAC**: 44:1D:64:F9:2D:14
- **Registered as**: R3 (Defender, Team 1)
- **Issue**: "Failed to find MPU6050 chip"

## MPU6050 Wiring Verification

### Correct Connections:
```
MPU6050          ESP32 DevKit V1
---------        ---------------
VCC       →      3.3V (NOT 5V!)
GND       →      GND
SDA       →      GPIO 21
SCL       →      GPIO 22
```

### Common Issues:
1. **Wrong voltage**: MPU6050 can work with 5V but 3.3V is safer for ESP32 I2C
2. **Loose connections**: Check if wires are firmly inserted
3. **Wrong pins**: Some boards label D21/D22 instead of GPIO21/22
4. **I2C address conflict**: MPU6050 default is 0x68, might be 0x69 if AD0 is HIGH

## Troubleshooting Steps

### 1. Power Cycle Everything
```bash
# Unplug ESP32 completely
# Wait 5 seconds
# Reconnect USB
```

### 2. Test I2C Communication
Upload this test code to verify MPU6050 is detected:
```cpp
#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  delay(1000);

  Serial.println("Scanning I2C bus...");
  byte count = 0;

  for (byte i = 1; i < 127; i++) {
    Wire.beginTransmission(i);
    if (Wire.endTransmission() == 0) {
      Serial.print("Found device at 0x");
      if (i < 16) Serial.print("0");
      Serial.println(i, HEX);
      count++;
    }
  }

  Serial.print("Found ");
  Serial.print(count);
  Serial.println(" device(s)");
}

void loop() {}
```

**Expected output**: Should show `Found device at 0x68` (or 0x69)

### 3. Check Main Code I2C Initialization
Your ESP32 code should have:
```cpp
Wire.begin(21, 22);  // SDA=21, SCL=22
mpu.initialize();

if (!mpu.testConnection()) {
  Serial.println("❌ Failed to find MPU6050 chip!");
}
```

### 4. Alternative: Software Workaround
If hardware is unstable, modify the code to send mock data for testing:
```cpp
// In esp32-code main file, add this fallback
if (!mpu.testConnection()) {
  Serial.println("⚠️  MPU6050 not found, using simulated data");
  useMockData = true;
}
```

## Next Phase: Performance Analysis Testing

Once hardware is working, follow these steps:

### 1. Verify Telemetry is Saving to Database
Run this after starting a round:
```bash
# While round is running, check if telemetry is being saved
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const Telemetry = require('./backend/models/Telemetry'); const data = await Telemetry.find({ droneId: 'R3' }).limit(5).sort({ timestamp: -1 }); console.log('Last 5 telemetry records for R3:', JSON.stringify(data, null, 2)); process.exit(); });"
```

### 2. Complete Match Flow
1. Go to Admin Dashboard
2. Set current match
3. Start Round 1
4. Let ESP send telemetry for 10-15 seconds
5. Click "End Round"
6. Go to Performance Reports
7. Select Tournament → Match → Round 1

### 3. Expected Results

#### If Working Correctly:
```
✅ R3 - Defender - Team 1
   Grade: B+ or similar
   Overall Score: 45-75
   Metrics showing actual values (not zeros)
```

#### If Still DISCONNECTED:
Indicates backend issue - telemetry not being saved or retrieved

### 4. Backend Debug Commands

Check if telemetry exists:
```bash
# Count telemetry records
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/drone-arena').then(async () => { const Telemetry = require('./backend/models/Telemetry'); const count = await Telemetry.countDocuments({ droneId: 'R3' }); console.log('Total telemetry records for R3:', count); process.exit(); });"
```

Check if analysis endpoint works:
```bash
# Replace MATCH_ID with actual match ID
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/analysis/round/MATCH_ID/1
```

## Zero Values Explanation

When you see zeros in telemetry:
```
X: 0.00, Y: 0.00, Z: 0.00
```

This is NORMAL when:
- MPU6050 is sitting still on desk
- No acceleration or rotation happening
- Sensor is in idle state

This is NOT the same as DISCONNECTED - zeros mean sensor is working but not moving.

## Quick Hardware Test

Try this quick verification:
1. Keep ESP connected and code running
2. Pick up the ESP32 board
3. Tilt it left/right/forward/backward
4. You should see X, Y, Z values change
5. If values stay at zero = sensor not working
6. If values change = sensor working correctly

## Decision Tree

```
Is telemetry showing in console?
├─ NO → Fix ESP32 code/wiring/power
└─ YES → Are values changing when you move board?
    ├─ NO → MPU6050 sensor failure or wiring issue
    └─ YES → Hardware is working!
        └─ Run match and check Performance Reports
            ├─ Shows DISCONNECTED → Backend not saving telemetry
            └─ Shows analysis with grades → ✅ SYSTEM WORKING!
```
