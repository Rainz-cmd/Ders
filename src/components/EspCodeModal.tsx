"use client";

import React, { useState } from "react";
import { X, Copy, Check, Code, Cpu, BookOpen, AlertTriangle, Wifi, ShieldCheck } from "lucide-react";

interface EspCodeModalProps {
  onClose: () => void;
  vercelUrl: string;
}

export const EspCodeModal: React.FC<EspCodeModalProps> = ({ onClose, vercelUrl }) => {
  const [board, setBoard] = useState<"esp32" | "deneyap">("esp32");
  const [codeType, setCodeType] = useState<"full" | "deneyap_onboard" | "failsafe" | "hotspot">("full");
  const [copied, setCopied] = useState(false);

  const cleanUrl = vercelUrl || "https://ders-taupe.vercel.app";

  // 1. FULL 5-IN-1 (WIFI + USB)
  const fullCode = `/*
  ==============================================================
  ESP32 5'LI HIBRIT IOT PLATFORMU (WI-FI REST API + WEB SERIAL USB)
  Geliştirici: Rainz-cmd / Ders
  URL: ${cleanUrl}
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

const int PIN_LAMP   = 2;   // Lamba Rölesi
const int PIN_FAN    = 4;   // Fan PWM
const int PIN_SERVO  = 18;  // Kilit Servosu
const int PIN_BUZZER = 19;  // Siren
const int PIN_PUMP   = 23;  // Su Pompası
const int PIN_SOIL   = 34;  // Toprak Nemi ADC

Servo lockServo;
unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  
  ledcSetup(1, 5000, 8);
  ledcAttachPin(PIN_FAN, 1);
  ledcWrite(1, 0);

  lockServo.setPeriodHertz(50);
  lockServo.attach(PIN_SERVO, 500, 2400);
  lockServo.write(90);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("[ESP32] Sistem baslatildi. Web Serial ve Wi-Fi dinleniyor...");
}

void loop() {
  // 1. USB Web Serial Komut Dinleme (Baud: 115200)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    if (cmd.startsWith("CMD:LAMP:")) digitalWrite(PIN_LAMP, cmd.substring(9).toInt() ? HIGH : LOW);
    if (cmd.startsWith("CMD:FAN:"))  ledcWrite(1, map(cmd.substring(8).toInt(), 0, 100, 0, 255));
    if (cmd.startsWith("CMD:LOCK:")) lockServo.write(cmd.substring(9).toInt() ? 90 : 0);
    if (cmd.startsWith("CMD:PUMP:")) digitalWrite(PIN_PUMP, cmd.substring(9).toInt() ? HIGH : LOW);
    Serial.println("[ACK] Komut uygulandi: " + cmd);
  }

  // 2. Wi-Fi Varsa Vercel'den Durum Cek
  if (WiFi.status() == WL_CONNECTED && millis() - lastPoll >= 1200) {
    lastPoll = millis();
    WiFiClientSecure client;
    client.setInsecure();
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

  // 2. DENEYAP ONBOARD LED
  const deneyapCode = `/*
  ==============================================================
  TÜBİTAK DENEYAP KART 1A - DAHİLİ RGB LED VE MODÜL KONTROLÜ
  (Harici LED şerit gerektirmez, kartın üstündeki RGB LED'i kullanır!)
  ==============================================================
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

const char* ssid      = "WIFI_ADINIZ";
const char* password  = "WIFI_SIFRENIZ";
const char* serverUrl = "${cleanUrl}";

// Deneyap Kart Pinleri
const int PIN_LAMP    = D0; // Lamba Rölesi
const int PIN_FAN     = D1; // Fan
const int PIN_PUMP    = D10; // Su Pompası
// Deneyap Kart Dahili RGB LED Pinleri (Active Low: LOW = Yanar, HIGH = Söner)
const int ONBOARD_R   = LEDR;
const int ONBOARD_G   = LEDG;
const int ONBOARD_B   = LEDB;

unsigned long lastPoll = 0;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  pinMode(PIN_FAN, OUTPUT);
  pinMode(PIN_PUMP, OUTPUT);

  // Dahili RGB LED'leri ayarla
  pinMode(ONBOARD_R, OUTPUT);
  pinMode(ONBOARD_G, OUTPUT);
  pinMode(ONBOARD_B, OUTPUT);
  digitalWrite(ONBOARD_R, HIGH); // Kapalı
  digitalWrite(ONBOARD_G, HIGH);
  digitalWrite(ONBOARD_B, HIGH);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.println("[DENEYAP] Dahili RGB LED ve Moduller Aktif!");
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

        digitalWrite(PIN_LAMP, doc["lamp"]["power"] ? HIGH : LOW);
        digitalWrite(PIN_FAN,  doc["fan"]["power"]  ? HIGH : LOW);
        digitalWrite(PIN_PUMP, doc["irrigation"]["pump"] ? HIGH : LOW);

        // Deneyap Dahili RGB LED'i Renge Göre Yak
        bool rgbPower = doc["rgb"]["power"] | false;
        if (rgbPower) {
          digitalWrite(ONBOARD_R, LOW); // Kırmızı Aç
          digitalWrite(ONBOARD_G, HIGH);
          digitalWrite(ONBOARD_B, LOW); // Mor Ambiyans
        } else {
          digitalWrite(ONBOARD_R, HIGH);
          digitalWrite(ONBOARD_G, HIGH);
          digitalWrite(ONBOARD_B, HIGH);
        }
      }
      https.end();
    }
  }
}
`;

  // 3. FAILSAFE ZERO-DEPENDENCY (Ekstra Kütüphanesiz)
  const failsafeCode = `/*
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
const char* serverUrl = "${cleanUrl}";

const int PIN_LAMP = 2;
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
        // Hizli metin tarama (JSON kutuphanesi olmadan)
        bool isPowerOn = payload.indexOf("\\"power\\":true") != -1;
        digitalWrite(PIN_LAMP, isPowerOn ? HIGH : LOW);
      }
      https.end();
    }
  }
}
`;

  // 4. HOTSPOT CAPTIVE PORTAL (Okulda Wi-Fi Yoksa)
  const hotspotCode = `/*
  ==============================================================
  İNTERNETSİZ OKUL / EDUROAM ÇÖZÜMÜ: ESP32 HOTSPOT ACCESS POINT
  (Modeme gerek yoktur! ESP32 kendi Wi-Fi ağını açar ve web sitesini
  kendi hafızasından doğrudan telefonunuza sunar!)
  ==============================================================
*/
#include <WiFi.h>
#include <WebServer.h>

const char* apSSID = "ESP32-Akilli-Lamba";
const char* apPASS = "12345678"; // Sifre

WebServer server(80);
const int PIN_LAMP = 2;
bool lampState = false;

const char HTML_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ESP32 Direct Hotspot</title>
<style>body{background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:40px;}
.btn{padding:15px 30px;font-size:18px;border-radius:12px;border:none;background:#eab308;color:#000;font-weight:bold;cursor:pointer;}
</style></head><body>
<h1>⚡ ESP32 DOGRUDAN KONTROL</h1>
<p>Internet/Modem Olmadan Baglandiniz</p>
<button class="btn" onclick="fetch('/toggle').then(()=>location.reload())">LAMBAYI AC / KAPAT</button>
</body></html>
)rawliteral";

void handleRoot() { server.send(200, "text/html", HTML_PAGE); }
void handleToggle() {
  lampState = !lampState;
  digitalWrite(PIN_LAMP, lampState ? HIGH : LOW);
  server.send(200, "text/plain", "OK");
}

void setup() {
  pinMode(PIN_LAMP, OUTPUT);
  WiFi.softAP(apSSID, apPASS);
  server.on("/", handleRoot);
  server.on("/toggle", handleToggle);
  server.begin();
  Serial.println("ESP32 Hotspot Aktif! IP: 192.168.4.1");
}

void loop() { server.handleClient(); }
`;

  const getActiveCode = () => {
    if (codeType === "deneyap_onboard") return deneyapCode;
    if (codeType === "failsafe") return failsafeCode;
    if (codeType === "hotspot") return hotspotCode;
    return fullCode;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-4xl rounded-2xl p-6 border border-neutral-700/80 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Arduino C++ Kod Merkezi & Hata Önleme Modları
              </h2>
              <p className="text-xs text-neutral-400">
                Farklı donanım ve okul şartları için 4 alternatif tak-çalıştır firmware
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board & Firmware Selectors */}
        <div className="my-3 flex flex-wrap items-center justify-between gap-3">
          {/* Board Selector */}
          <div className="flex p-1 bg-neutral-900 rounded-xl border border-neutral-800 text-xs font-bold">
            <button
              onClick={() => {
                setBoard("esp32");
                if (codeType === "deneyap_onboard") setCodeType("full");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                board === "esp32" ? "bg-yellow-500 text-neutral-950 shadow" : "text-neutral-400"
              }`}
            >
              Standart ESP32 DevKit
            </button>
            <button
              onClick={() => {
                setBoard("deneyap");
                setCodeType("deneyap_onboard");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                board === "deneyap" ? "bg-purple-500 text-white shadow" : "text-neutral-400"
              }`}
            >
              Deneyap Kart 1A (Dahili LED)
            </button>
          </div>

          {/* Firmware Mode Selector */}
          <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setCodeType("full")}
              className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                codeType === "full" ? "bg-yellow-500/20 text-yellow-300 border-yellow-400" : "bg-neutral-900 border-neutral-800 text-neutral-400"
              }`}
            >
              1. Full 5 Cihaz + USB
            </button>
            <button
              onClick={() => setCodeType("deneyap_onboard")}
              className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                codeType === "deneyap_onboard" ? "bg-purple-500/20 text-purple-300 border-purple-400" : "bg-neutral-900 border-neutral-800 text-neutral-400"
              }`}
            >
              2. Deneyap Dahili LED
            </button>
            <button
              onClick={() => setCodeType("failsafe")}
              className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                codeType === "failsafe" ? "bg-emerald-500/20 text-emerald-300 border-emerald-400" : "bg-neutral-900 border-neutral-800 text-neutral-400"
              }`}
            >
              3. Sıfır-Kütüphane (Fail-Safe)
            </button>
            <button
              onClick={() => setCodeType("hotspot")}
              className={`px-2.5 py-1.5 rounded-lg border transition-all ${
                codeType === "hotspot" ? "bg-cyan-500/20 text-cyan-300 border-cyan-400" : "bg-neutral-900 border-neutral-800 text-neutral-400"
              }`}
            >
              4. İnternetsiz Hotspot Modu
            </button>
          </div>
        </div>

        {/* Code View with Copy Button */}
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

        {/* Pinout Schematic Table */}
        <div className="mt-3 p-3 bg-neutral-900/80 rounded-xl border border-neutral-800 text-xs">
          <div className="flex items-center justify-between font-bold text-neutral-300 mb-1">
            <span>Donanım Pin Eşleme Özeti:</span>
            <span className="text-yellow-400">{board === "esp32" ? "ESP32 DevKit" : "Deneyap Kart 1A"}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
            <span className="text-neutral-400">Lamba: <b className="text-white">{board === "esp32" ? "GPIO 2" : "D0"}</b></span>
            <span className="text-neutral-400">Fan: <b className="text-white">{board === "esp32" ? "GPIO 4" : "D1"}</b></span>
            <span className="text-neutral-400">Kilit: <b className="text-white">{board === "esp32" ? "GPIO 18" : "D8"}</b></span>
            <span className="text-neutral-400">RGB: <b className="text-white">{board === "esp32" ? "GPIO 5" : "D4 / Dahili"}</b></span>
            <span className="text-neutral-400">Sulama: <b className="text-white">{board === "esp32" ? "GPIO 23" : "D10"}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};
