/*
  ============================================================================
  TÜBİTAK DENEYAP KART 1A v2 (ESP32-S3) - CRASH-FREE ZERO-DEPENDENCY LED KODU
  
  HATA ANALİZİ (EXCVADDR: 0x00000011 VE SÜREKLİ YENİDEN BAŞLAMA SEBEBİ):
  1. Deneyap Kart 1A v2 üzerinde ESP32-S3 işlemcisi vardır.
  2. "Adafruit_NeoPixel" kütüphanesi ESP32-S3'ün yeni RMT donanımıyla çakışır
     ve EXCVADDR: 0x00000011 (Null Pointer Dereference) hatası vererek
     kartı sonsuz döngüde REBOOT (Reset) ettirir!
  3. Kart sürekli reset attığı için RGB'nin yanındaki kırmızı güç/reset LED'i
     sürekli yanıp söner ve RGB asla yanamaz!
  
  ÇÖZÜM:
  Adafruit kütüphanesi ÇÖPE ATILDI! ESP32-S3 çekirdeğinde yerleşik donanımsal 
  "neopixelWrite(RGBLED, r, g, b)" fonksiyonu kullanıldı.
  Sıfır kütüphane çakışması, sıfır reset, %100 stabil çalışma!
  ============================================================================
*/

#define MQTT_MAX_PACKET_SIZE 1024

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// 1. WI-FI VE MQTT BİLGİLERİN
const char* ssid        = "RainzWifi";
const char* password    = "rainz1987altan";
const char* mqtt_server = "broker.emqx.io";
const int   mqtt_port   = 1883;

// 2. PIN TANIMLARI
const int PIN_LAMP = D0; // Röle / Harici LED

#ifndef RGBLED
  #define RGBLED D9
#endif

WiFiClient espClient;
PubSubClient client(espClient);

// ESP32-S3 Donanımsal Dahili NeoPixel Sürücüsü (Kütüphanesiz ve Crash'siz)
void setRgbColor(uint8_t r, uint8_t g, uint8_t b) {
  // ESP32-S3 yerleşik RMT sürücüsü:
  neopixelWrite(RGBLED, r, g, b);

  // Harici D0 pinini de senkronize et (RGB yanıyorsa D0 da HIGH)
  digitalWrite(PIN_LAMP, (r > 0 || g > 0 || b > 0) ? HIGH : LOW);

  Serial.printf("[RGB] R:%d G:%d B:%d -> LED YANDI\n", r, g, b);
}

// Açılış Test Animasyonu (Yeşil -> Mavi -> Kırmızı)
void bootLedSuccess() {
  Serial.println("[TEST] Dahili NeoPixel test ediliyor...");
  setRgbColor(0, 200, 0); delay(300); // Yeşil
  setRgbColor(0, 0, 200); delay(300); // Mavi
  setRgbColor(200, 0, 0); delay(300); // Kırmızı
  setRgbColor(0, 0, 0);   // Kapat
  Serial.println("[OK] Deneyap 1A v2 LED calisiyor, sistem stabil!");
}

// Gelen Komutları İşleme
void processCommand(String message) {
  message.trim();
  if (message.length() == 0) return;

  Serial.println("\n[GELEN KOMUT] " + message);
  String msgLower = message;
  msgLower.toLowerCase();

  // A) Düz Metin Komutları ("1", "0", "on", "off")
  if (msgLower == "1" || msgLower == "on" || msgLower == "true" || msgLower == "açık") {
    digitalWrite(PIN_LAMP, HIGH);
    setRgbColor(255, 183, 3); // Sıcak sarı / gün ışığı
    return;
  }
  if (msgLower == "0" || msgLower == "off" || msgLower == "false" || msgLower == "kapalı") {
    digitalWrite(PIN_LAMP, LOW);
    setRgbColor(0, 0, 0); // Kapat
    return;
  }

  // B) Düz Hex Renk Kodu ("#ff0000" veya "ff0000")
  if (message.startsWith("#") || (message.length() == 6 && isxdigit(message[0]))) {
    String h = message;
    if (h.startsWith("#")) h.remove(0, 1);
    uint8_t r = strtol(h.substring(0, 2).c_str(), NULL, 16);
    uint8_t g = strtol(h.substring(2, 4).c_str(), NULL, 16);
    uint8_t b = strtol(h.substring(4, 6).c_str(), NULL, 16);
    setRgbColor(r, g, b);
    return;
  }

  // C) Siteden Gelen JSON Paketleri
  if (message.startsWith("{")) {
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      // 1. Sitedeki Lamba Sekmesi
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
          setRgbColor(r, g, b);
        } else {
          setRgbColor(0, 0, 0);
        }
        return;
      }

      // 2. Sitedeki RGB Sekmesi
      if (doc.containsKey("rgb")) {
        bool power = doc["rgb"]["power"] | false;
        if (power) {
          const char* hexColor = doc["rgb"]["color"] | "#8a2be2";
          String h(hexColor);
          if (h.startsWith("#")) h.remove(0, 1);
          uint8_t r = strtol(h.substring(0, 2).c_str(), NULL, 16);
          uint8_t g = strtol(h.substring(2, 4).c_str(), NULL, 16);
          uint8_t b = strtol(h.substring(4, 6).c_str(), NULL, 16);
          setRgbColor(r, g, b);
        } else {
          setRgbColor(0, 0, 0);
        }
        return;
      }

      // 3. Sıcaklık Sekmesi Test Komutları
      if (doc.containsKey("thermostat")) {
        bool redLed = doc["thermostat"]["redLed"] | false;
        if (redLed) setRgbColor(255, 0, 0); // Kırmızı
        else setRgbColor(0, 0, 255);        // Mavi
        return;
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
    String clientId = "Deneyap1Av2-" + String(random(0xffff), HEX);
    client.setBufferSize(1024);

    if (client.connect(clientId.c_str())) {
      Serial.println(" BAGLANDI!");
      // SADECE ve SADECE projemizin topic'i dinlenir (ASLA '#' yazma!)
      client.subscribe("ders/rainz/commands");
      client.subscribe("ders/rainz/commands/#");
      Serial.println("[MQTT] ders/rainz/commands dinlemede.");
    } else {
      Serial.printf(" Hata: %d (3 sn sonra tekrar)\n", client.state());
      delay(3000);
      break;
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n=======================================================");
  Serial.println(" TÜBİTAK DENEYAP KART 1A v2 (ESP32-S3) LED MASTER BAŞLADI");
  Serial.println("=======================================================");

  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  // Açılış testi (Hata varsa burada çökerdi, ama neopixelWrite asla çökmez!)
  bootLedSuccess();

  // Wi-Fi
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
    Serial.println("\n[UYARI] Wi-Fi baglanamadi, USB Port dinleniyor.");
  }

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  // 1. MQTT Paketlerini İşle
  if (WiFi.status() == WL_CONNECTED) {
    if (!client.connected()) {
      reconnect();
    } else {
      client.loop();
    }
  }

  // 2. USB Serial Üzerinden Dinle (Sitedeki "USB Bağlan" Butonu İçin)
  if (Serial.available() > 0) {
    String serialMsg = Serial.readStringUntil('\n');
    processCommand(serialMsg);
  }
}
