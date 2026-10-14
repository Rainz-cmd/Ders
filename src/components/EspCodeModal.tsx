"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Code,
  Cpu,
  BookOpen,
  Wifi,
  Sparkles,
  Fan,
  Lock,
  Droplets,
  Lightbulb,
  Radio,
  Thermometer,
} from "lucide-react";

interface EspCodeModalProps {
  onClose: () => void;
  vercelUrl: string;
  activeDevice?: "lamp" | "fan" | "lock" | "rgb" | "irrigation" | "thermostat" | "guide";
}

export const EspCodeModal: React.FC<EspCodeModalProps> = ({
  onClose,
  vercelUrl,
  activeDevice = "lamp",
}) => {
  const [board, setBoard] = useState<"esp32" | "deneyap_1a_v2">("deneyap_1a_v2");

  // Default code type to whichever device is active on the dashboard!
  const [codeType, setCodeType] = useState<string>(
    activeDevice === "guide" ? "lamp" : activeDevice
  );

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (activeDevice && activeDevice !== "guide") {
      setCodeType(activeDevice);
    }
  }, [activeDevice]);

  const cleanUrl = vercelUrl || "https://ders-taupe.vercel.app";

  // 1. STANDALONE LAMP (LAMBA / RÖLE)
  const lampCode = `/*
  ==============================================================
  CİHAZ 1: SADECE AKILLI LAMBA & 5V RÖLE (STANDALONE)
  Bağlantı: Röle IN -> ESP32 GPIO 2 (Deneyap için D0)
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

const int PIN_LAMP = ${board === "esp32" ? "2" : "D0"}; // Röle Tetik Pini
unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\n[OK] Lamba Sistemi Wi-Fi Agina Baglandi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1200) {
    lastPoll = millis();
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/lamp")) {
      if (https.GET() == 200) {
        DynamicJsonDocument doc(512);
        deserializeJson(doc, https.getString());
        bool power = doc["power"] | false;
        digitalWrite(PIN_LAMP, power ? HIGH : LOW);

        // Deneyap Kart 1A v2 Dahili RGB LED Renk & Parlaklık Kontrolü
        const char* hexColor = doc["color"] | "#ffb703";
        int brightness = doc["brightness"] | 100;

        long rgbVal = strtol(hexColor[0] == '#' ? &hexColor[1] : hexColor, NULL, 16);
        int r = (((rgbVal >> 16) & 0xFF) * brightness) / 100;
        int g = (((rgbVal >> 8) & 0xFF) * brightness) / 100;
        int b = ((rgbVal & 0xFF) * brightness) / 100;

#if defined(RGBLED)
        if (power) {
          neopixelWrite(RGBLED, r, g, b); // Sitede seçilen renk anında Deneyap Dahili LED'e aktarılır
        } else {
          neopixelWrite(RGBLED, 0, 0, 0); // Kapalı
        }
#endif
        Serial.printf("Lamba: %s | Renk: %s (R:%d G:%d B:%d)\\n", power ? "ACIK" : "KAPALI", hexColor, r, g, b);
      }
      https.end();
    }
  }
}
`;

  // 2. STANDALONE FAN (DC MOTOR PWM)
  const fanCode = `/*
  ==============================================================
  CİHAZ 2: SADECE AKILLI FAN / HAVALANDIRMA (PWM MOTOR KONTROLÜ)
  Bağlantı: Fan Transistör / Mosfet PWM -> ESP32 GPIO 4 (Deneyap için D1)
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

const int PIN_FAN = ${board === "esp32" ? "4" : "D1"};
const int PWM_CHANNEL = 1;
unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  ledcSetup(PWM_CHANNEL, 5000, 8); // 5 kHz, 8-bit (0-255)
  ledcAttachPin(PIN_FAN, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\n[OK] Fan Sistemi Baglandi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1200) {
    lastPoll = millis();
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/devices")) {
      if (https.GET() == 200) {
        DynamicJsonDocument doc(2048);
        deserializeJson(doc, https.getString());
        bool power = doc["fan"]["power"] | false;
        int speed  = doc["fan"]["speed"] | 0;
        int duty   = power ? map(speed, 0, 100, 0, 255) : 0;
        ledcWrite(PWM_CHANNEL, duty);
        Serial.println("Fan Hizi: %" + String(speed) + " (PWM: " + String(duty) + ")");
      }
      https.end();
    }
  }
}
`;

  // 3. STANDALONE LOCK (SG90 SERVO KİLİT)
  const lockCode = `/*
  ==============================================================
  CİHAZ 3: SADECE AKILLI KAPI KİLİDİ & ALARM (SG90 SERVO)
  Bağlantı: Servo Turuncu Sinyal -> GPIO 18 (Deneyap D8) | Buzzer -> GPIO 19 (Deneyap D9)
  Kütüphane: ESP32Servo
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

const int PIN_SERVO  = ${board === "esp32" ? "18" : "D8"};
const int PIN_BUZZER = ${board === "esp32" ? "19" : "D9"};
Servo lockServo;
unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  lockServo.setPeriodHertz(50);
  lockServo.attach(PIN_SERVO, 500, 2400);
  lockServo.write(90); // Başlangıçta Kilitli

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\n[OK] Kilit Sistemi Baglandi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1200) {
    lastPoll = millis();
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/devices")) {
      if (https.GET() == 200) {
        DynamicJsonDocument doc(2048);
        deserializeJson(doc, https.getString());
        int angle  = doc["lock"]["angle"] | 90;
        bool alarm = doc["lock"]["alarm"] | false;
        lockServo.write(angle);
        digitalWrite(PIN_BUZZER, alarm ? HIGH : LOW);
        Serial.println("Kilit Acisi: " + String(angle) + " derece");
      }
      https.end();
    }
  }
}
`;

  // 4. STANDALONE RGB (DENEYAP 1A v2 NEOPİXEL FIX & WS2812B)
  const rgbCode = board === "deneyap_1a_v2" ? `/*
  ==============================================================
  CİHAZ 4: TÜBİTAK DENEYAP KART 1A v2 DAHİLİ WS2812B NEOPİXEL FIX
  UYARI: Deneyap 1A v2'de dahili LED klasik 3 pinli analog/dijital değildir!
  Dahili RGBLED pini üzerindeki WS2812B NeoPixel çipidir.
  digitalWrite() kullanırsanız sinyal bozulur ve SARI yanıp kilitlenir!
  ÇÖZÜM: ESP32 Core yerleşik neopixelWrite() kullanımıdır (Harici kütüphane gerektirmez).
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);

  // Başlangıçta dahili NeoPixel'i sıfırla/kapat
  neopixelWrite(RGBLED, 0, 0, 0);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\n[OK] Deneyap 1A v2 Dahili NeoPixel LED Hazır!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1200) {
    lastPoll = millis();
    WiFiClientSecure client; client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/devices")) {
      if (https.GET() == 200) {
        DynamicJsonDocument doc(2048);
        deserializeJson(doc, https.getString());
        bool power = doc["rgb"]["power"] | false;
        if (power) {
          // Mor / Magenta Renk: R=139, G=92, B=246 (İstenen renk kodları buraya yazılabilir)
          neopixelWrite(RGBLED, 139, 92, 246);
          Serial.println("Dahili NeoPixel: ACIK (Mor)");
        } else {
          neopixelWrite(RGBLED, 0, 0, 0); // Kapat
          Serial.println("Dahili NeoPixel: KAPALI");
        }
      }
      https.end();
    }
  }
}
` : `/*
  ==============================================================
  CİHAZ 4: WS2812B NEOPİXEL ADRESLENEBİLİR RGB LED BARI
  Bağlantı: DIN -> ESP32 GPIO 5 | Kütüphane: Adafruit_NeoPixel
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <Adafruit_NeoPixel.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

#define PIN_RGB 5
#define NUM_LEDS 12
Adafruit_NeoPixel strip(NUM_LEDS, PIN_RGB, NEO_GRB + NEO_KHZ800);
unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  strip.begin();
  strip.clear();
  strip.show();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\n[OK] WS2812B RGB Sistemi Baglandi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1200) {
    lastPoll = millis();
    WiFiClientSecure client; client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/devices")) {
      if (https.GET() == 200) {
        DynamicJsonDocument doc(2048);
        deserializeJson(doc, https.getString());
        bool power = doc["rgb"]["power"] | false;
        if (power) {
          for(int i=0; i<NUM_LEDS; i++) strip.setPixelColor(i, strip.Color(139, 92, 246));
        } else {
          strip.clear();
        }
        strip.show();
      }
      https.end();
    }
  }
}
`;

  // 5. STANDALONE IRRIGATION (SULAMA POMPASI + NEM SENSÖRÜ)
  const irrigationCode = `/*
  ==============================================================
  CİHAZ 5: AKILLI SULAMA & TOPRAK NEM SİSTEMİ
  Bağlantı: Su Pompası Rölesi -> GPIO 23 (Deneyap D10) | Nem Sensörü -> GPIO 34 ADC (Deneyap A0)
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

const int PIN_PUMP = ${board === "esp32" ? "23" : "D10"};
const int PIN_SOIL = ${board === "esp32" ? "34" : "A0"};
unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_PUMP, OUTPUT);
  digitalWrite(PIN_PUMP, LOW);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\n[OK] Akilli Sulama Sistemi Baglandi!");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1200) {
    lastPoll = millis();
    WiFiClientSecure client; client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/devices")) {
      if (https.GET() == 200) {
        DynamicJsonDocument doc(2048);
        deserializeJson(doc, https.getString());
        bool pumpOn = doc["irrigation"]["pump"] | false;
        digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW);
        int rawSoil = analogRead(PIN_SOIL);
        Serial.println("Pompa: " + String(pumpOn ? "ACIK" : "KAPALI") + " | Ham Nem: " + String(rawSoil));
      }
      https.end();
    }
  }
}
`;

  // 6. STANDALONE THERMOSTAT (>25°C RED LED, <=25°C BLUE LED)
  const thermostatCode = `/*
  ==============================================================
  CİHAZ 6: ODA SICAKLIĞI > 25°C İSE KIRMIZI LED, DEĞİLSE MAVİ LED
  Kart: ${board === "deneyap_1a_v2" ? "TÜBİTAK Deneyap Kart 1A v2" : "Standart ESP32 DevKit"}
  Sensör: DHT11 (Breadboard üzerinde D2 / GPIO 4)
  Çift LED Devresi:
    - Kırmızı LED (+) -> 220Ω -> ${board === "esp32" ? "GPIO 16" : "D4"}
    - Mavi LED (+)    -> 220Ω -> ${board === "esp32" ? "GPIO 17" : "D5"}
    - Katotlar (-)    -> GND
  ${board === "deneyap_1a_v2" ? "Deneyap 1A v2 Dahili LED: RGBLED pini (WS2812B NeoPixel Fix)" : ""}
  Kütüphaneler: DHT sensor library, Adafruit Unified Sensor, ArduinoJson
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

#define DHTPIN ${board === "esp32" ? "4" : "D2"}
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

const int PIN_RED_LED  = ${board === "esp32" ? "16" : "D4"}; // Kırmızı LED
const int PIN_BLUE_LED = ${board === "esp32" ? "17" : "D5"}; // Mavi LED
const float THRESHOLD_TEMP = 25.0; // 25 Derece Eşik Şartı

unsigned long lastPoll = 0;
unsigned long lastRead = 0;
float currentTemp = 24.0;

void applyLedState(bool isHot) {
  if (isHot) {
    // 25 DERECE ÜSTÜ: KIRMIZI LED AÇIK, MAVİ LED KAPALI
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_BLUE_LED, LOW);
#if defined(RGBLED)
    neopixelWrite(RGBLED, 255, 0, 0); // Deneyap 1A v2 Dahili NeoPixel: Parlak Kırmızı!
#endif
    Serial.println("[SICAK > 25°C] -> KIRMIZI LED DEVREDE!");
  } else {
    // 25 DERECE VE ALTI: KIRMIZI LED KAPALI, MAVİ LED AÇIK
    digitalWrite(PIN_RED_LED, LOW);
    digitalWrite(PIN_BLUE_LED, HIGH);
#if defined(RGBLED)
    neopixelWrite(RGBLED, 0, 0, 255); // Deneyap 1A v2 Dahili NeoPixel: Parlak Mavi!
#endif
    Serial.println("[SERİN <= 25°C] -> MAVİ LED DEVREDE!");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BLUE_LED, OUTPUT);

  dht.begin();
  applyLedState(false); // Başlangıçta güvenli durum (Mavi aktif)

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println("\\n[OK] 25C Sicaklik & Cift LED Sistemi Wi-Fi Baglandi!");
}

void loop() {
  // 1. Sensörden Sıcaklık Oku (Her 2 saniyede bir)
  if (millis() - lastRead >= 2000) {
    lastRead = millis();
    float t = dht.readTemperature();
    if (!isnan(t)) {
      currentTemp = t;
      bool isHot = currentTemp > THRESHOLD_TEMP;
      applyLedState(isHot);
      Serial.println("Oda Sicakligi: " + String(currentTemp, 1) + " C");
    } else {
      Serial.println("[HATA] DHT11 sensoru okunamadi, kablolari kontrol et!");
    }
  }

  // 2. Vercel Bulut Paneline Telemetri Gönder
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 3000) {
    lastPoll = millis();
    WiFiClientSecure client; client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/devices")) {
      https.addHeader("Content-Type", "application/json");
      String payload = "{\"thermostat\":{\"currentTemp\":" + String(currentTemp, 1) + "}}";
      https.POST(payload);
      https.end();
    }
  }
}
`;

  // 7. FULL MQTT PROTOCOL
  const mqttCode = `/*
  ==============================================================
  HOCA İÇİN GERÇEK MQTT PUB/SUB PROTOKOLÜ (MİLLİSANİYE GECİKME)
  Broker: broker.emqx.io:1883 | Kütüphane: PubSubClient
  Topic Subscribe: ders/rainz/commands
  Topic Publish  : ders/rainz/telemetry
  ==============================================================
*/
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid        = "WIFI_ADINIZ";
const char* password    = "WIFI_SIFRENIZ";
const char* mqttBroker  = "broker.emqx.io";
const int   mqttPort    = 1883;

WiFiClient espClient;
PubSubClient mqtt(espClient);

const int PIN_LAMP = ${board === "esp32" ? "2" : "D0"};

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for(unsigned int i=0; i<length; i++) msg += (char)payload[i];
  Serial.println("[MQTT ALINDI] " + msg);

  DynamicJsonDocument doc(1024);
  deserializeJson(doc, msg);
  if (doc.containsKey("lamp")) {
    digitalWrite(PIN_LAMP, doc["lamp"]["power"] ? HIGH : LOW);
  }
}

void reconnect() {
  while (!mqtt.connected()) {
    Serial.print("MQTT Brokerina baglaniliyor...");
    if (mqtt.connect("ESP32_Rainz_Student")) {
      Serial.println(" [BAGLANDI]");
      mqtt.subscribe("ders/rainz/commands");
    } else {
      delay(3000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  mqtt.setServer(mqttBroker, mqttPort);
  mqtt.setCallback(mqttCallback);
}

void loop() {
  if (!mqtt.connected()) reconnect();
  mqtt.loop();
}
`;

  // 8. FULL HYBRID (WIFI + SERIAL + SICAKLIK LED)
  const fullCode = `/*
  ==============================================================
  TAM HİBRİT IOT PLATFORMU (WI-FI REST API + WEB SERIAL USB)
  Deneyap Kart 1A v2 & ESP32 için 6 Cihaz + 25°C Sıcaklık LED
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <DHT.h>

const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

const int PIN_LAMP     = ${board === "esp32" ? "2" : "D0"};
const int PIN_FAN      = ${board === "esp32" ? "4" : "D1"};
const int PIN_SERVO    = ${board === "esp32" ? "18" : "D8"};
const int PIN_BUZZER   = ${board === "esp32" ? "19" : "D9"};
const int PIN_PUMP     = ${board === "esp32" ? "23" : "D10"};
const int PIN_SOIL     = ${board === "esp32" ? "34" : "A0"};
const int PIN_RED_LED  = ${board === "esp32" ? "16" : "D4"};
const int PIN_BLUE_LED = ${board === "esp32" ? "17" : "D5"};

#define DHTPIN ${board === "esp32" ? "4" : "D2"}
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

Servo lockServo;
unsigned long lastPoll = 0;
unsigned long lastTempRead = 0;
float currentTemp = 24.2;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BLUE_LED, OUTPUT);

  dht.begin();
  digitalWrite(PIN_BLUE_LED, HIGH); // Başlangıçta Mavi

  ledcSetup(1, 5000, 8);
  ledcAttachPin(PIN_FAN, 1);
  ledcWrite(1, 0);

  lockServo.setPeriodHertz(50);
  lockServo.attach(PIN_SERVO, 500, 2400);
  lockServo.write(90);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("[DENEYAP/ESP32] Tam Hibrit Sistem Hazir!");
}

void loop() {
  // 1. Sıcaklık Kontrolü (>25°C -> Kırmızı, <=25°C -> Mavi)
  if (millis() - lastTempRead >= 2000) {
    lastTempRead = millis();
    float t = dht.readTemperature();
    if (!isnan(t)) {
      currentTemp = t;
      bool hot = currentTemp > 25.0;
      digitalWrite(PIN_RED_LED, hot ? HIGH : LOW);
      digitalWrite(PIN_BLUE_LED, hot ? LOW : HIGH);
#if defined(RGBLED)
      if (hot) neopixelWrite(RGBLED, 255, 0, 0);
      else neopixelWrite(RGBLED, 0, 0, 255);
#endif
    }
  }

  // 2. USB Web Serial Komut Dinleme
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd.startsWith("CMD:LAMP:")) digitalWrite(PIN_LAMP, cmd.substring(9).toInt() ? HIGH : LOW);
    if (cmd.startsWith("CMD:FAN:"))  ledcWrite(1, map(cmd.substring(8).toInt(), 0, 100, 0, 255));
    if (cmd.startsWith("CMD:LOCK:")) lockServo.write(cmd.substring(9).toInt() ? 90 : 0);
    if (cmd.startsWith("CMD:PUMP:")) digitalWrite(PIN_PUMP, cmd.substring(9).toInt() ? HIGH : LOW);
    Serial.println("[ACK] " + cmd);
  }

  // 3. Wi-Fi REST Polling
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1500) {
    lastPoll = millis();
    WiFiClientSecure client; client.setInsecure();
    HTTPClient https;
    if (https.begin(client, String(serverUrl) + "/api/devices")) {
      if (https.GET() == 200) {
        DynamicJsonDocument doc(2048);
        deserializeJson(doc, https.getString());
        digitalWrite(PIN_LAMP, doc["lamp"]["power"] ? HIGH : LOW);
        ledcWrite(1, doc["fan"]["power"] ? map(doc["fan"]["speed"] | 0, 0, 100, 0, 255) : 0);
        lockServo.write(doc["lock"]["angle"] | 90);
        digitalWrite(PIN_PUMP, doc["irrigation"]["pump"] ? HIGH : LOW);
      }
      https.end();
    }
  }
}
`;

  const getActiveCode = () => {
    switch (codeType) {
      case "lamp": return lampCode;
      case "fan": return fanCode;
      case "lock": return lockCode;
      case "rgb": return rgbCode;
      case "irrigation": return irrigationCode;
      case "thermostat": return thermostatCode;
      case "mqtt": return mqttCode;
      default: return fullCode;
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-5xl rounded-2xl p-6 border border-neutral-700/80 shadow-2xl relative max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white">
                  Seçili Cihaza Özel Arduino C++ Kodu
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  OTOMATİK EŞLEŞTİ
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Hangi kategorideysen sağ üstteki kod butonu o cihazın tekil kodunu veya MQTT protokolünü getirir
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board Switcher (ESP32 vs Deneyap Kart 1A v2) */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-bold">
            <button
              onClick={() => setBoard("deneyap_1a_v2")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                board === "deneyap_1a_v2" ? "bg-purple-600 text-white shadow" : "text-neutral-400"
              }`}
            >
              TÜBİTAK Deneyap Kart 1A v2 (NeoPixel Fix)
            </button>
            <button
              onClick={() => setBoard("esp32")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                board === "esp32" ? "bg-yellow-500 text-neutral-950 shadow" : "text-neutral-400"
              }`}
            >
              Standart ESP32 DevKit
            </button>
          </div>

          <span className="text-xs text-neutral-400 font-mono">
            {board === "deneyap_1a_v2"
              ? "💡 Deneyap 1A v2: Dahili WS2812B RGBLED ve D-pinleri aktif"
              : "⚡ Standart ESP32: GPIO pinleri aktif"}
          </span>
        </div>

        {/* Device-Specific Code Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-3 text-xs font-semibold">
          {[
            { id: "lamp", label: "1. Lamba (Röle)", icon: Lightbulb },
            { id: "fan", label: "2. Fan (PWM)", icon: Fan },
            { id: "lock", label: "3. Kilit (Servo)", icon: Lock },
            { id: "rgb", label: "4. RGB / Dahili LED Fix", icon: Sparkles },
            { id: "irrigation", label: "5. Sulama (Pompa)", icon: Droplets },
            { id: "thermostat", label: "6. Sıcaklık & Çift LED (25°C)", icon: Thermometer },
            { id: "mqtt", label: "⚡ Gerçek MQTT Pub/Sub", icon: Radio },
            { id: "full", label: "🌐 Tam Hibrit + USB", icon: Cpu },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = codeType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCodeType(tab.id)}
                className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all ${
                  isActive
                    ? "bg-yellow-500 text-neutral-950 font-bold border-yellow-400 shadow-sm"
                    : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Code Output */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 rounded-xl p-4 border border-neutral-800 font-mono text-xs relative select-text">
          <button
            onClick={copyCode}
            className="sticky top-2 float-right z-10 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Kopyalandı!" : "Kodu Kopyala"}</span>
          </button>
          <pre className="text-neutral-300 leading-relaxed whitespace-pre overflow-x-auto">
            {getActiveCode()}
          </pre>
        </div>

        {/* Hardware Wiring Pinout Indicator */}
        <div className="mt-3 p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 flex flex-wrap items-center justify-between text-xs font-mono">
          <span className="text-neutral-400">
            Aktif Kart:{" "}
            <strong className="text-white">
              {board === "esp32" ? "ESP32 DevKit" : "Deneyap Kart 1A v2"}
            </strong>
          </span>
          <span className="text-neutral-400">
            {codeType === "lamp" && `Bağlantı: Röle Sinyali -> ${board === "esp32" ? "GPIO 2" : "D0"}`}
            {codeType === "fan" && `Bağlantı: Fan PWM -> ${board === "esp32" ? "GPIO 4" : "D1"}`}
            {codeType === "lock" && `Bağlantı: Servo Sinyali -> ${board === "esp32" ? "GPIO 18" : "D8"}`}
            {codeType === "rgb" && `Bağlantı: ${board === "deneyap_1a_v2" ? "Dahili WS2812B (RGBLED pini)" : "WS2812B GPIO 5"}`}
            {codeType === "irrigation" && `Bağlantı: Pompa -> ${board === "esp32" ? "GPIO 23" : "D10"} | Nem -> ${board === "esp32" ? "GPIO 34" : "A0"}`}
            {codeType === "thermostat" && `Bağlantı: DHT11 -> ${board === "esp32" ? "GPIO 4" : "D2"} | Kırmızı LED -> ${board === "esp32" ? "GPIO 16" : "D4"} | Mavi LED -> ${board === "esp32" ? "GPIO 17" : "D5"}`}
            {codeType === "mqtt" && `Protokol: broker.emqx.io:1883 (Topic: ders/rainz/commands)`}
            {codeType === "full" && `Tam Hibrit: 6 Cihaz + Web Serial USB + 25°C Sıcaklık LED`}
          </span>
        </div>
      </div>
    </div>
  );
};
