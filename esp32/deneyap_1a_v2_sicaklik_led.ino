/*
  ============================================================================
  PROJE: TÜBİTAK DENEYAP KART 1A v2 - 25°C SICAKLIK & ÇİFT LED SİSTEMİ
  DERS PROJESİ: Yazılım & Gömülü Sistemler (Rainz-cmd / Ders)
  
  MANTIK & GÖREV TANIMI:
    - Oda sıcaklığı > 25.0°C ise:
        -> Breadboard KIRMIZI LED (D4) AÇIK
        -> Breadboard MAVİ LED (D5) KAPALI
        -> Deneyap 1A v2 Dahili NeoPixel: PARLAK KIRMIZI (255, 0, 0)
    - Oda sıcaklığı <= 25.0°C ise:
        -> Breadboard KIRMIZI LED (D4) KAPALI
        -> Breadboard MAVİ LED (D5) AÇIK
        -> Deneyap 1A v2 Dahili NeoPixel: PARLAK MAVİ (0, 0, 255)

  DENEYAP KART 1A v2 DAHİLİ LED FIX:
    Deneyap 1A v2'deki dahili LED klasik RGB LED değil, WS2812B adreslenebilir
    NeoPixel çipidir. Klasik digitalWrite ile sürüldüğünde veri hattı bozulur ve
    LED sarı renkte kilitlenir!
    Bu kod ESP32 çekirdeğinde yerleşik neopixelWrite(RGBLED, r, g, b) fonksiyonunu
    kullanarak donanımsal sarı kilitlenme hatasını %100 çözer.

  BREADBOARD BAĞLANTILARI:
    1. DHT11 Sıcaklık Sensörü:
       - VCC (+) -> Deneyap 3.3V
       - DATA (Orta Pin) -> Deneyap D2 (veya 10K pull-up dirençli)
       - GND (-) -> Deneyap GND
    2. Kırmızı LED:
       - Uzun Bacak (+) -> 220Ω Direnç -> Deneyap D4
       - Kısa Bacak (-) -> Deneyap GND
    3. Mavi LED:
       - Uzun Bacak (+) -> 220Ω Direnç -> Deneyap D5
       - Kısa Bacak (-) -> Deneyap GND
    4. Dahili NeoPixel:
       - Harici kablo gerekmez! Kartın üzerindeki RGBLED pini kullanılır.
  ============================================================================
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// -------------------------------------------------------------
// 1. WI-FI VE VERCEL BULUT YAPILANDIRMASI
// -------------------------------------------------------------
// NOT: Kendi Wi-Fi adınızı ve şifrenizi yazın (Telefonunuzun Hotspot'u da olur!)
const char* WIFI_SSID     = "WIFI_ADINIZ";
const char* WIFI_PASSWORD = "WIFI_SIFRENIZ";
const char* VERCEL_URL    = "https://ders-taupe.vercel.app";

// -------------------------------------------------------------
// 2. PIN TANIMLARI (DENEYAP KART 1A v2)
// -------------------------------------------------------------
#define DHTPIN        D2    // DHT11 Veri Pini (Breadboard D2)
#define DHTTYPE       DHT11 // Sensör Tipi
const int PIN_RED_LED  = D4; // Harici Kırmızı LED
const int PIN_BLUE_LED = D5; // Harici Mavi LED
const float THRESHOLD_TEMP = 25.0; // Kritik Eşik: 25 Derece

DHT dht(DHTPIN, DHTTYPE);

// Zamanlayıcılar (millis tabanlı gecikmesiz döngü)
unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 2000; // 2 saniyede bir sıcaklık ölç
unsigned long lastCloudSync = 0;
const unsigned long cloudInterval = 3000;  // 3 saniyede bir buluta raporla

float currentTemperature = 24.0;
bool isHot = false;

// -------------------------------------------------------------
// 3. LED GÜNCELLEME MOTORU (Breadboard LED'leri + Dahili NeoPixel)
// -------------------------------------------------------------
void updateIndicatorLeds(bool hotState) {
  if (hotState) {
    // 25 Derece Üstü: Kırmızı AÇIK, Mavi KAPALI
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_BLUE_LED, LOW);

#if defined(RGBLED)
    // Deneyap Kart 1A v2 Dahili NeoPixel: Kıpkırmızı
    neopixelWrite(RGBLED, 255, 0, 0);
#endif

    Serial.println(">>> [SICAK > 25°C] -> KIRMIZI LED AÇIK | MAVİ LED KAPALI");
  } else {
    // 25 Derece ve Altı: Kırmızı KAPALI, Mavi AÇIK
    digitalWrite(PIN_RED_LED, LOW);
    digitalWrite(PIN_BLUE_LED, HIGH);

#if defined(RGBLED)
    // Deneyap Kart 1A v2 Dahili NeoPixel: Masmavi
    neopixelWrite(RGBLED, 0, 0, 255);
#endif

    Serial.println(">>> [SERİN <= 25°C] -> MAVİ LED AÇIK | KIRMIZI LED KAPALI");
  }
}

// -------------------------------------------------------------
// 4. SETUP (BAŞLANGIÇ)
// -------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println("   TÜBİTAK DENEYAP KART 1A v2 - 25°C SICAKLIK PROJESİ   ");
  Serial.println("=======================================================");

  // Pin modlarını ayarla
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BLUE_LED, OUTPUT);

  // Başlangıçta güvenli durum: Mavi LED'i yak, Kırmızıyı söndür
  updateIndicatorLeds(false);

  // DHT Sensörünü Başlat
  dht.begin();
  Serial.println("[OK] DHT11 Sensörü D2 pininde başlatıldı.");

  // Wi-Fi Bağlantısı
  Serial.print("[WIFI] Ağ aranıyor: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(400);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] Wi-Fi Bağlantısı Başarılı!");
    Serial.print("[IP] Deneyap Kart IP Adresi: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[UYARI] Wi-Fi henüz bağlanamadı, yerel sensör modu devrede.");
  }
}

// -------------------------------------------------------------
// 5. ANA ÇALIŞMA DÖNGÜSÜ (LOOP)
// -------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // 1. Seri Porttan Manuel USB Test Komutlarını Dinle
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "TEST:HOT") {
      updateIndicatorLeds(true);
      Serial.println("[USB TEST] Sıcaklık > 25°C simüle edildi.");
    } else if (cmd == "TEST:COLD") {
      updateIndicatorLeds(false);
      Serial.println("[USB TEST] Sıcaklık <= 25°C simüle edildi.");
    }
  }

  // 2. Sensörden Sıcaklık Oku ve 25°C Karşılaştırması Yap
  if (now - lastSensorRead >= sensorInterval) {
    lastSensorRead = now;

    float t = dht.readTemperature();
    if (!isnan(t)) {
      currentTemperature = t;
      isHot = (currentTemperature > THRESHOLD_TEMP);
      updateIndicatorLeds(isHot);

      // Seri Monitör & Plotter Formatı
      Serial.print("SICAKLIK:");
      Serial.print(currentTemperature);
      Serial.print(" | EŞİK:");
      Serial.print(THRESHOLD_TEMP);
      Serial.print(" | LED_DURUMU:");
      Serial.println(isHot ? "KIRMIZI" : "MAVI");
    } else {
      Serial.println("[HATA] DHT11 okunamadı! Kabloları (3.3V, D2, GND) kontrol edin.");
    }
  }

  // 3. Vercel Bulut Paneline Canlı Veri Gönder (POST /api/devices)
  if (WiFi.status() == WL_CONNECTED && (now - lastCloudSync >= cloudInterval)) {
    lastCloudSync = now;
    sendTelemetryToCloud();
  }
}

// -------------------------------------------------------------
// 6. BULUT EŞİTLEME (HTTPS POST)
// -------------------------------------------------------------
void sendTelemetryToCloud() {
  WiFiClientSecure client;
  client.setInsecure(); // SSL sertifika doğrulamasını atla

  HTTPClient https;
  String endpoint = String(VERCEL_URL) + "/api/devices";

  if (https.begin(client, endpoint)) {
    https.addHeader("Content-Type", "application/json");

    // JSON Veri Paketi
    StaticJsonDocument<256> doc;
    JsonObject thermo = doc.createNestedObject("thermostat");
    thermo["currentTemp"] = currentTemperature;
    thermo["sensorType"] = "DHT11";
    thermo["boardType"] = "deneyap_1a_v2";

    String jsonString;
    serializeJson(doc, jsonString);

    int httpResponseCode = https.POST(jsonString);
    if (httpResponseCode == 200) {
      Serial.println("[BULUT] Telemetri Vercel'e aktarıldı (" + String(currentTemperature, 1) + " °C)");
    }
    https.end();
  }
}
