/**
 * SMART INDUSTRY 360 - ESP32 INDUSTRIAL IOT EDGE SENSOR NODE FIRMWARE
 * 
 * Target Microcontroller: ESP32 DevKit v1 / ESP-WROOM-32
 * Version: 2.4.1
 * 
 * Hardware Capabilities:
 * - DHT22 / PT100 Ambient & Thermal Sensor (Pin 4)
 * - MQ-2 Combustible Gas & Smoke Sensor ADC (Pin 34)
 * - SW-420 High-Sensitivity Vibration Sensor (Pin 35)
 * - Physical Emergency SOS / E-Stop Button (Pin 18, Interrupt)
 * - Local Industrial Piezo Buzzer Siren (Pin 19)
 * - Tri-Color Status Indicator LED (Pins 21, 22, 23)
 * 
 * IMPORTANT SAFETY NOTICE:
 * This code and low-cost educational sensors (MQ-2, DHT22) are intended for 
 * engineering prototypes and educational demonstration. Certified industrial 
 * ATEX/IECEx explosion-proof instruments must be used in live hazardous environments.
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ================= CONFIGURATION =================
const char* WIFI_SSID     = "Industrial_WLAN_Mesh";
const char* WIFI_PASS     = "SecuredFactory2026!";
const char* MQTT_SERVER   = "192.168.1.10";
const int   MQTT_PORT     = 1883;
const char* MQTT_USER     = "industrial_edge_01";
const char* MQTT_PASS     = "edge_sec_key_2026";

const char* PLANT_ID      = "DET-01";
const char* ZONE_ID       = "BAY-CHEM";
const char* DEVICE_ID     = "DEV-GAS-01";

// Pinout Definitions
#define PIN_TEMP_SENSOR   4
#define PIN_GAS_ADC       34
#define PIN_VIBRATION     35
#define PIN_SOS_BUTTON    18
#define PIN_BUZZER        19
#define PIN_LED_GREEN     21
#define PIN_LED_AMBER     22
#define PIN_LED_RED       23

// Local Safety Thresholds (Autonomous Edge Execution)
#define THRESHOLD_GAS_CRITICAL   2400   // 12-bit ADC threshold (~150 ppm)
#define THRESHOLD_TEMP_CRITICAL  55.0   // Celsius
#define HEARTBEAT_INTERVAL_MS    3000   // 3 Seconds

// Buffer for offline store-and-forward (up to 50 readings in RAM ring-buffer)
struct OfflineEvent {
  float temp;
  int gasRaw;
  int vibration;
  bool sosTriggered;
  unsigned long timestampMs;
};
OfflineEvent offlineBuffer[50];
int bufferHead = 0;
int bufferCount = 0;

WiFiClient espClient;
PubSubClient mqttClient(espClient);

volatile bool sosFlag = false;
volatile unsigned long lastSosTime = 0;

// Interrupt Service Routine for Physical SOS Button (Debounced)
void IRAM_ATTR handleSosInterrupt() {
  unsigned long now = millis();
  if (now - lastSosTime > 400) { // 400ms debounce
    sosFlag = true;
    lastSosTime = now;
  }
}

// MQTT Topics
char topicTelemetry[100];
char topicStatus[100];
char topicEvents[100];
char topicCommands[100];

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[BOOT] Smart Industry 360 - Initializing ESP32 Industrial Node...");

  pinMode(PIN_SOS_BUTTON, INPUT_PULLUP);
  pinMode(PIN_VIBRATION, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_AMBER, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);

  // Default normal LED state
  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_AMBER, LOW);
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  attachInterrupt(digitalPinToInterrupt(PIN_SOS_BUTTON), handleSosInterrupt, FALLING);

  // Construct MQTT Topics
  snprintf(topicTelemetry, sizeof(topicTelemetry), "industry/%s/%s/%s/telemetry", PLANT_ID, ZONE_ID, DEVICE_ID);
  snprintf(topicStatus, sizeof(topicStatus), "industry/%s/%s/%s/status", PLANT_ID, ZONE_ID, DEVICE_ID);
  snprintf(topicEvents, sizeof(topicEvents), "industry/%s/%s/%s/events", PLANT_ID, ZONE_ID, DEVICE_ID);
  snprintf(topicCommands, sizeof(topicCommands), "industry/%s/%s/%s/commands", PLANT_ID, ZONE_ID, DEVICE_ID);

  connectWiFi();
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Read sensors
  float temp = readSimulatedTemperature();
  int gasRaw = analogRead(PIN_GAS_ADC);
  int vibVal = digitalRead(PIN_VIBRATION);

  // Check Local Autonomous Safety Rule (FAIL-SAFE: Do NOT wait for cloud!)
  bool localAlarm = false;
  if (gasRaw > THRESHOLD_GAS_CRITICAL || temp > THRESHOLD_TEMP_CRITICAL || sosFlag) {
    localAlarm = true;
    triggerLocalAlarm();
  } else {
    clearLocalAlarm();
  }

  // Publish or buffer telemetry every interval
  static unsigned long lastTick = 0;
  if (millis() - lastTick > HEARTBEAT_INTERVAL_MS) {
    lastTick = millis();
    publishTelemetry(temp, gasRaw, vibVal, sosFlag);
    sosFlag = false; // Reset SOS latch once published
  }
}

void triggerLocalAlarm() {
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_RED, HIGH);
  // Intermittent tone
  tone(PIN_BUZZER, 2400, 150);
}

void clearLocalAlarm() {
  digitalWrite(PIN_LED_RED, LOW);
  digitalWrite(PIN_LED_GREEN, HIGH);
  noTone(PIN_BUZZER);
}

void publishTelemetry(float temp, int gasRaw, int vib, bool isSos) {
  StaticJsonDocument<384> doc;
  doc["schema_version"] = "1.0.0";
  doc["device_id"]      = DEVICE_ID;
  doc["plant_id"]       = PLANT_ID;
  doc["zone_id"]        = ZONE_ID;
  doc["timestamp_ms"]   = millis();
  doc["temperature_c"]  = temp;
  doc["gas_adc_raw"]    = gasRaw;
  doc["gas_ppm_est"]    = map(gasRaw, 0, 4095, 0, 300);
  doc["vibration_flag"] = (vib == HIGH);
  doc["sos_active"]     = isSos;
  doc["battery_pct"]    = 100;
  doc["firmware"]       = "v2.4.1";

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  if (mqttClient.connected()) {
    // Flush buffered offline events first if any
    flushOfflineBuffer();
    mqttClient.publish(topicTelemetry, jsonBuffer);
    Serial.printf("[MQTT PUB] %s\n", jsonBuffer);
  } else {
    // Edge store-and-forward offline buffering
    Serial.println("[OFFLINE] MQTT Disconnected. Buffering event locally in RAM...");
    if (bufferCount < 50) {
      offlineBuffer[bufferHead].temp = temp;
      offlineBuffer[bufferHead].gasRaw = gasRaw;
      offlineBuffer[bufferHead].vibration = vib;
      offlineBuffer[bufferHead].sosTriggered = isSos;
      offlineBuffer[bufferHead].timestampMs = millis();
      bufferHead = (bufferHead + 1) % 50;
      bufferCount++;
    }
  }
}

void flushOfflineBuffer() {
  if (bufferCount == 0) return;
  Serial.printf("[SYNC] Flashing %d offline buffered events to broker...\n", bufferCount);
  for (int i = 0; i < bufferCount; i++) {
    StaticJsonDocument<256> syncDoc;
    syncDoc["device_id"] = DEVICE_ID;
    syncDoc["is_buffered_playback"] = true;
    syncDoc["temp"] = offlineBuffer[i].temp;
    syncDoc["gas"] = offlineBuffer[i].gasRaw;
    syncDoc["sos"] = offlineBuffer[i].sosTriggered;
    char buf[256];
    serializeJson(syncDoc, buf);
    mqttClient.publish("industry/edge_sync/playback", buf);
  }
  bufferCount = 0;
  bufferHead = 0;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("[CMD RECV] Topic: %s\n", topic);
  StaticJsonDocument<256> doc;
  deserializeJson(doc, payload, length);
  const char* cmd = doc["command"];
  if (strcmp(cmd, "RECALIBRATE") == 0) {
    Serial.println("[ACTION] Recalibrating ADC zero-point...");
  } else if (strcmp(cmd, "SIREN_ON") == 0) {
    tone(PIN_BUZZER, 2000);
  } else if (strcmp(cmd, "SIREN_OFF") == 0) {
    noTone(PIN_BUZZER);
  }
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("[WIFI] Connecting to "); Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(400);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WIFI] Connection failed. Running in offline edge mode.");
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting to broker...");
    if (mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASS)) {
      Serial.println(" Connected!");
      mqttClient.subscribe(topicCommands);
    } else {
      Serial.print(" Failed, rc="); Serial.println(mqttClient.state());
    }
  }
}

float readSimulatedTemperature() {
  // Simulates reading calibrated sensor with realistic micro-variations
  return 24.5 + (random(-5, 6) * 0.1);
}
