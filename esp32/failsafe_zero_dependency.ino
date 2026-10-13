/*
  ==============================================================
  SIFIR-HATA & KÜTÜPHANESİZ MOD (ZERO-DEPENDENCY FAIL-SAFE)
  (ESP32Servo veya Adafruit kütüphanesi YÜKLEMEDEN çalışır!)
  Sadece dahili WiFi ve HTTPClient kullanır. 100% derleme garantisi.
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid      = "WIFI_ADINIZ";
const char* password  = "WIFI_SIFRENIZ";
const char* serverUrl = "https://ders-taupe.vercel.app";

const int PIN_LAMP = 2; // Dahili mavi LED / Röle
const int PIN_FAN  = 4;
unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_FAN, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);
  digitalWrite(PIN_FAN, LOW);

  WiFi.begin(ssid, password);
  Serial.println("[FAIL-SAFE] Ekstra kutuphanesiz temel mod baslatildi.");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1500) {
    lastPoll = millis();
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/lamp")) {
      if (https.GET() == 200) {
        String payload = https.getString();
        bool isPowerOn = payload.indexOf("\"power\":true") != -1;
        digitalWrite(PIN_LAMP, isPowerOn ? HIGH : LOW);
        Serial.println("Lamba: " + String(isPowerOn ? "ACIK" : "KAPALI"));
      }
      https.end();
    }
  }
}
