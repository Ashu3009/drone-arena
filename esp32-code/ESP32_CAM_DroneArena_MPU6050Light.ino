/*
 * ESP32-CAM MB - Drone Arena Telemetry System
 * Using MPU6050_light library (more reliable for ESP32-CAM)
 *
 * Hardware:
 * - ESP32-CAM Module Board
 * - MPU6050 Gyro Sensor (SDA=GPIO14, SCL=GPIO15)
 * - Camera enabled (that's why using GPIO14/15)
 *
 * Library: MPU6050_light by rfetick
 * Install: Arduino IDE → Tools → Manage Libraries → Search "MPU6050_light"
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MPU6050_light.h>
#include <ArduinoJson.h>

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
MPU6050 mpu(Wire);
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
void initMPU6050();

// ========================================
// Setup Function
// ========================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n========================================");
  Serial.println("ESP32-CAM Drone Arena (MPU6050_light)");
  Serial.println("========================================");

  // Get MAC Address
  getMacAddress();
  Serial.print("📡 MAC Address: ");
  Serial.println(macAddress);

  // Initialize I2C for MPU6050
  Wire.begin(SDA_PIN, SCL_PIN);
  Serial.println("🔌 I2C Initialized (SDA=14, SCL=15)");
  Serial.println("⚠️  Note: Using GPIO14/15 (camera-compatible pins)");

  // Initialize MPU6050
  initMPU6050();

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
    // Update MPU data
    mpu.update();

    // Get sensor data
    float x = mpu.getAccX();
    float y = mpu.getAccY();
    float z = mpu.getAccZ();
    float pitch = mpu.getAngleX();
    float roll = mpu.getAngleY();
    float yaw = mpu.getAngleZ();

    // Send telemetry
    sendTelemetry(x, y, z, pitch, roll, yaw);

    lastTelemetryTime = currentTime;
  }

  delay(10); // Small delay to prevent watchdog issues
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
// Announce to Backend (Auto-Discovery)
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
      Serial.printf("   X: %.2f | Y: %.2f | Z: %.2f\n", x, y, z);
      Serial.printf("   Pitch: %.2f° | Roll: %.2f° | Yaw: %.2f°\n", pitch, roll, yaw);
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
// Initialize MPU6050
// ========================================
void initMPU6050() {
  Serial.println("🔧 Initializing MPU6050 (MPU6050_light library)...");

  delay(1000); // Important: Give I2C time to stabilize

  byte status = mpu.begin();

  if (status != 0) {
    Serial.print("❌ MPU6050 connection failed! Status: ");
    Serial.println(status);
    Serial.println("⚠️  Check wiring:");
    Serial.println("   VCC → 3.3V");
    Serial.println("   GND → GND");
    Serial.println("   SDA → GPIO 14");
    Serial.println("   SCL → GPIO 15");
    Serial.println("⚠️  Continuing without MPU6050...");
    mpuWorking = false;
    return;
  }

  Serial.println("✅ MPU6050 Found!");
  Serial.println("🔄 Calibrating... (keep sensor flat and still)");

  mpu.calcOffsets(true, true); // Calibrate gyro and accelerometer

  Serial.println("✅ MPU6050 Calibrated and Ready!");
  mpuWorking = true;
}
