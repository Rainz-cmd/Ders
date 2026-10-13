/*
  ============================================================================
  PROJE: ESP32 AKILLI LAMBA & RÖLE KONTROL SİSTEMİ
  DERS: Gömülü Sistemler ve IoT Uygulamaları
  GELİŞTİRİCİ: Rainz-cmd (Ders Projesi)
  WEB ARAYÜZÜ: Vercel Cloud (Next.js REST API)
  ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// -------------------------------------------------------------
// 1. WI-FI VE BULUT YAPILANDIRMASI
// -------------------------------------------------------------
const char* WIFI_SSID     = "WIFI_ADINIZ";       // Wi-Fi Adı
const char* WIFI_PASSWORD = "WIFI_SIFRENIZ";   // Wi-Fi Şifresi

// Vercel üzerinde barındırılan web sitenizin tam adresi (Sonunda '/' olmadan)
// Örnek: "https://ders-rainz.vercel.app"
const char* VERCEL_URL    = "https://sizin-projeniz.vercel.app";

// -------------------------------------------------------------
// 2. DONANIM PIN VE PWM TANIMLARI
// -------------------------------------------------------------
// ESP32 Dahili LED'i genelde GPIO 2'dir. Röle kontrolü için de GPIO 2, 4 veya 5 uygundur.
const int RELAY_PIN       = 2;

// PWM (Dimmer) Ayarları (ESP32 Dahili LEDC Modülü)
const int PWM_CHANNEL     = 0;
const int PWM_FREQ        = 5000; // 5 kHz
const int PWM_RESOLUTION  = 8;    // 8-bit (0 - 255)

// -------------------------------------------------------------
// 3. ZAMANLAMA PARAMETRELERİ
// -------------------------------------------------------------
unsigned long lastPollTime      = 0;
const unsigned long POLL_DELAY  = 1200; // Web sitesinden 1.2 saniyede bir durum çek

unsigned long lastHeartbeatTime = 0;
const unsigned long HEARTBEAT_DELAY = 10000; // 10 saniyede bir web paneline ping at

// -------------------------------------------------------------
// SETUP (BAŞLANGIÇ)
// -------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n==========================================");
  Serial.println("  ESP32 AKILLI LAMBA KONTROL BAŞLATILDI   ");
  Serial.println("==========================================");

  // Röle / LED pinini yapılandır (PWM ile karartma / toggle)
  ledcSetup(PWM_CHANNEL, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(RELAY_PIN, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0); // Başlangıçta lamba kapalı

  // Wi-Fi Bağlantısını Başlat
  connectWiFi();

  // İlk açılışta web paneline kalp atışı bildir
  sendHeartbeat();
}

// -------------------------------------------------------------
// MAIN LOOP (ANA DÖNGÜ)
// -------------------------------------------------------------
void loop() {
  // Wi-Fi koptuysa yeniden bağlan
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HATA] Wi-Fi baglantisi koptu! Yeniden baglaniliyor...");
    connectWiFi();
    return;
  }

  unsigned long currentMillis = millis();

  // 1. Web sitesinden lamba durumunu sorgula
  if (currentMillis - lastPollTime >= POLL_DELAY) {
    lastPollTime = currentMillis;
    fetchLampState();
  }

  // 2. Web sitesine heartbeat / telemetri gönder
  if (currentMillis - lastHeartbeatTime >= HEARTBEAT_DELAY) {
    lastHeartbeatTime = currentMillis;
    sendHeartbeat();
  }
}

// -------------------------------------------------------------
// WI-FI BAĞLANTI FONKSİYONU
// -------------------------------------------------------------
void connectWiFi() {
  Serial.print("Wi-Fi baglantisi kuruluyor: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[BASARILI] Wi-Fi Agina Baglandi!");
    Serial.print("ESP32 IP Adresi : ");
    Serial.println(WiFi.localIP());
    Serial.print("Sinyal Gücü (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[HATA] Wi-Fi agina baglanilamadi! Bilgileri kontrol edin.");
  }
}

// -------------------------------------------------------------
// VERCEL /api/lamp ENDPOINTINDEN DURUM ÇEKME
// -------------------------------------------------------------
void fetchLampState() {
  WiFiClientSecure client;
  client.setInsecure(); // SSL sertifika doğrulamasını atla (Vercel HTTPS için hızlı ve sorunsuz)

  HTTPClient https;
  String fullUrl = String(VERCEL_URL) + "/api/lamp";

  if (https.begin(client, fullUrl)) {
    int httpCode = https.GET();

    if (httpCode == HTTP_CODE_OK) {
      String payload = https.getString();

      // JSON Çözümleme
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        bool power      = doc["power"];
        int brightness  = doc["brightness"] | 100;
        const char* mode = doc["mode"] | "solid";

        // Lambayı / Röleyi Sür
        if (power) {
          // Parlaklığa göre PWM değeri (0 - 255)
          int dutyCycle = map(brightness, 0, 100, 0, 255);
          ledcWrite(PWM_CHANNEL, dutyCycle);
          // Not: Eğer mekanik 5V röle kullanıyorsanız PWM yerine doğrudan digitalWrite(RELAY_PIN, HIGH); yapabilirsiniz.
        } else {
          ledcWrite(PWM_CHANNEL, 0); // Lamba Tamamen Kapalı
        }
      } else {
        Serial.print("[JSON HATA] ");
        Serial.println(error.f_str());
      }
    }
    https.end();
  }
}

// -------------------------------------------------------------
// VERCEL /api/heartbeat ENDPOINTINE TELEMETRİ GÖNDERME
// -------------------------------------------------------------
void sendHeartbeat() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String fullUrl = String(VERCEL_URL) + "/api/heartbeat";

  if (https.begin(client, fullUrl)) {
    https.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["ip"]            = WiFi.localIP().toString();
    doc["rssi"]          = WiFi.RSSI();
    doc["deviceType"]    = "ESP32 DevKit";
    doc["uptimeSeconds"] = millis() / 1000;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = https.POST(requestBody);
    https.end();
  }
}
