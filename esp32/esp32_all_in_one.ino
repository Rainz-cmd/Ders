/*
  ============================================================================
  PROJE: ESP32 ÇOKLU AKILLI EV SİSTEMİ (LAMBA + FAN + KAPI KİLİDİ)
  DERS: Gömülü Sistemler ve IoT Otomasyonu
  GELİŞTİRİCİ: Rainz-cmd / Ders
  WEB ARAYÜZÜ: Vercel Cloud (/api/devices REST API)
  ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h> // Arduino Kütüphane Yöneticisinden "ESP32Servo" kurun

// -------------------------------------------------------------
// 1. WI-FI VE VERCEL BULUT AYARLARI
// -------------------------------------------------------------
const char* WIFI_SSID     = "WIFI_ADINIZ";
const char* WIFI_PASSWORD = "WIFI_SIFRENIZ";
const char* VERCEL_URL    = "https://ders-taupe.vercel.app"; // Sonunda '/' olmadan

// -------------------------------------------------------------
// 2. DONANIM PINLERİ
// -------------------------------------------------------------
const int PIN_LAMP_RELAY  = 2;   // 1. Cihaz: Lamba Rölesi (GPIO 2)
const int PIN_FAN_MOTOR   = 4;   // 2. Cihaz: Fan PWM / Motor (GPIO 4)
const int PIN_SERVO_LOCK  = 18;  // 3. Cihaz: SG90 Kilit Servosu (GPIO 18)
const int PIN_BUZZER      = 19;  // Güvenlik Sireni / Buzzer (GPIO 19)

// PWM Kanalları
const int FAN_PWM_CHANNEL = 1;
const int FAN_PWM_FREQ    = 5000;
const int FAN_PWM_RES     = 8;   // 0 - 255

Servo lockServo;

// Zamanlama
unsigned long lastPollTime      = 0;
const unsigned long POLL_DELAY  = 1200; // 1.2 sn

unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_DELAY = 10000; // 10 sn

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n>>> ESP32 3'lu Akilli Ev Sistemi Baslatiliyor...");

  // 1. Lamba Röle Pini
  pinMode(PIN_LAMP_RELAY, OUTPUT);
  digitalWrite(PIN_LAMP_RELAY, LOW);

  // 2. Fan PWM Ayarı
  ledcSetup(FAN_PWM_CHANNEL, FAN_PWM_FREQ, FAN_PWM_RES);
  ledcAttachPin(PIN_FAN_MOTOR, FAN_PWM_CHANNEL);
  ledcWrite(FAN_PWM_CHANNEL, 0);

  // 3. Servo Kilit Ayarı
  lockServo.setPeriodHertz(50);
  lockServo.attach(PIN_SERVO_LOCK, 500, 2400);
  lockServo.write(90); // Başlangıçta kilitli (90 derece)

  // 4. Buzzer
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  // Wi-Fi Bağlan
  connectWiFi();
  sendHeartbeat();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
  }

  unsigned long now = millis();

  // 1. Web sitesinden 3 cihazın durumunu tek seferde çek
  if (now - lastPollTime >= POLL_DELAY) {
    lastPollTime = now;
    fetchDevicesState();
  }

  // 2. Canlılık bildirimi gönder
  if (now - lastHeartbeatTime >= HEARTBEAT_DELAY) {
    lastHeartbeatTime = now;
    sendHeartbeat();
  }
}

void connectWiFi() {
  Serial.print("Wi-Fi baglantisi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 40) {
    delay(500);
    Serial.print(".");
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] Wi-Fi Baglandi! IP: " + WiFi.localIP().toString());
  }
}

void fetchDevicesState() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = String(VERCEL_URL) + "/api/devices";

  if (https.begin(client, url)) {
    int code = https.GET();

    if (code == HTTP_CODE_OK) {
      String json = https.getString();

      DynamicJsonDocument doc(2048);
      DeserializationError error = deserializeJson(doc, json);

      if (!error) {
        // 1. Lamba Kontrolü
        bool lampPower = doc["lamp"]["power"] | false;
        digitalWrite(PIN_LAMP_RELAY, lampPower ? HIGH : LOW);

        // 2. Fan Kontrolü (PWM)
        bool fanPower = doc["fan"]["power"] | false;
        int fanSpeed  = doc["fan"]["speed"] | 0;
        if (fanPower) {
          int duty = map(fanSpeed, 0, 100, 0, 255);
          ledcWrite(FAN_PWM_CHANNEL, duty);
        } else {
          ledcWrite(FAN_PWM_CHANNEL, 0);
        }

        // 3. Kapı Kilidi (Servo SG90) & Alarm
        int lockAngle = doc["lock"]["angle"] | 90;
        bool alarmOn  = doc["lock"]["alarm"] | false;
        lockServo.write(lockAngle);
        digitalWrite(PIN_BUZZER, alarmOn ? HIGH : LOW);
      }
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
    doc["ip"]            = WiFi.localIP().toString();
    doc["rssi"]          = WiFi.RSSI();
    doc["deviceType"]    = "ESP32 (3'lu Hibrit Kontrol)";
    doc["uptimeSeconds"] = millis() / 1000;

    String body;
    serializeJson(doc, body);
    https.POST(body);
    https.end();
  }
}
