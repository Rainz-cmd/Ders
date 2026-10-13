/*
  ==============================================================
  İNTERNETSİZ OKUL / EDUROAM ÇÖZÜMÜ: ESP32 HOTSPOT ACCESS POINT
  (Modeme gerek yoktur! ESP32 kendi Wi-Fi ağını açar ve web sitesini
  kendi hafızasından doğrudan telefonunuza sunar!)
  ==============================================================
*/
#include <WiFi.h>
#include <WebServer.h>

const char* apSSID = "ESP32-Akilli-Lamba";
const char* apPASS = "12345678";

WebServer server(80);
const int PIN_LAMP = 2;
bool lampState = false;

const char HTML_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ESP32 Direct Hotspot</title>
<style>
body{background:#0a0e17;color:#fff;font-family:-apple-system,sans-serif;text-align:center;padding:40px 20px;}
.card{background:#1e293b;border-radius:24px;padding:30px;max-width:380px;margin:auto;box-shadow:0 10px 30px rgba(0,0,0,0.5);}
.btn{width:100%;padding:18px;font-size:18px;border-radius:16px;border:none;background:#facc15;color:#000;font-weight:900;cursor:pointer;margin-top:20px;box-shadow:0 0 25px rgba(250,204,21,0.5);}
.status{display:inline-block;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:bold;margin-bottom:15px;background:#22c55e20;color:#22c55e;border:1px solid #22c55e;}
</style></head><body>
<div class="card">
<span class="status">● ESP32 ÇEVRİMDIŞI MOD</span>
<h2>⚡ AKILLI LAMBA</h2>
<p style="color:#94a3b8;font-size:13px;">Okulda Wi-Fi olmadan telefonla doğrudan kontrol</p>
<button class="btn" onclick="fetch('/toggle').then(()=>location.reload())">LAMBAYI DEĞİŞTİR</button>
</div>
</body></html>
)rawliteral";

void handleRoot() { server.send(200, "text/html", HTML_PAGE); }
void handleToggle() {
  lampState = !lampState;
  digitalWrite(PIN_LAMP, lampState ? HIGH : LOW);
  server.send(200, "text/plain", "OK");
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LAMP, OUTPUT);
  digitalWrite(PIN_LAMP, LOW);

  WiFi.softAP(apSSID, apPASS);
  server.on("/", handleRoot);
  server.on("/toggle", handleToggle);
  server.begin();

  Serial.println("ESP32 Hotspot Baslatildi!");
  Serial.print("Wi-Fi Adi: "); Serial.println(apSSID);
  Serial.print("Sifre: "); Serial.println(apPASS);
  Serial.println("Baglanip su adresi acin: http://192.168.4.1");
}

void loop() {
  server.handleClient();
}
