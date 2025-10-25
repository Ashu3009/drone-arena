// ================================================================
// 🚁 DRONE ARENA - ESP32-CAM + MPU-6050 TELEMETRY
// ================================================================

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

// ==================== CONFIGURATION =============================

// WiFi Credentials
const char* ssid = "The Student Scoop";           // ✏️ Tumhara WiFi
const char* password = "TSS@2023";                // ✏️ Tumhara Password

// Backend Server URL
const char* serverUrl = "http://192.168.0.129:5000/api/telemetry";

// Match Configuration
String matchId = "68fcbc92bc22cc629817afa0";      // ✏️ Backend se copy karo
String teamId = "68f88b24e557ffe58546ca66";       // ✏️ Team ID
String droneId = "R2";                             // ✏️ R1, R2, R3

// ==================== HARDWARE SETUP ==============================

// I2C Pins for ESP32-CAM (MPU-6050)
#define I2C_SDA 15  // GPIO 15
#define I2C_SCL 14  // GPIO 14

// Status LED (ESP32-CAM flash LED)
#define STATUS_LED 33

// ==================== GLOBAL VARIABLES ====================

// MPU6050 Sensor Object
Adafruit_MPU6050 mpu;

// Position (simulated - add GPS later)
float x = 25.0;  // Start at center of 50x50 arena
float y = 25.0;
float z = 2.0;   // 2 meter altitude

// Orientation (FROM MPU-6050!)
float pitch = 0.0;
float roll = 0.0;
float yaw = 0.0;

// Battery (simulated)
int battery = 100;

// Timing
unsigned long lastSendTime = 0;
const int sendInterval = 200;  // 200ms = 5Hz

// Statistics
int successCount = 0;
int errorCount = 0;

// Calibration offsets (will be calculated during setup)
float pitchOffset = 0.0;
float rollOffset = 0.0;
float yawOffset = 0.0;

// ==================== SETUP ====================

void setup() {
  Serial.begin(115200);
  delay(2000);  // Give time for serial monitor to open
  
  Serial.println("\n\n================================");
  Serial.println("🚁 ESP32-CAM + MPU-6050 DRONE");
  Serial.println("================================");
  
  // Setup Status LED
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);
  
  // Startup blink
  blinkLED(3, 200);
  
  // ======== Initialize I2C Communication ========
  Serial.println("\n🔧 Initializing I2C...");
  Wire.begin(I2C_SDA, I2C_SCL);
  delay(100);
  
  // ======== Initialize MPU-6050 Sensor ========
  Serial.println("🔧 Initializing MPU-6050...");
  
  if (!mpu.begin()) {
    Serial.println("❌ MPU-6050 NOT FOUND!");
    Serial.println("⚠️  Check wiring:");
    Serial.println("   VCC → 3.3V");
    Serial.println("   GND → GND");
    Serial.println("   SCL → GPIO 14");
    Serial.println("   SDA → GPIO 15");
    
    // Error blink forever
    while (1) {
      blinkLED(1, 1000);
    }
  }
  
  Serial.println("✅ MPU-6050 Found!");
  
  // Configure MPU-6050 settings
  mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ);
  
  Serial.println("   Accelerometer range: ±8G");
  Serial.println("   Gyroscope range: ±500°/s");
  Serial.println("   Filter bandwidth: 21Hz");
  
  // ======== Calibrate Sensor ========
  Serial.println("\n📊 Calibrating MPU-6050...");
  Serial.println("⚠️  Keep drone FLAT and STILL for 3 seconds!");
  delay(1000);
  
  calibrateSensor();
  
  Serial.println("✅ Calibration Complete!");
  Serial.print("   Pitch Offset: ");
  Serial.println(pitchOffset);
  Serial.print("   Roll Offset: ");
  Serial.println(rollOffset);
  
  // ======== Connect to WiFi ========
  Serial.println("\n📡 Connecting to WiFi...");
  Serial.print("   SSID: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    blinkLED(1, 100);
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("   IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("   Signal: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
    
    blinkLED(5, 100);  // Success blink
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    
    // Error blink forever
    while (1) {
      blinkLED(1, 1000);
    }
  }
  
  // ======== Print Configuration ========
  Serial.println("\n📋 CONFIGURATION:");
  Serial.print("   Server: ");
  Serial.println(serverUrl);
  Serial.print("   Match ID: ");
  Serial.println(matchId);
  Serial.print("   Team ID: ");
  Serial.println(teamId);
  Serial.print("   Drone ID: ");
  Serial.println(droneId);
  Serial.print("   Send Rate: 5 Hz (every ");
  Serial.print(sendInterval);
  Serial.println("ms)");
  
  Serial.println("\n================================");
  Serial.println("🚀 DRONE READY - Starting Telemetry");
  Serial.println("================================\n");
  
  delay(1000);
}

// ==================== MAIN LOOP ====================

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi Disconnected! Reconnecting...");
    digitalWrite(STATUS_LED, HIGH);
    WiFi.reconnect();
    delay(5000);
    return;
  }
  
  // Send telemetry at 5Hz
  unsigned long currentTime = millis();
  
  if (currentTime - lastSendTime >= sendInterval) {
    lastSendTime = currentTime;
    
    // Read sensor data
    readMPU6050();
    
    // Update position (simulated movement)
    updatePosition();
    
    // Send data to backend
    sendTelemetry();
    
    // Battery simulation
    if (random(0, 100) < 2) {  // 2% chance
      battery--;
      if (battery < 0) battery = 0;
    }
    
    // Low battery warning
    if (battery < 20 && battery % 5 == 0) {
      Serial.println("⚠️  LOW BATTERY: " + String(battery) + "%");
      blinkLED(2, 50);
    }
    
    // Print stats every 50 sends (10 seconds)
    if ((successCount + errorCount) % 50 == 0 && (successCount + errorCount) > 0) {
      printStats();
    }
  }
}

// ==================== FUNCTIONS ====================

// Calibrate MPU-6050 sensor (find zero point)
void calibrateSensor() {
  float pitchSum = 0;
  float rollSum = 0;
  int samples = 50;
  
  for (int i = 0; i < samples; i++) {
    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);
    
    // Calculate pitch and roll
    float p = atan2(a.acceleration.y, a.acceleration.z) * 180 / PI;
    float r = atan2(-a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z)) * 180 / PI;
    
    pitchSum += p;
    rollSum += r;
    
    delay(10);
  }
  
  pitchOffset = pitchSum / samples;
  rollOffset = rollSum / samples;
}

// Read MPU-6050 sensor data
void readMPU6050() {
  sensors_event_t a, g, temp;
  mpu.getEvent(&a, &g, &temp);
  
  // Calculate pitch (tilt forward/backward)
  // Formula: atan2(y, z)
  float pitchDeg = atan2(a.acceleration.y, a.acceleration.z) * 180 / PI;
  pitch = (pitchDeg - pitchOffset) * PI / 180;  // Convert to radians
  
  // Calculate roll (tilt left/right)
  // Formula: atan2(-x, sqrt(y^2 + z^2))
  float rollDeg = atan2(-a.acceleration.x, sqrt(a.acceleration.y * a.acceleration.y + a.acceleration.z * a.acceleration.z)) * 180 / PI;
  roll = (rollDeg - rollOffset) * PI / 180;  // Convert to radians
  
  // Yaw (rotation) - using gyroscope Z-axis
  // Integrate gyroscope data over time
  yaw += g.gyro.z * (sendInterval / 1000.0);  // rad/s * time
  
  // Keep yaw in range -PI to +PI
  if (yaw > 3.14159) yaw -= 6.28318;
  if (yaw < -3.14159) yaw += 6.28318;
  
  // Optional: Print raw sensor data for debugging
  // Serial.print("Accel X: "); Serial.print(a.acceleration.x);
  // Serial.print(" | Y: "); Serial.print(a.acceleration.y);
  // Serial.print(" | Z: "); Serial.println(a.acceleration.z);
}

// Update position (simulated random walk - replace with GPS later)
void updatePosition() {
  // Simulate movement based on tilt (pitch/roll)
  // This is a simple simulation - in real drone, use GPS or optical flow
  
  x += sin(yaw) * 0.5 + random(-10, 10) / 10.0;
  y += cos(yaw) * 0.5 + random(-10, 10) / 10.0;
  z = 2.0 + random(-5, 5) / 10.0;  // Hover around 2m
  
  // Keep within arena bounds (50x50 meters)
  x = constrain(x, 0, 50);
  y = constrain(y, 0, 50);
  z = constrain(z, 0.5, 10);
}

// Send telemetry to backend
void sendTelemetry() {
  HTTPClient http;
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(3000);
  
  // Create JSON payload
  StaticJsonDocument<400> doc;
  doc["matchId"] = matchId;
  doc["teamId"] = teamId;
  doc["droneId"] = droneId;
  doc["x"] = round(x * 100) / 100.0;
  doc["y"] = round(y * 100) / 100.0;
  doc["z"] = round(z * 100) / 100.0;
  doc["pitch"] = round(pitch * 1000) / 1000.0;
  doc["roll"] = round(roll * 1000) / 1000.0;
  doc["yaw"] = round(yaw * 1000) / 1000.0;
  doc["battery"] = battery;
  doc["timestamp"] = millis();
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // LED blink when sending
  digitalWrite(STATUS_LED, HIGH);
  
  // Send POST request
  int httpCode = http.POST(jsonString);
  
  digitalWrite(STATUS_LED, LOW);
  
  // Handle response
  if (httpCode > 0) {
    successCount++;
    
    // Only print every 10th success to reduce spam
    if (successCount % 10 == 0) {
      Serial.print("✅ [");
      Serial.print(successCount);
      Serial.print("] HTTP ");
      Serial.print(httpCode);
      Serial.print(" | Pos: (");
      Serial.print(x, 1);
      Serial.print(", ");
      Serial.print(y, 1);
      Serial.print(", ");
      Serial.print(z, 1);
      Serial.print(") | P:");
      Serial.print(pitch, 2);
      Serial.print(" R:");
      Serial.print(roll, 2);
      Serial.print(" Y:");
      Serial.print(yaw, 2);
      Serial.print(" | Bat:");
      Serial.print(battery);
      Serial.println("%");
    }
    
  } else {
    errorCount++;
    Serial.print("❌ [");
    Serial.print(errorCount);
    Serial.print("] Error: ");
    Serial.print(httpCode);
    Serial.print(" | ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}

// Print statistics
void printStats() {
  Serial.println("\n📊 ========== TELEMETRY STATS ==========");
  Serial.print("   ✅ Success: ");
  Serial.println(successCount);
  Serial.print("   ❌ Errors: ");
  Serial.println(errorCount);
  
  if (successCount + errorCount > 0) {
    float successRate = (float)successCount / (successCount + errorCount) * 100;
    Serial.print("   📈 Success Rate: ");
    Serial.print(successRate, 1);
    Serial.println("%");
  }
  
  Serial.print("   📍 Position: (");
  Serial.print(x, 1);
  Serial.print(", ");
  Serial.print(y, 1);
  Serial.print(", ");
  Serial.print(z, 1);
  Serial.println(")");
  
  Serial.print("   🧭 Orientation: P=");
  Serial.print(pitch, 2);
  Serial.print(" R=");
  Serial.print(roll, 2);
  Serial.print(" Y=");
  Serial.println(yaw, 2);
  
  Serial.print("   🔋 Battery: ");
  Serial.print(battery);
  Serial.println("%");
  
  Serial.print("   📶 WiFi RSSI: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  
  Serial.println("==========================================\n");
}

// Helper function - LED blink
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(STATUS_LED, HIGH);
    delay(delayMs);
    digitalWrite(STATUS_LED, LOW);
    delay(delayMs);
  }
}