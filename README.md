# ⚡ ESP32 & Deneyap Kart Akıllı Lamba & Röle Kontrol Sistemi

Bu proje; **ESP32**, **ESP8266** ve **Deneyap Kart** mikrodenetleyicilerini **Vercel Cloud** üzerinde barındırılan ultra modern, tepkisel (responsive) ve mobil uyumlu (PWA) bir kontrol paneline bağlayarak lambaları, LED şeritleri veya 220V röleleri uzaktan kontrol etmenizi sağlar.

---

## 🌟 Öne Çıkan Özellikler

1. **Vercel Serverless REST API:**
   - `/api/lamp`: GET/POST ile lamba gücü, PWM parlaklığı, renk ve animasyon durumunu anlık senkronize eder.
   - `/api/heartbeat`: ESP32'nin online/offline durumunu, Wi-Fi sinyal gücünü (RSSI) ve yerel IP'sini panele iletir.
2. **Gerçek Zamanlı Görselleştirme:**
   - Açma/kapama durumuna göre dinamik ışık süzülmesi ve oda aydınlatması animasyonu.
   - Gerçekçi mekanik röle tıklama sesleri (Web Audio API - harici ses dosyası gerektirmez).
3. **PWM Dimmer & Renk:**
   - %1 - %100 hassas ışık şiddeti ayarı.
   - Sıcak Sarı, Gün Işığı, Neon Mavi, Siber Mor ve özel renk seçici.
4. **Işık Modları & Zamanlayıcı:**
   - Sabit, Nefes (Breathe), Flaş (Strobe) ve RGB efektleri.
   - 1, 5, 15, 30, 45, 60 dakika otomatik kapanma zamanlayıcısı.
5. **Mobil PWA Desteği (Mobil Uygulama):**
   - Telefonda tarayıcıdan **"Ana Ekrana Ekle"** dendiğinde tam ekran bir mobil uygulama gibi çalışır. Adres çubuğu olmadan tam ekran mobil deneyim sunar.
6. **Hazır Arduino C++ Kodları:**
   - Hem standart ESP32 hem de Deneyap Kart için tak-çalıştır `.ino` kodları ve pin şeması proje içinde mevcuttur.

---

## 🚀 Projeyi Vercel'e Dağıtma (Deployment)

1. Bu projeyi GitHub hesabınıza (`Rainz-cmd/Ders`) pushlayın:
   ```bash
   git add .
   git commit -m "feat: complete ESP32 IoT lamp control dashboard and firmware"
   git push -u origin master
   ```
2. **[vercel.com](https://vercel.com)** paneline gidin.
3. **Add New...** ➔ **Project** seçin.
4. GitHub'dan `Rainz-cmd/Ders` deposunu seçip **Deploy** butonuna basın.
5. Yaklaşık 30 saniye içinde siteniz `https://ders-xxx.vercel.app` şeklinde yayına girecektir!

---

## 🔌 ESP32 / Deneyap Kart Kurulumu

1. `esp32/esp32_lamp_controller.ino` (veya Deneyap için `esp32/deneyap_lamp_controller.ino`) dosyasını Arduino IDE ile açın.
2. `ArduinoJson` kütüphanesini Arduino Kütüphane Yöneticisinden yükleyin.
3. Koddaki `ssid`, `password` ve `VERCEL_URL` değişkenlerini güncelleyin:
   ```cpp
   const char* WIFI_SSID     = "WIFI_ADINIZ";
   const char* WIFI_PASSWORD = "WIFI_SIFRENIZ";
   const char* VERCEL_URL    = "https://sizin-projeniz.vercel.app";
   ```
4. Kartı seçip kodu yükleyin.
5. Artık web panelinden butona bastığınız an mikrodenetleyiciniz röleyi anında tetikleyecektir!

---

## 🛠️ Donanım Bağlantıları
- **Röle VCC** ➔ ESP32 `VIN` (5V) veya `3V3`
- **Röle GND** ➔ ESP32 `GND`
- **Röle IN**  ➔ ESP32 `GPIO 2` (veya Deneyap `D0`)
