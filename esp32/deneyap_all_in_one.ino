/*
  ============================================================================
  PROJE: TÜBİTAK DENEYAP KART - 3'LÜ HİBRİT IOT OTOMASYONU (LAMBA + FAN + KİLİT)
  DERS: Yazılım & Gömülü Sistemler
  GELİŞTİRİCİ: Rainz-cmd / Ders
  WEB ARAYÜZÜ: Vercel Cloud (/api/devices REST API)
  ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

const char* WIFI_SSID     = "WIFI_ADINIZ";
const char* WIFI_PASSWORD = "WIFI_SIFRENIZ";
const char* VERCEL_URL    = "https://ders-taupe.vercel.app";

// Deneyap Kart Pinleri
const int PIN_LAMP = D0; // 1. Röle (Lamba)
const int PIN_FAN  = D1; // 2. Fan PWM
const int PIN_SERVO = D8; // 3. SG90 Servo Kilit
const int PIN_BUZZER = D9; // Buzzer Siren

Servo lockServo;

unsigned long lastPoll = 0;
const unsigned long pollInterval = 1200;
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 10000;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[DENEYAP KART] 3'lu Akilli Ev Sistemi Aktif!");

  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  pinMode(PIN_FAN, OUTPUT);
  digitalWrite(PIN_FAN, LOW);

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  lockServo.setPeriodHertz(50);
  lockServo.attach(PIN_SERVO, 500, 2400);
  lockServo.write(90);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\n[OK] Deneyap Wi-Fi Baglandi! IP: " + WiFi.localIP().toString());
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(2000);
    return;
  }

  unsigned long now = millis();
  if (now - lastPoll >= pollInterval) {
    lastPoll = now;
    pollDevices();
  }

  if (now - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = now;
    sendHeartbeat();
  }
}

void pollDevices() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient https;
  String url = String(VERCEL_URL) + "/api/devices";

  if (https.begin(client, url)) {
    int code = https.GET();
    if (code == 200) {
      String json = https.getString();
      DynamicJsonDocument doc(2048);
      deserializeJson(doc, json);

      // 1. Lamba
      bool lamp = doc["lamp"]["power"] | false;
      digitalWrite(PIN_LAMP, lamp ? HIGH : LOW);

      // 2. Fan
      bool fan = doc["fan"]["power"] | false;
      digitalWrite(PIN_FAN, fan ? HIGH : LOW);

      // 3. Servo Kilit & Buzzer
      int angle = doc["lock"]["angle"] | 90;
      bool alarm = doc["lock"]["alarm"] | false;
      lockServo.write(angle);
      digitalWrite(PIN_BUZZER, alarm ? HIGH : LOW);
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
    StaticJsonDocument<256> doc;
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    doc["deviceType"] = "Deneyap Kart 1A (3 Cihaz)";
    doc["uptimeSeconds"] = millis() / 1000;

    String body;
    serializeJson(doc, body);
    https.POST(body);
    https.end();
  }
}
