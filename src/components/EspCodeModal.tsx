"use client";

import React, { useState } from "react";
import { X, Copy, Check, Code, Cpu, BookOpen } from "lucide-react";

interface EspCodeModalProps {
  onClose: () => void;
  vercelUrl: string;
}

export const EspCodeModal: React.FC<EspCodeModalProps> = ({
  onClose,
  vercelUrl,
}) => {
  const [activeTab, setActiveTab] = useState<"code" | "wiring" | "guide">("code");
  const [copied, setCopied] = useState(false);

  const cleanUrl = vercelUrl || "https://sizin-projeniz.vercel.app";

  const arduinoCode = `/*
  ==============================================================
  ESP32 / DENEYAP KART - AKILLI LAMBA KONTROL KODU (HTTP POLLING)
  ==============================================================
  Ders Projesi: Vercel Web Dashboard -> ESP32 Lamba & Röle Kontrolü
  Geliştirici: Rainz-cmd / Ders
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h> // ArduinoJson kütüphanesini Kütüphane Yöneticisinden kurun (v6 veya v7)

// 1. WI-FI BİLGİLERİNİZ
const char* ssid     = "WIFI_ADINIZ";
const char* password = "WIFI_SIFRENIZ";

// 2. VERCEL WEB SİTENİZİN ADRESİ
// (Sonunda / işareti olmadan girin)
const char* serverUrl = "${cleanUrl}";

// 3. PIN TANIMLARI
// Normal ESP32 için dahili LED genelde GPIO 2'dir. Röle için GPIO 2, 4 veya 5 kullanabilirsiniz.
// Deneyap Kart için: LEDR, D0 veya D1 kullanabilirsiniz.
const int RELAY_PIN = 2; // Röle veya LED Sinyal Pini

// Zamanlayıcı değişkenleri
unsigned long lastPollTime = 0;
const unsigned long pollInterval = 1500; // 1.5 saniyede bir web sitesinden durumu kontrol et

unsigned long lastHeartbeatTime = 0;
const unsigned long heartbeatInterval = 10000; // 10 saniyede bir kalp atışı (online bildirimi) gönder

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\\n>>> ESP32 Akilli Lamba Baslatiliyor...");

  // Röle / LED pinini çıkış olarak ayarla
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  // Wi-Fi Bağlantısı
  Serial.print("Wi-Fi baglantisi kuruluyor: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\n[OK] Wi-Fi Baglandi!");
  Serial.print("IP Adresi: ");
  Serial.println(WiFi.localIP());

  // İlk kalp atışını gönder
  sendHeartbeat();
}

void loop() {
  // Wi-Fi bağlantısı koptuysa yeniden bağlan
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[UYARI] Wi-Fi koptu, yeniden baglaniliyor...");
    WiFi.reconnect();
    delay(3000);
    return;
  }

  // 1. Web sitesinden lamba durumunu sorgula (GET /api/lamp)
  if (millis() - lastPollTime >= pollInterval) {
    lastPollTime = millis();
    checkLampState();
  }

  // 2. Web sitesine online olduğunu bildir (POST /api/heartbeat)
  if (millis() - lastHeartbeatTime >= heartbeatInterval) {
    lastHeartbeatTime = millis();
    sendHeartbeat();
  }
}

// Web sitesinden durumu çeken fonksiyon
void checkLampState() {
  WiFiClientSecure client;
  client.setInsecure(); // SSL sertifika doğrulamasını atla (ESP32 için hızlı & güvenli HTTPS)

  HTTPClient https;
  String url = String(serverUrl) + "/api/lamp";

  if (https.begin(client, url)) {
    int httpCode = https.GET();

    if (httpCode == HTTP_CODE_OK) {
      String payload = https.getString();
      
      // JSON Verisini Çözümle
      DynamicJsonDocument doc(1024);
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        bool power = doc["power"];
        int brightness = doc["brightness"] | 100;

        // Röleyi / Lambayı Kontrol Et
        if (power) {
          digitalWrite(RELAY_PIN, HIGH);
          // Not: PWM ile parlaklık kısmak istiyorsanız analogWrite(RELAY_PIN, map(brightness, 0, 100, 0, 255)); kullanabilirsiniz.
        } else {
          digitalWrite(RELAY_PIN, LOW);
        }
      }
    }
    https.end();
  }
}

// Web sitesine online durumu gönderen fonksiyon
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
    doc["deviceType"] = "ESP32 DevKit / Deneyap";
    doc["uptimeSeconds"] = millis() / 1000;

    String jsonString;
    serializeJson(doc, jsonString);

    int httpCode = https.POST(jsonString);
    https.end();
  }
}
`;

  const copyCode = () => {
    navigator.clipboard.writeText(arduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-neutral-700/80 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                ESP32 & Deneyap Kart Entegrasyonu
              </h2>
              <p className="text-xs text-neutral-400">
                Mikrodenetleyiciye yükleyeceğiniz tam kaynak kodu ve şema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 my-4">
          <button
            onClick={() => setActiveTab("code")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "code"
                ? "bg-yellow-500 text-neutral-950 shadow-md font-bold"
                : "bg-neutral-800/80 text-neutral-400 hover:text-white"
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Arduino C++ Kodu (.ino)</span>
          </button>
          <button
            onClick={() => setActiveTab("wiring")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "wiring"
                ? "bg-yellow-500 text-neutral-950 shadow-md font-bold"
                : "bg-neutral-800/80 text-neutral-400 hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Bağlantı Şeması</span>
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === "guide"
                ? "bg-yellow-500 text-neutral-950 shadow-md font-bold"
                : "bg-neutral-800/80 text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kurulum Rehberi</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 rounded-xl p-4 border border-neutral-800 font-mono text-xs">
          {activeTab === "code" && (
            <div className="relative">
              <button
                onClick={copyCode}
                className="sticky top-2 float-right z-10 px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Kopyalandı!" : "Kodu Kopyala"}</span>
              </button>
              <pre className="text-neutral-300 select-text leading-relaxed whitespace-pre overflow-x-auto">
                {arduinoCode}
              </pre>
            </div>
          )}

          {activeTab === "wiring" && (
            <div className="space-y-4 font-sans text-neutral-300">
              <h4 className="font-bold text-yellow-400 text-sm">
                🔌 Röle Modülü & ESP32 Bağlantı Tablosu:
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-neutral-800">
                  <thead className="bg-neutral-900 text-neutral-400">
                    <tr>
                      <th className="p-2.5 border-b border-neutral-800">Röle Pini</th>
                      <th className="p-2.5 border-b border-neutral-800">ESP32 Pini</th>
                      <th className="p-2.5 border-b border-neutral-800">Deneyap Kart Pini</th>
                      <th className="p-2.5 border-b border-neutral-800">Açıklama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    <tr>
                      <td className="p-2.5 text-yellow-400">VCC</td>
                      <td className="p-2.5">VIN / 5V (veya 3V3)</td>
                      <td className="p-2.5">5V / 3V3</td>
                      <td className="p-2.5 font-sans text-neutral-400">Besleme</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-neutral-400">GND</td>
                      <td className="p-2.5">GND</td>
                      <td className="p-2.5">GND</td>
                      <td className="p-2.5 font-sans text-neutral-400">Topraklama</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-emerald-400">IN / SIG</td>
                      <td className="p-2.5">GPIO 2 (veya D2/D4)</td>
                      <td className="p-2.5">D0 veya D1</td>
                      <td className="p-2.5 font-sans text-neutral-400">Tetik Sinyali</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-neutral-900/80 rounded-xl border border-neutral-800">
                <h5 className="font-semibold text-white mb-1">💡 220V Lamba / 12V LED Bağlantısı:</h5>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Rölenin <strong>COM</strong> ucuna güç kaynağının (veya priz hattının) Faz kablosu, <strong>NO (Normally Open)</strong> ucuna ise lambanın bir ucu bağlanır. Lambanın diğer ucu doğrudan Nötr hattına gider. Böylece web sitesinden butona basıldığında röle çeker ve devre tamamlanır.
                </p>
              </div>
            </div>
          )}

          {activeTab === "guide" && (
            <div className="space-y-3 font-sans text-neutral-300 text-xs leading-relaxed">
              <h4 className="font-bold text-yellow-400 text-sm">
                🚀 Arduino IDE Kurulum Adımları:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-neutral-300">
                <li>
                  <strong>Arduino IDE</strong> programını açın.
                </li>
                <li>
                  <strong>Araçlar &gt; Kütüphane Yöneticisi</strong> bölümünü açın ve <code>ArduinoJson</code> (Benoit Blanchon) kütüphanesini aratıp yükleyin.
                </li>
                <li>
                  Kart olarak <strong>ESP32 Dev Module</strong> veya Deneyap için <strong>Deneyap Kart</strong> seçin.
                </li>
                <li>
                  Yukarıdaki koddaki <code>ssid</code> ve <code>password</code> alanlarına kendi telefonunuzun hotspot veya ev Wi-Fi bilgilerini yazın.
                </li>
                <li>
                  <code>serverUrl</code> kısmına Vercel web sitenizin URL adresini yazın.
                </li>
                <li>
                  <strong>Yükle</strong> butonuna basıp karta yükleyin. Serial Monitörü 115200 baud hızında açarak IP adresini ve bağlantı loglarını izleyin!
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
