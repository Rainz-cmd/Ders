/*
  ============================================================================
  PROJE: ESP32 5'Lİ AKILLI IOT PLATFORMU (DUAL MODE: WI-FI + WEB SERIAL USB)
  CİHAZLAR:
    1. Lamba & Röle (GPIO 2)
    2. Fan / DC Motor PWM (GPIO 4)
    3. SG90 Kilit Servosu (GPIO 18) & Buzzer (GPIO 19)
    4. WS2812B NeoPixel RGB (GPIO 5)
    5. Mini Su Pompası (GPIO 23) & Toprak Nem Sensörü (GPIO 34 ADC)
  HABERLEŞME:
    - Mod A: Wi-Fi REST API (Vercel Cloud: /api/devices)
    - Mod B: Doğrudan USB Kablosu (Web Serial API 115200 Baud)
  ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// 1. WI-FI VE VERCEL AYARLARI
const char* WIFI_SSID     = "WIFI_ADINIZ";
const char* WIFI_PASSWORD = "WIFI_SIFRENIZ";
const char* VERCEL_URL    = "https://ders-taupe.vercel.app";

// 2. PIN TANIMLARI
const int PIN_LAMP     = 2;   // 1. Lamba Rölesi
const int PIN_FAN      = 4;   // 2. Fan PWM
const int PIN_SERVO    = 18;  // 3. Servo Kilit
const int PIN_BUZZER   = 19;  // Siren / Buzzer
const int PIN_RGB      = 5;   // 4. WS2812B RGB Data
const int PIN_PUMP     = 23;  // 5. Su Pompası Rölesi
const int PIN_SOIL     = 34;  // Toprak Nem Sensörü (Analog)

// PWM & Servo
const int FAN_PWM_CH   = 1;
Servo lockServo;

unsigned long lastPoll = 0;
const unsigned long POLL_INTERVAL = 1200; // 1.2s

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 10000; // 10s

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==========================================");
  Serial.println("  ESP32 5'LI IOT PLATFORMU (DUAL-MODE)    ");
  Serial.println("  115200 Baud Web Serial & Wi-Fi Ready    ");
  Serial.println("==========================================");

  // Pin Çıkışları
  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  pinMode(PIN_PUMP, OUTPUT);
  digitalWrite(PIN_PUMP, LOW);

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  pinMode(PIN_RGB, OUTPUT);
  digitalWrite(PIN_RGB, LOW);

  // Fan PWM
  ledcSetup(FAN_PWM_CH, 5000, 8);
  ledcAttachPin(PIN_FAN, FAN_PWM_CH);
  ledcWrite(FAN_PWM_CH, 0);

  // Servo
  lockServo.setPeriodHertz(50);
  lockServo.attach(PIN_SERVO, 500, 2400);
  lockServo.write(90);

  // Wi-Fi Başlat (Varsa bağlanır, yoksa sadece USB Serial çalışır)
  connectWiFiAsync();
}

void loop() {
  // 1. MOD B: USB Serial'den Gelen Web Komutlarını Dinle (Web Serial API)
  checkSerialCommands();

  // 2. MOD A: Wi-Fi Varsa Vercel'den Durum Çek
  if (WiFi.status() == WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastPoll >= POLL_INTERVAL) {
      lastPoll = now;
      pollVercelDevices();
    }
    if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
      lastHeartbeat = now;
      sendHeartbeat();
    }
  }
}

// -------------------------------------------------------------
// USB SERIAL DOĞRUDAN KONTROL MOTORU (WEB SERIAL API)
// -------------------------------------------------------------
void checkSerialCommands() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("CMD:LAMP:")) {
      int val = cmd.substring(9).toInt();
      digitalWrite(PIN_LAMP, val ? HIGH : LOW);
      Serial.println("[ACK] Lamba: " + String(val ? "ACIK" : "KAPALI"));
    } else if (cmd.startsWith("CMD:FAN:")) {
      int speed = cmd.substring(8).toInt();
      int duty = map(speed, 0, 100, 0, 255);
      ledcWrite(FAN_PWM_CH, duty);
      Serial.println("[ACK] Fan Hizi: %" + String(speed));
    } else if (cmd.startsWith("CMD:LOCK:")) {
      int val = cmd.substring(9).toInt();
      lockServo.write(val ? 90 : 0);
      Serial.println("[ACK] Kilit: " + String(val ? "KILITLI (90 deg)" : "ACIK (0 deg)"));
    } else if (cmd.startsWith("CMD:PUMP:")) {
      int val = cmd.substring(9).toInt();
      digitalWrite(PIN_PUMP, val ? HIGH : LOW);
      Serial.println("[ACK] Su Pompasi: " + String(val ? "CALISIYOR" : "KAPALI"));
    } else if (cmd == "CMD:STATUS") {
      int rawSoil = analogRead(PIN_SOIL);
      int soilPercent = map(rawSoil, 4095, 1500, 0, 100);
      Serial.println("[TELEMETRI] Toprak Nemi: %" + String(soilPercent) + " | Wi-Fi: " + (WiFi.status() == WL_CONNECTED ? "BAGLI" : "KOPUK"));
    }
  }
}

void connectWiFiAsync() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void pollVercelDevices() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = String(VERCEL_URL) + "/api/devices";

  if (https.begin(client, url)) {
    int code = https.GET();
    if (code == HTTP_CODE_OK) {
      String json = https.getString();
      DynamicJsonDocument doc(2048);
      deserializeJson(doc, json);

      // 1. Lamba
      digitalWrite(PIN_LAMP, doc["lamp"]["power"] ? HIGH : LOW);

      // 2. Fan
      bool fanOn = doc["fan"]["power"] | false;
      int speed  = doc["fan"]["speed"] | 0;
      ledcWrite(FAN_PWM_CH, fanOn ? map(speed, 0, 100, 0, 255) : 0);

      // 3. Kilit & Alarm
      lockServo.write(doc["lock"]["angle"] | 90);
      digitalWrite(PIN_BUZZER, doc["lock"]["alarm"] ? HIGH : LOW);

      // 4. Su Pompası
      digitalWrite(PIN_PUMP, doc["irrigation"]["pump"] ? HIGH : LOW);
    }
    https.end();
  }
}

void sendHeartbeat() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = String(VERCEL_URL) + "/api/heartbeat";

  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");

    int rawSoil = analogRead(PIN_SOIL);
    int soilPercent = constrain(map(rawSoil, 4095, 1500, 0, 100), 0, 100);

    StaticJsonDocument<256> doc;
    doc["ip"]            = WiFi.localIP().toString();
    doc["rssi"]          = WiFi.RSSI();
    doc["deviceType"]    = "ESP32 (5'li Hibrit + Web Serial)";
    doc["uptimeSeconds"] = millis() / 1000;
    doc["soilMoisture"]  = soilPercent;

    String body;
    serializeJson(doc, body);
    https.POST(body);
    https.end();
  }
}
