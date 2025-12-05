/*
 * ESP32-CAM MB - Drone Arena Telemetry System
 * Using RAW I2C Communication (No MPU library needed)
 *
 * Hardware:
 * - ESP32-CAM Module Board
 * - MPU6050 Gyro Sensor (SDA=GPIO14, SCL=GPIO15)
 *
 * This version uses direct I2C register reads - most reliable!
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <ArduinoJson.h>

// ========================================
// MPU6050 Register Addresses
// ========================================
#define MPU_ADDR 0x68
#define PWR_MGMT_1 0x6B
#define ACCEL_XOUT_H 0x3B
#define GYRO_XOUT_H 0x43

// ========================================
// WiFi Configuration
// ========================================
const char* WIFI_SSID = "AAAA";
const char* WIFI_PASSWORD = "12345678";

// ========================================
// Backend Server URL
// ========================================
const char* SERVER_URL = "http://10.93.182.196:5000";

// ========================================
// Pin Configuration (ESP32-CAM with camera)
// ========================================
#define SDA_PIN 14
#define SCL_PIN 15

// ========================================
// Timing Configuration
// ========================================
#define TELEMETRY_INTERVAL 50     // Send telemetry every 50ms (20 Hz)
#define HEARTBEAT_INTERVAL 10000  // Send heartbeat every 10 seconds
#define WIFI_RETRY_DELAY 5000     // Retry WiFi connection every 5 seconds

// ========================================
// Global Variables
// ========================================
String macAddress = "";
String droneId = "";
String droneRole = "";
bool isRegistered = false;
bool mpuWorking = false;

unsigned long lastTelemetryTime = 0;
unsigned long lastHeartbeatTime = 0;

// ========================================
// Function Prototypes
// ========================================
void connectWiFi();
void getMacAddress();
void announceToBackend();
void sendHeartbeat();
void sendTelemetry(float x, float y, float z, float pitch, float roll, float yaw);
bool initMPU6050();
void readMPU6050(float &ax, float &ay, float &az, float &gx, float &gy, float &gz);
void writeMPUReg(uint8_t reg, uint8_t data);
uint8_t readMPUReg(uint8_t reg);

// ========================================
// Setup Function
// ========================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("ESP32-CAM Drone Arena (Raw I2C)");
  Serial.println("========================================");

  // Get MAC Address
  getMacAddress();
  Serial.print("📡 MAC Address: ");
  Serial.println(macAddress);

  // Initialize I2C for MPU6050
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(400000); // 400kHz I2C speed
  Serial.println("🔌 I2C Initialized (SDA=14, SCL=15, 400kHz)");

  // Initialize MPU6050
  mpuWorking = initMPU6050();

  // Connect to WiFi
  connectWiFi();

  // Announce to Backend
  announceToBackend();

  Serial.println("========================================");
  Serial.println("✅ Setup Complete - Starting Main Loop");
  Serial.println("========================================\n");
}

// ========================================
// Main Loop
// ========================================
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi disconnected. Reconnecting...");
    connectWiFi();
    return;
  }

  unsigned long currentTime = millis();

  // Send Heartbeat
  if (currentTime - lastHeartbeatTime >= HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeatTime = currentTime;
  }

  // Send Telemetry (only if registered and MPU working)
  if (isRegistered && mpuWorking && currentTime - lastTelemetryTime >= TELEMETRY_INTERVAL) {
    float ax, ay, az, gx, gy, gz;
    readMPU6050(ax, ay, az, gx, gy, gz);

    // Calculate pitch and roll from accelerometer
    float pitch = atan2(ay, sqrt(ax * ax + az * az)) * 180.0 / PI;
    float roll = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0 / PI;
    float yaw = gz; // Yaw rate from gyroscope

    // Send telemetry
    sendTelemetry(ax, ay, az, pitch, roll, yaw);

    lastTelemetryTime = currentTime;
  }

  delay(10);
}

// ========================================
// WiFi Connection
// ========================================
void connectWiFi() {
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("📍 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi Connection Failed!");
    Serial.println("⏳ Retrying in 5 seconds...");
    delay(WIFI_RETRY_DELAY);
  }
}

// ========================================
// Get MAC Address
// ========================================
void getMacAddress() {
  WiFi.mode(WIFI_STA);
  delay(100);

  uint8_t mac[6];
  WiFi.macAddress(mac);

  char macStr[18];
  sprintf(macStr, "%02X:%02X:%02X:%02X:%02X:%02X",
          mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  macAddress = String(macStr);
}

// ========================================
// Announce to Backend
// ========================================
void announceToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ Cannot announce - WiFi not connected");
    return;
  }

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/esp/announce?mac=" + macAddress;

  Serial.println("📢 Announcing to backend...");
  Serial.print("🌐 URL: ");
  Serial.println(url);

  http.begin(url);
  int httpCode = http.GET();

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.print("📥 Response: ");
    Serial.println(payload);

    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      bool registered = doc["registered"];

      if (registered) {
        droneId = doc["data"]["droneId"].as<String>();
        droneRole = doc["data"]["role"].as<String>();
        isRegistered = true;

        Serial.println("✅ Registration Successful!");
        Serial.print("🆔 Drone ID: ");
        Serial.println(droneId);
        Serial.print("⚡ Role: ");
        Serial.println(droneRole);
      } else {
        Serial.println("⚠️  ESP not registered yet!");
        Serial.println("👉 Please register this MAC via Admin Panel");
        isRegistered = false;
      }
    }
  } else {
    Serial.print("❌ HTTP Error: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ========================================
// Send Heartbeat
// ========================================
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/telemetry/heartbeat";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["mac"] = macAddress;
  doc["ipAddress"] = WiFi.localIP().toString();

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.println("💓 Heartbeat sent");
  } else {
    Serial.print("❌ Heartbeat failed: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ========================================
// Send Telemetry Data
// ========================================
void sendTelemetry(float x, float y, float z, float pitch, float roll, float yaw) {
  if (WiFi.status() != WL_CONNECTED || !isRegistered) return;

  HTTPClient http;
  String url = String(SERVER_URL) + "/api/telemetry/receive";

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["macAddress"] = macAddress;

  JsonObject sensorData = doc.createNestedObject("sensorData");
  sensorData["x"] = x;
  sensorData["y"] = y;
  sensorData["z"] = z;
  sensorData["pitch"] = pitch;
  sensorData["roll"] = roll;
  sensorData["yaw"] = yaw;
  sensorData["battery"] = 100;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    static int counter = 0;
    if (counter % 10 == 0) {
      Serial.println("\n📊 Telemetry Data:");
      Serial.printf("   Accel - X: %.2f | Y: %.2f | Z: %.2f\n", x, y, z);
      Serial.printf("   Angles - Pitch: %.2f° | Roll: %.2f° | Yaw: %.2f°/s\n", pitch, roll, yaw);
      Serial.printf("   ✅ Sent to backend (HTTP %d)\n", httpCode);
    }
    counter++;
  } else {
    Serial.print("❌ Telemetry failed: ");
    Serial.println(httpCode);
  }

  http.end();
}

// ========================================
// Initialize MPU6050 (Raw I2C)
// ========================================
bool initMPU6050() {
  Serial.println("🔧 Initializing MPU6050 (Raw I2C)...");

  delay(100);

  // Check if device responds
  Wire.beginTransmission(MPU_ADDR);
  byte error = Wire.endTransmission();

  if (error != 0) {
    Serial.print("❌ MPU6050 not found at 0x");
    Serial.println(MPU_ADDR, HEX);
    Serial.println("⚠️  Check wiring:");
    Serial.println("   VCC → 3.3V");
    Serial.println("   GND → GND");
    Serial.println("   SDA → GPIO 14");
    Serial.println("   SCL → GPIO 15");
    return false;
  }

  Serial.println("✅ MPU6050 found at 0x68!");

  // Wake up MPU6050 (it starts in sleep mode)
  writeMPUReg(PWR_MGMT_1, 0x00);
  delay(100);

  // Verify communication
  uint8_t whoAmI = readMPUReg(0x75); // WHO_AM_I register
  Serial.print("📋 WHO_AM_I: 0x");
  Serial.println(whoAmI, HEX);

  if (whoAmI == 0x68 || whoAmI == 0x70 || whoAmI == 0x98) {
    Serial.println("✅ MPU6050 communication verified!");
    Serial.println("⚙️  Configuration:");
    Serial.println("   Accelerometer: ±2G");
    Serial.println("   Gyroscope: ±250°/s");
    return true;
  } else {
    Serial.print("⚠️  Unexpected WHO_AM_I: 0x");
    Serial.println(whoAmI, HEX);
    Serial.println("⚠️  Continuing anyway - might be MPU6050 clone");
    return true; // Continue even with unexpected ID
  }
}

// ========================================
// Read MPU6050 Sensor Data (Raw I2C)
// ========================================
void readMPU6050(float &ax, float &ay, float &az, float &gx, float &gy, float &gz) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(ACCEL_XOUT_H);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 14, true);

  // Read accelerometer (6 bytes)
  int16_t accelX = Wire.read() << 8 | Wire.read();
  int16_t accelY = Wire.read() << 8 | Wire.read();
  int16_t accelZ = Wire.read() << 8 | Wire.read();

  // Skip temperature (2 bytes)
  Wire.read();
  Wire.read();

  // Read gyroscope (6 bytes)
  int16_t gyroX = Wire.read() << 8 | Wire.read();
  int16_t gyroY = Wire.read() << 8 | Wire.read();
  int16_t gyroZ = Wire.read() << 8 | Wire.read();

  // Convert to G's and °/s
  ax = accelX / 16384.0;  // ±2G range
  ay = accelY / 16384.0;
  az = accelZ / 16384.0;
  gx = gyroX / 131.0;     // ±250°/s range
  gy = gyroY / 131.0;
  gz = gyroZ / 131.0;
}

// ========================================
// Write to MPU6050 Register
// ========================================
void writeMPUReg(uint8_t reg, uint8_t data) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.write(data);
  Wire.endTransmission();
}

// ========================================
// Read from MPU6050 Register
// ========================================
uint8_t readMPUReg(uint8_t reg) {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(reg);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 1, true);
  return Wire.read();
}
