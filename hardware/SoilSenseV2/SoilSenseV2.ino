/*
 * ========================================================================
 *  SoilSense ESP32 — IoT Soil Monitoring Firmware (Local Serial Test)
 * ========================================================================
 *  Hardware Mapping:
 *    - Moisture Signal: Analog on GPIO 35 (ADC1)
 *    - Moisture Power:  GPIO 25 (Pulsed to prevent corrosion)
 *    - pH Probe:        Analog on GPIO 34 (ADC1, via 1/2 voltage divider)
 *    - RS-485 NPK:      UART2 (RX=GPIO16, TX=GPIO17) @ 9600 Baud
 *    - RS-485 Direction:GPIO 4 (Tied to DE & RE)
 * ========================================================================
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

// ========================= USER CONFIGURATION =========================

// Updated Wi-Fi credentials
const char* WIFI_SSID     = "Enzo";
const char* WIFI_PASSWORD = "1223334444";

// Live Render Django API Endpoint & Registered Hardware UID
const char* SERVER_URL    = "https://soilsense-api-t8ym.onrender.com/api/iot/upload/";
const char* DEVICE_UID    = "ESP32-SOILSENSE-01"; // Must match active assigned device in MAO Hardware Registry

// Set DEMO_MODE to true for fast 15-second (3-sample) averaged uploads during live defense,
// or false for 60-second (12-sample) averaged uploads during normal operation:
#define DEMO_MODE           false

const unsigned long SAMPLE_INTERVAL_MS = 5000;               // Sample all sensors every 5 seconds
const int           SAMPLES_PER_UPLOAD = DEMO_MODE ? 3 : 12; // 3 samples (15s) in demo, 12 samples (60s) in field

// ========================= PIN DEFINITIONS ============================

#define MOISTURE_PIN       35
#define MOISTURE_POWER_PIN 25
#define PH_PIN             34
#define NPK_RX_PIN         16
#define NPK_TX_PIN         17
#define RS485_DE_RE        4 // Direction control pin

// ========================= NPK MODBUS COMMANDS ========================

// Combined Modbus Query: Read 3 Holding Registers starting at 0x001E (N, P, K)
// SlaveID: 0x01 | Func: 0x03 | Start: 0x001E | Regs: 0x0003 | CRC16: 0x65CD
const byte npkCombinedQuery[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};

// ========================= GLOBAL VARIABLES ===========================

HardwareSerial NPKSerial(2);
unsigned long lastSampleTime = 0;

// Multi-sample averaging accumulators
int           sampleCount      = 0;
int           validNpkSamples  = 0;
unsigned long sumNitrogen      = 0;
unsigned long sumPhosphorus    = 0;
unsigned long sumPotassium     = 0;
float         sumPH            = 0.0f;
float         sumMoisture      = 0.0f;

// ========================= SETUP ======================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n========================================");
  Serial.println("   SoilSense ESP32 — Local Test Mode");
  Serial.println("========================================");

  // Initialize RS485 Direction pin
  pinMode(RS485_DE_RE, OUTPUT);
  digitalWrite(RS485_DE_RE, LOW); // Default to receive mode
  
  // Initialize Moisture Power pin
  pinMode(MOISTURE_POWER_PIN, OUTPUT);
  digitalWrite(MOISTURE_POWER_PIN, LOW); // Keep off by default

  // Industrial NPK sensors default to 9600 baud
  NPKSerial.begin(4800, SERIAL_8N1, NPK_RX_PIN, NPK_TX_PIN);
  Serial.println("[OK] NPK RS-485 UART initialized (9600 baud)");

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);
  Serial.println("[OK] Analog pins configured (12-bit, 0-3.3V)");

  connectWiFi();
  Serial.printf("[OK] Mode: %s | Sampling every %lu ms | Upload every %d samples\n",
                DEMO_MODE ? "DEMO_MODE (15s)" : "FIELD_MODE (60s)",
                SAMPLE_INTERVAL_MS, SAMPLES_PER_UPLOAD);
  Serial.println("[OK] Setup Complete! Reading sensors...\n");
}

// ========================= MAIN LOOP ==================================

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WARN] WiFi disconnected. Reconnecting...");
    connectWiFi();
  }

  unsigned long now = millis();

  if (now - lastSampleTime >= SAMPLE_INTERVAL_MS) {
    lastSampleTime = now;

    Serial.println("──────────────────────────────────────");
    Serial.printf("  📡 Sample %d/%d...\n", sampleCount + 1, SAMPLES_PER_UPLOAD);
    Serial.println("──────────────────────────────────────");

    float moisture = readMoisture();
    Serial.printf("  💧 Moisture:    %.1f %%\n", moisture);

    uint16_t nitrogen = 0, phosphorus = 0, potassium = 0;
    bool npkSuccess = readCombinedNPK(nitrogen, phosphorus, potassium);

    if (npkSuccess) {
      Serial.printf("  🟢 Nitrogen:    %u mg/kg\n", nitrogen);
      Serial.printf("  🔵 Phosphorus:  %u mg/kg\n", phosphorus);
      Serial.printf("  🟠 Potassium:   %u mg/kg\n", potassium);
      sumNitrogen   += nitrogen;
      sumPhosphorus += phosphorus;
      sumPotassium  += potassium;
      validNpkSamples++;
    } else {
      Serial.println("  [NPK Error] Failed to read sensor or CRC mismatch (excluded from average).");
    }

    float ph = readPH();
    Serial.printf("  ⚗️  pH Level:    %.2f\n\n", ph);

    sumMoisture += moisture;
    sumPH       += ph;
    sampleCount++;

    // Trigger cloud upload once the configured sample window is complete
    if (sampleCount >= SAMPLES_PER_UPLOAD) {
      float avgMoisture = sumMoisture / sampleCount;
      float avgPH       = sumPH / sampleCount;
      int   avgN        = (validNpkSamples > 0) ? (int)((sumNitrogen + (validNpkSamples / 2)) / validNpkSamples) : 0;
      int   avgP        = (validNpkSamples > 0) ? (int)((sumPhosphorus + (validNpkSamples / 2)) / validNpkSamples) : 0;
      int   avgK        = (validNpkSamples > 0) ? (int)((sumPotassium + (validNpkSamples / 2)) / validNpkSamples) : 0;

      char jsonPayload[180];
      snprintf(jsonPayload, sizeof(jsonPayload),
               "{\"nitrogen\":%d,\"phosphorus\":%d,\"potassium\":%d,\"ph\":%.2f,\"moisture\":%.1f}",
               avgN, avgP, avgK, avgPH, avgMoisture);

      Serial.printf("  [Window Average] %d total samples | %d/%d valid NPK reads\n",
                    sampleCount, validNpkSamples, sampleCount);
      Serial.printf("  [Payload] %s\n", jsonPayload);
      uploadToCloud(jsonPayload);

      // Reset accumulators and anchor next 5s cycle after upload finishes
      sampleCount     = 0;
      validNpkSamples = 0;
      sumNitrogen     = 0;
      sumPhosphorus   = 0;
      sumPotassium    = 0;
      sumPH           = 0.0f;
      sumMoisture     = 0.0f;
      lastSampleTime  = millis();
    }
  }

  delay(100);
}

// ========================= CLOUD HTTPS UPLOAD =========================

void uploadToCloud(const char* jsonPayload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("  [Upload Error] WiFi not connected. Skipping upload.\n");
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Bypass CA certificate chain validation for Render HTTPS

  HTTPClient http;
  http.setTimeout(15000); // 15-second timeout to allow for Render cold starts & ML inference

  Serial.printf("  [Cloud] POST -> %s\n", SERVER_URL);
  if (http.begin(client, SERVER_URL)) {
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-UID", DEVICE_UID);

    int httpResponseCode = http.POST((uint8_t*)jsonPayload, strlen(jsonPayload));

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("  [Cloud] HTTP %d | Response: %s\n\n", httpResponseCode, response.c_str());
    } else {
      Serial.printf("  [Cloud Error] HTTP POST failed: %s (Code: %d)\n\n",
                    http.errorToString(httpResponseCode).c_str(), httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("  [Cloud Error] Unable to initialize HTTPS connection.\n");
  }
}

// ========================= WIFI =======================================

void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  
  // Clear the ESP32's cached network state to fix the "cannot set config" loop
  WiFi.disconnect(true);
  delay(100);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  // Non-blocking wait: 40 * 250ms = 10 seconds max
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(250);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" Connected!");
    Serial.printf("[WiFi] IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println(" FAILED! Will retry on next loop.");
  }
}

// ========================= SOIL MOISTURE ==============================

float readMoisture() {
  digitalWrite(MOISTURE_POWER_PIN, HIGH); // Turn ON moisture sensor
  delay(50);                              // Allow voltage to stabilize

  long total = 0;
  const int samples = 10;
  for (int i = 0; i < samples; i++) {
    total += analogRead(MOISTURE_PIN);
    delay(20);
  }

  digitalWrite(MOISTURE_POWER_PIN, LOW);  // Turn OFF sensor immediately to stop corrosion

  int avgRaw = total / samples;
  float dryValue = 1800.0;
  float wetValue = 200.0;

  float moisturePercent = ((dryValue - avgRaw) / (dryValue - wetValue)) * 100.0;
  return constrain(moisturePercent, 0.0, 100.0);
}

// ========================= NPK MODBUS CALCULATION =====================

// CRC-16 generation for Modbus RTU
uint16_t calculateModbusCRC(uint8_t *buf, uint8_t len) {
  uint16_t crc = 0xFFFF;
  for (uint8_t pos = 0; pos < len; pos++) {
    crc ^= (uint16_t)buf[pos];
    for (uint8_t i = 8; i != 0; i--) {
      if ((crc & 0x0001) != 0) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

bool readCombinedNPK(uint16_t &n, uint16_t &p, uint16_t &k) {
  // Clear stale data
  while (NPKSerial.available()) NPKSerial.read();

  // Transmit Mode
  digitalWrite(RS485_DE_RE, HIGH);
  delay(2);
  NPKSerial.write(npkCombinedQuery, sizeof(npkCombinedQuery));
  NPKSerial.flush();
  
  // Receive Mode
  digitalWrite(RS485_DE_RE, LOW);

  // Wait for 11 byte response (Slave + Func + Bytes + N + P + K + CRC(2))
  unsigned long startTime = millis();
  while (NPKSerial.available() < 11 && (millis() - startTime) < 500) {
    delay(5);
  }

  if (NPKSerial.available() < 11) return false;

  uint8_t rxBuf[11];
  for(int i=0; i<11; i++) {
      rxBuf[i] = NPKSerial.read();
  }

  // Validate Header (Slave 1, Func 3, 6 bytes of data)
  if (rxBuf[0] != 0x01 || rxBuf[1] != 0x03 || rxBuf[2] != 0x06) return false;

  // Validate CRC-16
  uint16_t calcCRC = calculateModbusCRC(rxBuf, 9);
  uint16_t recvCRC = rxBuf[9] | (rxBuf[10] << 8);
  
  if (calcCRC != recvCRC) return false;

  // Extract values
  n = (rxBuf[3] << 8) | rxBuf[4];
  p = (rxBuf[5] << 8) | rxBuf[6];
  k = (rxBuf[7] << 8) | rxBuf[8];
  
  return true;
}

// ========================= pH SENSOR ==================================

float readPH() {
  long total = 0;
  const int samples = 20;

  for (int i = 0; i < samples; i++) {
    total += analogRead(PH_PIN);
    delay(20);
  }

  int avgRaw = total / samples;
  float voltage = avgRaw * (3.3 / 4095.0);
  
  // Reverses the updated 2-resistor (1/2) voltage divider
  float originalVoltage = voltage / 0.50; 
  float ph = 3.0 + (originalVoltage / 5.0) * 6.0;

  return constrain(ph, 0.0, 14.0);
}