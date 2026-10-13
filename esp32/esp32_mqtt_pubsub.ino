/*
  ============================================================================
  PROJE: ESP32 TAM MQTT PUB/SUB PROTOKOLÜ (MİLLİSANİYE GECİKMELİ REAL-TIME IOT)
  DERS: Gömülü Sistemler ve IoT Otomasyonu
  GELİŞTİRİCİ: Rainz-cmd / Ders
  PROTOKOL: MQTT v3.1.1 (Pub/Sub)
  BROKER: broker.emqx.io:1883 (veya broker.hivemq.com:1883)
  ============================================================================
*/

#include <WiFi.h>
#include <PubSubClient.h> // Arduino Kütüphane Yöneticisinden "PubSubClient" (Nick O'Leary) kurun
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// 1. WI-FI VE MQTT BROKER BİLGİLERİ
const char* WIFI_SSID       = "WIFI_ADINIZ";
const char* WIFI_PASSWORD   = "WIFI_SIFRENIZ";

const char* MQTT_BROKER     = "broker.emqx.io"; // Ücretsiz genel MQTT Brokerı
const int   MQTT_PORT       = 1883;

// MQTT TOPIC'LERİ (KONULARI)
const char* TOPIC_COMMANDS  = "ders/rainz/commands";   // ESP32 dinler (Subscribe)
const char* TOPIC_TELEMETRY = "ders/rainz/telemetry";  // ESP32 veri yollar (Publish)

// 2. PIN TANIMLARI
const int PIN_LAMP   = 2;   // Lamba Rölesi (GPIO 2)
const int PIN_FAN    = 4;   // Fan PWM (GPIO 4)
const int PIN_SERVO  = 18;  // Kilit Servosu (GPIO 18)
const int PIN_BUZZER = 19;  // Siren (GPIO 19)
const int PIN_PUMP   = 23;  // Su Pompası (GPIO 23)
const int PIN_SOIL   = 34;  // Toprak Nemi Analog (GPIO 34)

WiFiClient espClient;
PubSubClient mqttClient(espClient);
Servo lockServo;

unsigned long lastTelemetry = 0;

// -------------------------------------------------------------
// MQTT GELEN MESAJ GERİ ÇAĞIRMA (CALLBACK) - ANINDA ÇALIŞIR!
// -------------------------------------------------------------
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.println("\n[MQTT ALINDI] Topic: " + String(topic));
  Serial.println("[MQTT VERI] " + message);

  // JSON Çözümleme
  DynamicJsonDocument doc(1024);
  DeserializationError err = deserializeJson(doc, message);
  if (err) return;

  // 1. Lamba
  if (doc.containsKey("lamp")) {
    bool power = doc["lamp"]["power"] | false;
    digitalWrite(PIN_LAMP, power ? HIGH : LOW);
    Serial.println("-> Lamba: " + String(power ? "ACIK" : "KAPALI"));
  }

  // 2. Fan (PWM)
  if (doc.containsKey("fan")) {
    bool power = doc["fan"]["power"] | false;
    int speed  = doc["fan"]["speed"] | 0;
    int duty = power ? map(speed, 0, 100, 0, 255) : 0;
    ledcWrite(1, duty);
    Serial.println("-> Fan Hizi: %" + String(speed));
  }

  // 3. Kapı Kilidi (Servo)
  if (doc.containsKey("lock")) {
    int angle = doc["lock"]["angle"] | 90;
    bool alarm = doc["lock"]["alarm"] | false;
    lockServo.write(angle);
    digitalWrite(PIN_BUZZER, alarm ? HIGH : LOW);
    Serial.println("-> Kilit Acisi: " + String(angle) + " deg");
  }

  // 4. Su Pompası
  if (doc.containsKey("irrigation")) {
    bool pump = doc["irrigation"]["pump"] | false;
    digitalWrite(PIN_PUMP, pump ? HIGH : LOW);
    Serial.println("-> Su Pompasi: " + String(pump ? "CALISIYOR" : "KAPALI"));
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n>>> ESP32 MQTT REAL-TIME IOT BASLATILDI <<<");

  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  ledcSetup(1, 5000, 8);
  ledcAttachPin(PIN_FAN, 1);
  ledcWrite(1, 0);

  lockServo.setPeriodHertz(50);
  lockServo.attach(PIN_SERVO, 500, 2400);
  lockServo.write(90);

  // Wi-Fi Bağlan
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\n[OK] Wi-Fi Baglandi! IP: " + WiFi.localIP().toString());

  // MQTT Yapılandırması
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  reconnectMqtt();
}

void reconnectMqtt() {
  while (!mqttClient.connected()) {
    Serial.print("[MQTT] Brokera baglaniliyor (" + String(MQTT_BROKER) + ")...");
    String clientId = "ESP32_Rainz_" + String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" [BAGLANDI!]");
      // Komut kanalına abone ol (Subscribe)
      mqttClient.subscribe(TOPIC_COMMANDS);
      Serial.println("[MQTT] Dinleniyor (Subscribed): " + String(TOPIC_COMMANDS));
    } else {
      Serial.print(" [HATA] Kod: ");
      Serial.print(mqttClient.state());
      Serial.println(" -> 3 saniye sonra tekrar denenecek");
      delay(3000);
    }
  }
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMqtt();
  }
  mqttClient.loop(); // MQTT paketlerini anında işle

  // 5 saniyede bir telemetri yayınla (Publish)
  if (millis() - lastTelemetry >= 5000) {
    lastTelemetry = millis();
    sendTelemetry();
  }
}

void sendTelemetry() {
  int rawSoil = analogRead(PIN_SOIL);
  int soilPercent = constrain(map(rawSoil, 4095, 1500, 0, 100), 0, 100);

  StaticJsonDocument<256> doc;
  doc["ip"]            = WiFi.localIP().toString();
  doc["rssi"]          = WiFi.RSSI();
  doc["soilMoisture"]  = soilPercent;
  doc["uptimeSeconds"] = millis() / 1000;
  doc["protocol"]      = "MQTT v3.1.1 Pub/Sub";

  char buffer[256];
  serializeJson(doc, buffer);

  mqttClient.publish(TOPIC_TELEMETRY, buffer);
  Serial.println("[MQTT YAYINLANDI] " + String(buffer));
}
