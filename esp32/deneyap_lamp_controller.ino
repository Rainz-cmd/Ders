/*
  ============================================================================
  PROJE: TÜBİTAK / T3 VAKFI DENEYAP KART - AKILLI LAMBA KONTROLÜ
  DERS: Yazılım & Gömülü Sistemler Dersi
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
const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "https://sizin-projeniz.vercel.app";

// -------------------------------------------------------------
// 2. DENEYAP KART PIN TANIMLARI
// -------------------------------------------------------------
// Deneyap Kart üzerinde dahili RGB LED veya harici D0 pini kullanılabilir
const int RELAY_PIN = D0; // Röle modülünün IN pini buraya bağlanır

unsigned long lastPoll = 0;
const unsigned long pollInterval = 1200;

unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 10000;

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n[DENEYAP KART] Akilli Lamba Projesi Baslatildi");

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  // Wi-Fi Baglan
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }

  Serial.println("\n[OK] Deneyap Kart Wi-Fi Agina Baglandi!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  sendHeartbeat();
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
    pollLamp();
  }

  if (now - lastHeartbeat >= heartbeatInterval) {
    lastHeartbeat = now;
    sendHeartbeat();
  }
}

void pollLamp() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = String(serverUrl) + "/api/lamp";

  if (https.begin(client, url)) {
    int code = https.GET();
    if (code == 200) {
      String json = https.getString();
      DynamicJsonDocument doc(1024);
      deserializeJson(doc, json);

      bool power = doc["power"] | false;
      digitalWrite(RELAY_PIN, power ? HIGH : LOW);

      // Deneyap Kart 1A v2 Dahili WS2812B NeoPixel Renk Kontrolü:
      const char* hexColor = doc["color"] | "#ffb703";
      int brightness = doc["brightness"] | 100;

      long rgbVal = strtol(hexColor[0] == '#' ? &hexColor[1] : hexColor, NULL, 16);
      int r = (((rgbVal >> 16) & 0xFF) * brightness) / 100;
      int g = (((rgbVal >> 8) & 0xFF) * brightness) / 100;
      int b = ((rgbVal & 0xFF) * brightness) / 100;

#if defined(RGBLED)
      if (power) {
        neopixelWrite(RGBLED, r, g, b); // Sitede seçilen renk Deneyap dahili LED'e yansır
      } else {
        neopixelWrite(RGBLED, 0, 0, 0); // Kapat
      }
#endif
      Serial.printf("Lamba: %s | Renk: %s (R:%d G:%d B:%d) | Parlaklik: %%%d\n", power ? "ACIK" : "KAPALI", hexColor, r, g, b, brightness);
    }
    https.end();
  }
}

void sendHeartbeat() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = String(serverUrl) + "/api/heartbeat";

  if (https.begin(client, url)) {
    https.addHeader("Content-Type", "application/json");

    StaticJsonDocument<200> doc;
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    doc["deviceType"] = "Deneyap Kart 1A";
    doc["uptimeSeconds"] = millis() / 1000;

    String body;
    serializeJson(doc, body);

    https.POST(body);
    https.end();
  }
}
