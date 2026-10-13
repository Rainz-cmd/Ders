# 💡 ESP32 & Deneyap Kart - Akıllı Lamba ve Röle Kontrol Projesi

Bu proje, bir ESP32 veya Deneyap Kart mikrodenetleyicisini **Vercel** bulutunda barındırılan modern bir web kontrol paneline bağlayarak lamba, LED ve 220V ev aletlerini kontrol etmenizi sağlar.

---

## 🛠️ Donanım Gereksinimleri
1. **ESP32 DevKit** veya **Deneyap Kart (1A)**
2. **1 Kanallı 5V / 3.3V Röle Modülü** (veya doğrudan bir LED + 220Ω Direnç)
3. Jumper Kablolar (Dişi-Erkek, Erkek-Erkek)
4. Lamba / 12V LED Şerit / Masa Lambası

---

## 🔌 Bağlantı Şeması (Wiring Diagram)

### ESP32 ➔ Röle Modülü Bağlantısı:
| Röle Pini | ESP32 Pini | Deneyap Kart Pini | Açıklama |
| :--- | :--- | :--- | :--- |
| **VCC** | `VIN` (5V) veya `3V3` | `5V` veya `3V3` | Güç Beslemesi |
| **GND** | `GND` | `GND` | Topraklama |
| **IN / SIG** | `GPIO 2` | `D0` | Sinyal / Tetik Pini |

### 💡 220V Lamba / Priz Bağlantısı:
```text
           [ 220V Şebeke / Priz ]
                | (Faz)          \ (Nötr)
                v                 \
          +------------+           \
          |    COM     |            \
          |  (Ortak)   |             \
          |            |              |
          |    NO      |              |
          | (Açık Uç)  |              |
          +------------+              |
                |                     |
                +------> [ LAMBA ] <--+
```
> **⚠️ Güvenlik Uyarısı:** 220V yüksek gerilim içerir! Devreyi test ederken önce USB'den güç verip röle üzerindeki LED'in "tık" sesiyle açılıp kapandığını doğrulayın.

---

## 🚀 Arduino IDE Kurulumu

1. **Arduino IDE** programını açın.
2. `Araçlar` ➔ `Kütüphane Yöneticisi...` menüsünü açın.
3. Arama çubuğuna **ArduinoJson** yazın ve **Benoit Blanchon** tarafından yazılan kütüphaneyi yükleyin (Sürüm 6 veya 7).
4. `esp32_lamp_controller.ino` dosyasını açın.
5. Kodun başındaki şu değişkenleri düzenleyin:
   ```cpp
   const char* ssid     = "WIFI_ADINIZ";
   const char* password = "WIFI_SIFRENIZ";
   const char* serverUrl = "https://ders-rainz.vercel.app"; // Vercel'deki siteniz
   ```
6. Kartınızı USB kablo ile bilgisayara bağlayın.
7. Doğru COM portunu ve kartı (ESP32 Dev Module veya Deneyap Kart) seçip **Yükle** (Upload) butonuna basın.
8. Yükleme tamamlandığında `Araçlar` ➔ `Seri Port Ekranı`nı (Serial Monitor) açın, baud hızını **115200** olarak ayarlayın.
9. Kartın Wi-Fi'ye bağlandığını ve IP aldığını göreceksiniz! Web sitesinden butona bastığınızda lamba anında yanacaktır.

---

## 🌐 Web Arayüzü (Vercel) Özellikleri
- **Gerçek Zamanlı Durum:** Lamba açık/kapalı görselleştirme ve oda ambiyans ışığı.
- **PWM / Parlaklık:** %1 - %100 arası ışık kısma (Dimmer).
- **Renk Seçici:** Ambiyans ve RGB LED destekleri.
- **Otomatik Kapanma (Zamanlayıcı):** 1, 5, 15, 30, 45, 60 dakika sonra otomatik kapanma.
- **Cihaz Telemetrisi:** ESP32'nin online/offline durumu, Wi-Fi sinyal gücü (RSSI) ve IP adresi.
- **Mobil PWA:** Telefonda Safari veya Chrome'dan "Ana Ekrana Ekle" diyerek direkt uygulama gibi açabilme.
