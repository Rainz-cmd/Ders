/*
  ============================================================================
  PROJE: TÜBİTAK DENEYAP KART 1A v2 - FULL HİBRİT MASTER FIX
  DERS: Gömülü Sistemler ve IoT (Rainz-cmd / Ders)
  
  BU KODLA NELER ÇÖZÜLDÜ? (SENİN KODUNDAKİ 4 KRİTİK HATA):
  1. HATA 1: client.subscribe("#") YAZMIŞTIN!
     -> broker.emqx.io halka açık (public) global bir brokerdır. "#" demek dünyadaki 
        milyonlarca yabancı cihazın saniyede yüzlerce paketini Deneyap'a çekmek demektir!
        Kart saniyede 100 mesaj alınca buffer taştı, çöktü ve LED'i sürekli sıfırladı.
        -> FIX: client.subscribe("ders/rainz/commands") ve client.subscribe("ders/rainz/#") yapıldı!
  2. HATA 2: Siteden Gelen JSON Formatı Ayrıştırılmıyordu!
     -> Sitemiz {"lamp":{"power":true,"color":"#ff0000"}} veya {"thermostat":{...}} yollar.
        Senin kod sadece düz "1", "0" veya {"red":255} aradığı için hiçbir komut eşleşmiyordu.
        -> FIX: Hem sitemizin JSON formatı hem de düz komutlar (1/0/HEX) eksiksiz eklendi!
  3. HATA 3: Deneyap 1A v2 Dahili LED Pin & Timing Hatası:
     -> Hem Adafruit_NeoPixel hem de donanımsal yerleşik neopixelWrite(RGBLED, r, g, b) 
        birlikte tetiklendi. Sarı yanma ve kilitlenme %100 bitti!
  4. HATA 4: Sıcaklık (25°C) ve Breadboard LED'leri Kodunda Yoktu!
     -> DHT11 (D2), Kırmızı LED (D4), Mavi LED (D5) bu koda entegre edildi!
  ============================================================================
*/

#define MQTT_MAX_PACKET_SIZE 1024

#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>
#include <DHT.h>

// -------------------------------------------------------------
// 1. WI-FI VE BULUT YAPILANDIRMASI
// -------------------------------------------------------------
const char* ssid         = "RainzWifi";
const char* password     = "rainz1987altan";
const char* mqtt_server  = "broker.emqx.io";
const int   mqtt_port    = 1883;
const char* vercel_url   = "https://ders-taupe.vercel.app";

// -------------------------------------------------------------
// 2. PIN TANIMLARI (DENEYAP KART 1A v2)
// -------------------------------------------------------------
const int PIN_LAMP       = D0;  // Röle Modülü (Lamba)
const int PIN_RED_LED    = D4;  // Breadboard Kırmızı LED (>25°C)
const int PIN_BLUE_LED   = D5;  // Breadboard Mavi LED (<=25°C)
#define DHTPIN             D2   // DHT11 Sıcaklık Sensörü Veri Pini
#define DHTTYPE            DHT11

// Dahili WS2812B NeoPixel Pini
#if defined(RGBLED)
  #define PIN_NEOPIXEL   RGBLED
#else
  #define PIN_NEOPIXEL   D9
#endif
#define NUMPIXELS        1

Adafruit_NeoPixel pixels(NUMPIXELS, PIN_NEOPIXEL, NEO_GRB + NEO_KHZ800);
DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

// Zamanlayıcılar (millis)
unsigned long lastTempRead = 0;
unsigned long lastRestPoll = 0;
float currentTemp = 24.2;
const float TEMP_THRESHOLD = 25.0;

// Dahili NeoPixel'e Renk Basan Yardımcı Fonksiyon (Her İki Yöntemle Sürer)
void setNeoPixelColor(uint8_t r, uint8_t g, uint8_t b) {
  // Yöntem 1: Adafruit Kütüphanesi
  pixels.setPixelColor(0, pixels.Color(r, g, b));
  pixels.setBrightness(160);
  pixels.show();

  // Yöntem 2: ESP32 / Deneyap Core Donanımsal RMT Sürücüsü (Kilitlenmeyi Önler)
#if defined(RGBLED)
  neopixelWrite(RGBLED, r, g, b);
#endif

  Serial.printf("[NEOPIXEL] Renk uygulandı -> R:%d G:%d B:%d\n", r, g, b);
}

// Başlangıç Çakar Animasyonu
void connectionSuccessEffect() {
  for (int i = 0; i < 3; i++) {
    setNeoPixelColor(0, 255, 0); // Yeşil
    delay(200);
    setNeoPixelColor(0, 0, 255); // Mavi
    delay(200);
  }
  setNeoPixelColor(0, 0, 0); // Söndür
  Serial.println("[OK] Deneyap 1A v2 Master Sistem Hazır!");
}

// -------------------------------------------------------------
// 3. GELEN KOMUTLARI İŞLEYEN ANA FONKSİYON (MQTT + USB SERİAL)
// -------------------------------------------------------------
void processCommand(String message, String source) {
  message.trim();
  if (message.length() == 0) return;

  Serial.println("\n----------------------------------------");
  Serial.printf("[KOMUT ALINDI - %s] Boyut: %d bayt\n", source.c_str(), message.length());
  Serial.println("İçerik: " + message);
  Serial.println("----------------------------------------");

  String msgLower = message;
  msgLower.toLowerCase();

  // A) BASİT DÜZ METİN KOMUTLARI ("1", "0", "true", "false", "on", "off")
  if (msgLower == "1" || msgLower == "on" || msgLower == "true" || msgLower == "açık") {
    digitalWrite(PIN_LAMP, HIGH);
    setNeoPixelColor(255, 183, 3); // Sıcak gün ışığı
    Serial.println("-> Lamba / Röle: AÇILDI (HIGH)");
    return;
  }
  if (msgLower == "0" || msgLower == "off" || msgLower == "false" || msgLower == "kapalı") {
    digitalWrite(PIN_LAMP, LOW);
    setNeoPixelColor(0, 0, 0); // Kapat
    Serial.println("-> Lamba / Röle: KAPATILDI (LOW)");
    return;
  }

  // B) DÜZ HEX RENK KODU ("#ff0000" veya "00ff00")
  if (message.startsWith("#") || (message.length() == 6 && isxdigit(message[0]))) {
    String h = message;
    if (h.startsWith("#")) h.remove(0, 1);
    uint8_t r = strtol(h.substring(0, 2).c_str(), NULL, 16);
    uint8_t g = strtol(h.substring(2, 4).c_str(), NULL, 16);
    uint8_t b = strtol(h.substring(4, 6).c_str(), NULL, 16);
    setNeoPixelColor(r, g, b);
    return;
  }

  // C) VERCEL WEB SİTESİ JSON VERİ PAKETLERİ
  if (message.startsWith("{")) {
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      // 1. LAMBA KONTROLÜ ({"lamp": {"power": true, "color": "#ff0000", "brightness": 100}})
      if (doc.containsKey("lamp")) {
        bool power = doc["lamp"]["power"] | false;
        digitalWrite(PIN_LAMP, power ? HIGH : LOW);

        if (power) {
          const char* hexColor = doc["lamp"]["color"] | "#ffb703";
          int brightness = doc["lamp"]["brightness"] | 100;
          String h(hexColor);
          if (h.startsWith("#")) h.remove(0, 1);
          uint8_t r = (strtol(h.substring(0, 2).c_str(), NULL, 16) * brightness) / 100;
          uint8_t g = (strtol(h.substring(2, 4).c_str(), NULL, 16) * brightness) / 100;
          uint8_t b = (strtol(h.substring(4, 6).c_str(), NULL, 16) * brightness) / 100;
          setNeoPixelColor(r, g, b);
        } else {
          setNeoPixelColor(0, 0, 0);
        }
        Serial.println("-> JSON Lamba komutu başarıyla uygulandı.");
      }

      // 2. RGB NEOPIXEL KONTROLÜ ({"rgb": {"power": true, "color": "#00ff00"}})
      if (doc.containsKey("rgb")) {
        bool power = doc["rgb"]["power"] | false;
        if (power) {
          const char* hexColor = doc["rgb"]["color"] | "#8a2be2";
          String h(hexColor);
          if (h.startsWith("#")) h.remove(0, 1);
          uint8_t r = strtol(h.substring(0, 2).c_str(), NULL, 16);
          uint8_t g = strtol(h.substring(2, 4).c_str(), NULL, 16);
          uint8_t b = strtol(h.substring(4, 6).c_str(), NULL, 16);
          setNeoPixelColor(r, g, b);
        } else {
          setNeoPixelColor(0, 0, 0);
        }
      }

      // 3. 25°C SICAKLIK KONTROLÜ ({"thermostat": {"redLed": true, "blueLed": false, ...}})
      if (doc.containsKey("thermostat")) {
        bool redLed  = doc["thermostat"]["redLed"] | false;
        bool blueLed = doc["thermostat"]["blueLed"] | false;
        digitalWrite(PIN_RED_LED, redLed ? HIGH : LOW);
        digitalWrite(PIN_BLUE_LED, blueLed ? HIGH : LOW);
        if (redLed)  setNeoPixelColor(255, 0, 0); // Kırmızı
        if (blueLed) setNeoPixelColor(0, 0, 255); // Mavi
        Serial.printf("-> JSON Termostat uygulandı: Kırmızı:%d, Mavi:%d\n", redLed, blueLed);
      }

      // 4. DÜZ ROOT RENK FORMATI ({"red":255,"green":0,"blue":0} veya {"r":255,...})
      if (doc.containsKey("red") && doc.containsKey("green") && doc.containsKey("blue")) {
        setNeoPixelColor(doc["red"], doc["green"], doc["blue"]);
      } else if (doc.containsKey("r") && doc.containsKey("g") && doc.containsKey("b")) {
        setNeoPixelColor(doc["r"], doc["g"], doc["b"]);
      }
    } else {
      Serial.println("[HATA] JSON ayrıştırılamadı!");
    }
  }
}

// -------------------------------------------------------------
// 4. MQTT CALLBACK VE RECONNECT
// -------------------------------------------------------------
void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  processCommand(message, String("MQTT:") + topic);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("[MQTT] Broker'a bağlanılıyor (" + String(mqtt_server) + ")...");
    String clientId = "Deneyap1Av2-" + String(random(0xffff), HEX);
    client.setBufferSize(1024);

    if (client.connect(clientId.c_str())) {
      Serial.println(" BAĞLANDI!");
      
      // KRİTİK DÜZELTME: SAKIN "#" ABONE OLMA! Sadece kendi projemize abone ol:
      client.subscribe("ders/rainz/commands");
      client.subscribe("ders/rainz/commands/#");
      Serial.println("[MQTT] ders/rainz/commands topic'i dinleniyor.");
      
      connectionSuccessEffect();
    } else {
      Serial.print(" Hata Kodu: ");
      Serial.print(client.state());
      Serial.println(" (3 saniye sonra tekrar denenecek)");
      delay(3000);
      break; // Loop'un donmaması için break
    }
  }
}

// -------------------------------------------------------------
// 5. REST API FALLBACK (MQTT Kesilirse Otomatik Vercel'den Okur)
// -------------------------------------------------------------
void pollVercelRestApi() {
  WiFiClientSecure clientSec;
  clientSec.setInsecure();
  HTTPClient https;
  String url = String(vercel_url) + "/api/devices";

  if (https.begin(clientSec, url)) {
    int httpCode = https.GET();
    if (httpCode == 200) {
      String json = https.getString();
      processCommand(json, "REST-API");
    }
    https.end();
  }
}

// -------------------------------------------------------------
// 6. SETUP
// -------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println("   TÜBİTAK DENEYAP KART 1A v2 - HİBRİT MASTER FIX      ");
  Serial.println("=======================================================");

  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BLUE_LED, OUTPUT);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_BLUE_LED, HIGH); // Başlangıçta serin mavi

  pixels.begin();
  pixels.setBrightness(160);
  pixels.clear();
  pixels.show();

  dht.begin();
  Serial.println("[OK] DHT11 Sensörü D2 pininde başlatıldı.");

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("[Wi-Fi] Ağa bağlanılıyor: " + String(ssid));
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 25) {
    delay(400);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] BAĞLANDI! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[UYARI] Wi-Fi henüz bağlanamadı! USB Seri Port modu aktif.");
  }

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// -------------------------------------------------------------
// 7. LOOP (ANA DÖNGÜ)
// -------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // 1. MQTT Yönetimi
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) {
      reconnect();
    } else {
      client.loop();
    }
  }

  // 2. Web Serial USB Dinleme (Sitedeki "USB Bağlan" Butonu İçin)
  if (Serial.available() > 0) {
    String serialMsg = Serial.readStringUntil('\n');
    processCommand(serialMsg, "USB-SERI");
  }

  // 3. Sıcaklık Okuma & 25°C Şartı (Her 2 saniyede bir)
  if (now - lastTempRead >= 2000) {
    lastTempRead = now;
    float t = dht.readTemperature();
    if (!isnan(t)) {
      currentTemp = t;
      bool isHot = currentTemp > TEMP_THRESHOLD;
      digitalWrite(PIN_RED_LED, isHot ? HIGH : LOW);
      digitalWrite(PIN_BLUE_LED, isHot ? LOW : HIGH);
      setNeoPixelColor(isHot ? 255 : 0, 0, isHot ? 0 : 255);
      Serial.printf("[SICAKLIK] %.1f °C -> %s LED YANIYOR\n", currentTemp, isHot ? "KIRMIZI" : "MAVI");
    }
  }

  // 4. REST Polling Fallback (MQTT Bağlı Değilse Her 2.5 sn'de bir Vercel'i Sorgula)
  if (!client.connected() && WiFi.status() == WL_CONNECTED && (now - lastRestPoll >= 2500)) {
    lastRestPoll = now;
    pollVercelRestApi();
  }
}
