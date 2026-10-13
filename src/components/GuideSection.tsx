"use client";

import React, { useState } from "react";
import { BookOpen, Cpu, Wrench, ShieldCheck, HelpCircle, CheckCircle2, Usb } from "lucide-react";

export const GuideSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"hardware" | "wiring" | "usb" | "arduino" | "troubleshoot">("hardware");

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 mt-12 border border-neutral-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-800/80 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Sıfırdan Kurulum & Donanım Rehberi (5 Cihaz + USB)
            </h2>
            <p className="text-xs text-neutral-400">
              ESP32 ve Deneyap Kart ile tüm modüllerin adaptasyon ve bağlantı rehberi
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-900/80 rounded-2xl border border-neutral-800">
          {[
            { id: "hardware" as const, label: "Parçalar", icon: Wrench },
            { id: "wiring" as const, label: "Pin Şeması", icon: Cpu },
            { id: "usb" as const, label: "USB Adaptasyonu", icon: Usb },
            { id: "arduino" as const, label: "Arduino Kodu", icon: CheckCircle2 },
            { id: "troubleshoot" as const, label: "Sorun Giderme", icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  isActive
                    ? "bg-yellow-500 text-neutral-950 font-bold shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="pt-6">
        {/* 1. GEREKLİ PARÇALAR */}
        {activeTab === "hardware" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase block mb-1">1. CİHAZ</span>
              <h4 className="font-bold text-white text-xs mb-1.5">Lamba & Röle</h4>
              <p className="text-[11px] text-neutral-400">1 Kanallı 5V Röle Modülü veya Masa Lambası.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase block mb-1">2. CİHAZ</span>
              <h4 className="font-bold text-white text-xs mb-1.5">Fan Motoru</h4>
              <p className="text-[11px] text-neutral-400">5V DC Motor veya 12V Bilgisayar Fanı (PWM).</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-mono font-bold text-red-400 uppercase block mb-1">3. CİHAZ</span>
              <h4 className="font-bold text-white text-xs mb-1.5">Kapı Kilidi</h4>
              <p className="text-[11px] text-neutral-400">SG90 Servo Motor + Buzzer Siren.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase block mb-1">4. CİHAZ</span>
              <h4 className="font-bold text-white text-xs mb-1.5">RGB NeoPixel</h4>
              <p className="text-[11px] text-neutral-400">WS2812B Adreslenebilir RGB LED Bar.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase block mb-1">5. CİHAZ</span>
              <h4 className="font-bold text-white text-xs mb-1.5">Akıllı Sulama</h4>
              <p className="text-[11px] text-neutral-400">Mini Su Pompası + Toprak Nem Sensörü.</p>
            </div>
          </div>
        )}

        {/* 2. PIN EŞLEME TABLOSU */}
        {activeTab === "wiring" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-neutral-800">
              <thead className="bg-neutral-900/90 text-neutral-400">
                <tr>
                  <th className="p-2.5 border-b border-neutral-800">Modül Adı</th>
                  <th className="p-2.5 border-b border-neutral-800">Modül Sinyal Pini</th>
                  <th className="p-2.5 border-b border-neutral-800">ESP32 Pini</th>
                  <th className="p-2.5 border-b border-neutral-800">Deneyap Kart Pini</th>
                  <th className="p-2.5 border-b border-neutral-800">Görevi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                <tr>
                  <td className="p-2.5 font-bold text-yellow-400">1. Lamba Rölesi</td>
                  <td className="p-2.5">IN / Sinyal</td>
                  <td className="p-2.5 text-emerald-400">GPIO 2 (D2)</td>
                  <td className="p-2.5 text-emerald-400">D0</td>
                  <td className="p-2.5 text-neutral-400">Lamba Aç / Kapa</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-cyan-400">2. Fan Motoru</td>
                  <td className="p-2.5">PWM / Sinyal</td>
                  <td className="p-2.5 text-emerald-400">GPIO 4 (D4)</td>
                  <td className="p-2.5 text-emerald-400">D1</td>
                  <td className="p-2.5 text-neutral-400">Hız Kontrolü (0 - 255)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-red-400">3. SG90 Kilit Servosu</td>
                  <td className="p-2.5">Turuncu Kablo</td>
                  <td className="p-2.5 text-emerald-400">GPIO 18 (D18)</td>
                  <td className="p-2.5 text-emerald-400">D8</td>
                  <td className="p-2.5 text-neutral-400">Kilit Açısı (0° - 90°)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-rose-400">Buzzer Siren</td>
                  <td className="p-2.5">Pozitif (+)</td>
                  <td className="p-2.5 text-emerald-400">GPIO 19 (D19)</td>
                  <td className="p-2.5 text-emerald-400">D9</td>
                  <td className="p-2.5 text-neutral-400">Yetkisiz Müdahale Alarmı</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-purple-400">4. WS2812B RGB NeoPixel</td>
                  <td className="p-2.5">DIN (Data In)</td>
                  <td className="p-2.5 text-emerald-400">GPIO 5 (D5)</td>
                  <td className="p-2.5 text-emerald-400">D4</td>
                  <td className="p-2.5 text-neutral-400">Ambiyans Renk Verisi</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-blue-400">5. Sulama Su Pompası</td>
                  <td className="p-2.5">IN (Röle / Mosfet)</td>
                  <td className="p-2.5 text-emerald-400">GPIO 23 (D23)</td>
                  <td className="p-2.5 text-emerald-400">D10</td>
                  <td className="p-2.5 text-neutral-400">Mini Su Motoru Tetikleme</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-emerald-400">Toprak Nem Sensörü</td>
                  <td className="p-2.5">A0 (Analog Çıkış)</td>
                  <td className="p-2.5 text-emerald-400">GPIO 34 (ADC1)</td>
                  <td className="p-2.5 text-emerald-400">A0</td>
                  <td className="p-2.5 text-neutral-400">Toprak Nem Değeri Okuma</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 3. USB ADAPTASYONU */}
        {activeTab === "usb" && (
          <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
              <h4 className="font-bold text-cyan-300 text-sm mb-1.5 flex items-center space-x-2">
                <Usb className="w-4 h-4" />
                <span>Web Serial API: Doğrudan USB Portuyla Kontrol</span>
              </h4>
              <p className="text-neutral-300">
                Sistemi internet/Wi-Fi olmadan, doğrudan USB kablosuyla bilgisayardan kontrol edebilirsiniz! Üst bardaki <strong>&quot;USB Bağlan&quot;</strong> butonuna bastığınızda Chrome/Edge tarayıcınız bir açılır pencere çıkartır. Buradan kartınızın bağlı olduğu COM portunu (CP2102, CH340 veya Deneyap USB CDC) seçtiğinizde web sitesi doğrudan mikrodenetleyicinin Seri Portuna bağlanır.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
                <strong className="text-white block mb-1">Mod 1: Bulut (Wi-Fi) Modu</strong>
                <span className="text-neutral-400">ESP32 evdeki veya sınıftaki Wi-Fi&apos;ye bağlanır, dünyanın öbür ucundaki telefondan bile Vercel üzerinden kontrol edilir.</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
                <strong className="text-white block mb-1">Mod 2: Doğrudan USB Kablo Modu</strong>
                <span className="text-neutral-400">Wi-Fi şifresi veya internet gerektirmeden, USB kablosuyla 115200 Baud hızında anında çift yönlü haberleşir.</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. ARDUINO KODU */}
        {activeTab === "arduino" && (
          <div className="space-y-3 text-xs text-neutral-300">
            <p>Arduino IDE Kütüphane Yöneticisinden şu kütüphaneleri kurun:</p>
            <ul className="list-disc list-inside space-y-1 font-mono text-yellow-300">
              <li>ArduinoJson (Benoit Blanchon)</li>
              <li>ESP32Servo (Kevin Harrington)</li>
              <li>Adafruit NeoPixel (WS2812B için)</li>
            </ul>
            <p className="text-neutral-400 mt-2">
              Masaüstündeki <code>esp32/esp32_all_in_one.ino</code> dosyasını açıp kartınıza yüklemeniz yeterlidir.
            </p>
          </div>
        )}

        {/* 5. SORUN GİDERME */}
        {activeTab === "troubleshoot" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="font-bold text-yellow-400 block mb-1">USB Portu Görünmüyor mu?</span>
              <p className="text-neutral-400">
                CH340 veya CP2102 USB sürücüsünün Windows&apos;ta yüklü olduğundan ve kullandığınız USB kablosunun sadece şarj değil &quot;Veri Aktarımı&quot; (Data Transfer) desteklediğinden emin olun.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="font-bold text-yellow-400 block mb-1">Wi-Fi Bağlanmıyor mu?</span>
              <p className="text-neutral-400">
                Telefonunuzun Kişisel Erişim Noktasını (Hotspot) açın ve ağ frekansını <strong>2.4 GHz</strong> olarak ayarlayın. ESP32 5 GHz ağlara bağlanamaz.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
