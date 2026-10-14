/*
  ============================================================================
  TÜBİTAK DENEYAP KART 1A v2 (ESP32-S3) - 25°C SICAKLIK & ÇİFT LED MASTER KODU
  
  MANTIK:
    - Oda Sıcaklığı > 25.0°C ise:
        -> Breadboard KIRMIZI LED (D4) AÇIK (HIGH)
        -> Breadboard MAVİ LED (D5) KAPALI (LOW)
        -> Deneyap 1A v2 Dahili NeoPixel: PARLAK KIRMIZI (255, 0, 0)
    - Oda Sıcaklığı <= 25.0°C ise:
        -> Breadboard KIRMIZI LED (D4) KAPALI (LOW)
        -> Breadboard MAVİ LED (D5) AÇIK (HIGH)
        -> Deneyap 1A v2 Dahili NeoPixel: PARLAK MAVİ (0, 0, 255)

  ÇÖKME (BOOTLOOP / RELOAD) ÖNLEME:
    Adafruit_NeoPixel kütüphanesi kullanılmaz! ESP32-S3 işlemcisinin donanımsal 
    "neopixelWrite(RGBLED, r, g, b)" fonksiyonu kullanılır. Sıfır kilitlenme!

  BREADBOARD KABLO BAĞLANTILARI (Attığın Fotoğraflara Göre):
    1. DHT11 Sensörü:
       - VCC (+) -> Deneyap 3.3V
       - GND (-) -> Deneyap GND
       - DATA (Sinyal / Sarı Kablo) -> Deneyap D2
    2. Kırmızı LED:
       - Anot (+) -> Deneyap D4 (Mümkünse 220Ω direnç üzerinden)
       - Katot (-) -> Deneyap GND
    3. Mavi LED:
       - Anot (+) -> Deneyap D5 (Mümkünse 220Ω direnç üzerinden)
       - Katot (-) -> Deneyap GND
  ============================================================================
*/

#define MQTT_MAX_PACKET_SIZE 1024

#include <WiFi.h>
#include <PubSubClient.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// 1. WI-FI VE BULUT BİLGİLERİ
const char* ssid         = "RainzWifi";
const char* password     = "rainz1987altan";
const char* mqtt_server  = "broker.emqx.io";
const int   mqtt_port    = 1883;
const char* vercel_url   = "https://ders-taupe.vercel.app";

// 2. PIN TANIMLARI
#define DHTPIN             D2   // DHT11 Veri Pini (Sarı Kablo)
#define DHTTYPE            DHT11

const int PIN_RED_LED    = D4;  // Breadboard Kırmızı LED
const int PIN_BLUE_LED   = D5;  // Breadboard Mavi LED
const int PIN_LAMP       = D0;  // Röle / Harici Lamba Pini

#ifndef RGBLED
  #define RGBLED D9
#endif

const float TEMP_THRESHOLD = 25.0; // 25 Derece Eşik Şartı

DHT dht(DHTPIN, DHTTYPE);
WiFiClient espClient;
PubSubClient client(espClient);

unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 2000; // 2 saniyede bir ölçüm
unsigned long lastCloudSync = 0;
const unsigned long cloudInterval = 3000;

float currentTemp = 24.0;
bool isHot = false;

// Dahili NeoPixel Sürücüsü (Kütüphanesiz ve Crash-Free)
void setOnboardNeoPixel(uint8_t r, uint8_t g, uint8_t b) {
  neopixelWrite(RGBLED, r, g, b);
}

// LED'leri Sıcaklık Durumuna Göre Tetikleyen Ana Fonksiyon
void applyTemperatureState(bool hot) {
  if (hot) {
    // 25 DERECE ÜSTÜ -> KIRMIZI AÇIK, MAVİ KAPALI
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_BLUE_LED, LOW);
    setOnboardNeoPixel(255, 0, 0); // Dahili NeoPixel Kıpkırmızı!
    Serial.println(">>> [SICAK > 25°C] -> KIRMIZI LED YANDI | MAVİ SÖNDÜ | DAHİLİ: KIRMIZI");
  } else {
    // 25 DERECE VE ALTI -> MAVİ AÇIK, KIRMIZI KAPALI
    digitalWrite(PIN_RED_LED, LOW);
    digitalWrite(PIN_BLUE_LED, HIGH);
    setOnboardNeoPixel(0, 0, 255); // Dahili NeoPixel Masmavi!
    Serial.println(">>> [SERİN <= 25°C] -> MAVİ LED YANDI | KIRMIZI SÖNDÜ | DAHİLİ: MAVİ");
  }
}

// Siteden Gelen Emirleri İşleme (Web Serial & MQTT)
void processCommand(String message) {
  message.trim();
  if (message.length() == 0) return;

  Serial.println("[KOMUT ALINDI] " + message);

  // Manuel Test Komutları
  if (message == "TEST:HOT" || message == "HOT") {
    applyTemperatureState(true);
    return;
  }
  if (message == "TEST:COLD" || message == "COLD") {
    applyTemperatureState(false);
    return;
  }

  // Siteden Gelen JSON Verisi
  if (message.startsWith("{")) {
    DynamicJsonDocument doc(1024);
    if (!deserializeJson(doc, message)) {
      if (doc.containsKey("thermostat")) {
        bool red = doc["thermostat"]["redLed"] | false;
        applyTemperatureState(red);
      }
      if (doc.containsKey("lamp")) {
        bool power = doc["lamp"]["power"] | false;
        digitalWrite(PIN_LAMP, power ? HIGH : LOW);
      }
    }
  }
}

void callback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
  processCommand(msg);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("[MQTT] Baglaniliyor...");
    String clientId = "Deneyap1Av2-Temp-" + String(random(0xffff), HEX);
    client.setBufferSize(1024);

    if (client.connect(clientId.c_str())) {
      Serial.println(" BAGLANDI!");
      // SADECE ve SADECE projemizin komut topic'i:
      client.subscribe("ders/rainz/commands");
      client.subscribe("ders/rainz/commands/#");
      Serial.println("[MQTT] ders/rainz/commands kanali aktif.");
    } else {
      Serial.printf(" Hata: %d (3 sn sonra tekrar denenecek)\n", client.state());
      delay(3000);
      break;
    }
  }
}

// Vercel Bulut Paneline Telemetri Gönder
void syncToVercel(float temp, bool hotState) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure clientSec;
  clientSec.setInsecure();
  HTTPClient https;
  String url = String(vercel_url) + "/api/devices";

  if (https.begin(clientSec, url)) {
    https.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    JsonObject thermo = doc.createNestedObject("thermostat");
    thermo["currentTemp"] = temp;
    thermo["redLed"] = hotState;
    thermo["blueLed"] = !hotState;
    thermo["sensorType"] = "DHT11";
    thermo["boardType"] = "deneyap_1a_v2";

    String jsonStr;
    serializeJson(doc, jsonStr);
    https.POST(jsonStr);
    https.end();
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println(" TÜBİTAK DENEYAP KART 1A v2 - 25°C SICAKLIK SİSTEMİ AKTİF");
  Serial.println("=======================================================");

  // Pin modları
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BLUE_LED, OUTPUT);
  pinMode(PIN_LAMP, OUTPUT);

  // Başlangıçta Mavi LED'i yak, Kırmızı ve Dahiliyi hazırla
  applyTemperatureState(false);

  // DHT11 Sensörünü Başlat
  dht.begin();
  Serial.println("[OK] DHT11 Sensörü D2 pininde baslatildi.");

  // Wi-Fi Bağlantısı
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("[Wi-Fi] Baglaniliyor: " + String(ssid));
  int r = 0;
  while (WiFi.status() != WL_CONNECTED && r < 25) {
    delay(400);
    Serial.print(".");
    r++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[Wi-Fi] BAGLANDI! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[UYARI] Wi-Fi baglanamadi, yerel sensör modu aktif.");
  }

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  unsigned long now = millis();

  // 1. MQTT Döngüsü
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) reconnect();
    else client.loop();
  }

  // 2. USB Seri Porttan Komut Dinle
  if (Serial.available() > 0) {
    String serialMsg = Serial.readStringUntil('\n');
    processCommand(serialMsg);
  }

  // 3. Sensörden Sıcaklık Oku ve 25°C Karşılaştırması Yap
  if (now - lastSensorRead >= sensorInterval) {
    lastSensorRead = now;

    float t = dht.readTemperature();
    if (!isnan(t)) {
      currentTemp = t;
      isHot = (currentTemp > TEMP_THRESHOLD);
      applyTemperatureState(isHot);

      // Arduino IDE Seri Çizici (Serial Plotter) Formatı:
      Serial.printf("SICAKLIK:%.1f,ESIK:%.1f,DURUM:%s\n", 
                    currentTemp, TEMP_THRESHOLD, isHot ? "KIRMIZI" : "MAVI");
    } else {
      Serial.println("[UYARI] DHT11 okunamadi! Kablolari kontrol edin (VCC, D2, GND).");
    }
  }

  // 4. Bulut Sunucusuna Canlı Sıcaklık Raporla
  if (now - lastCloudSync >= cloudInterval) {
    lastCloudSync = now;
    syncToVercel(currentTemp, isHot);
  }
}
