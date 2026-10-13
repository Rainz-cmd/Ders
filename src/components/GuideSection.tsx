"use client";

import React, { useState } from "react";
import { BookOpen, Cpu, Wrench, ShieldCheck, HelpCircle, CheckCircle2 } from "lucide-react";

export const GuideSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"hardware" | "wiring" | "arduino" | "troubleshoot">("hardware");

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 mt-12 border border-neutral-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-neutral-800/80 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">
              Sıfırdan Kurulum & Donanım Rehberi
            </h2>
            <p className="text-xs text-neutral-400">
              ESP32 ve Deneyap Kart ile Lamba, Fan ve Kapı Kilidini bağlama adımları
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-900/80 rounded-2xl border border-neutral-800">
          {[
            { id: "hardware" as const, label: "Parçalar", icon: Wrench },
            { id: "wiring" as const, label: "Bağlantı Şeması", icon: Cpu },
            { id: "arduino" as const, label: "Arduino Kurulumu", icon: CheckCircle2 },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-xs font-mono font-bold text-yellow-400 uppercase block mb-1">
                1. CİHAZ (LAMBA)
              </span>
              <h4 className="font-bold text-white text-sm mb-2">Akıllı Lamba & Röle</h4>
              <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
                <li>1 Kanallı 5V Röle Modülü (veya 3.3V)</li>
                <li>Masa lambası / 220V ampul / LED</li>
                <li>Dişi-Erkek jumper kablolar</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase block mb-1">
                2. CİHAZ (FAN)
              </span>
              <h4 className="font-bold text-white text-sm mb-2">Akıllı Fan / Havalandırma</h4>
              <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
                <li>5V DC Fan Motoru veya Bilgisayar Fanı</li>
                <li>2N2222 Transistör veya 2. Röle Modülü</li>
                <li>(Opsiyonel) DHT11 Sıcaklık Sensörü</li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <span className="text-xs font-mono font-bold text-red-400 uppercase block mb-1">
                3. CİHAZ (KİLİT)
              </span>
              <h4 className="font-bold text-white text-sm mb-2">Servo Güvenlik Kilidi</h4>
              <ul className="text-xs text-neutral-300 space-y-1.5 list-disc list-inside">
                <li>SG90 Mikro Servo Motor (9g)</li>
                <li>Aktif / Pasif Buzzer (Siren için)</li>
                <li>Dişi-Erkek jumper kablolar</li>
              </ul>
            </div>
          </div>
        )}

        {/* 2. BAĞLANTI ŞEMASI */}
        {activeTab === "wiring" && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-neutral-800">
                <thead className="bg-neutral-900/90 text-neutral-400">
                  <tr>
                    <th className="p-3 border-b border-neutral-800">Cihaz & Modül</th>
                    <th className="p-3 border-b border-neutral-800">Modül Pini</th>
                    <th className="p-3 border-b border-neutral-800">ESP32 Pini</th>
                    <th className="p-3 border-b border-neutral-800">Deneyap Kart Pini</th>
                    <th className="p-3 border-b border-neutral-800">Görevi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono text-neutral-300">
                  <tr>
                    <td className="p-3 font-sans font-bold text-yellow-400">1. Röle (Lamba)</td>
                    <td className="p-3">IN (Sinyal)</td>
                    <td className="p-3 text-emerald-400">GPIO 2 (D2)</td>
                    <td className="p-3 text-emerald-400">D0</td>
                    <td className="p-3 font-sans text-neutral-400">Lamba Aç/Kapa Sinyali</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-cyan-400">2. Fan (Motor)</td>
                    <td className="p-3">PWM / Sinyal</td>
                    <td className="p-3 text-emerald-400">GPIO 4 (D4)</td>
                    <td className="p-3 text-emerald-400">D1</td>
                    <td className="p-3 font-sans text-neutral-400">PWM Hız Ayarı (0-255)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-red-400">3. SG90 Servo</td>
                    <td className="p-3">Turuncu (Sinyal)</td>
                    <td className="p-3 text-emerald-400">GPIO 18 (D18)</td>
                    <td className="p-3 text-emerald-400">D8</td>
                    <td className="p-3 font-sans text-neutral-400">Kilit Açısı (0° - 90°)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-bold text-rose-400">Buzzer (Alarm)</td>
                    <td className="p-3">Pozitif (+)</td>
                    <td className="p-3 text-emerald-400">GPIO 19 (D19)</td>
                    <td className="p-3 text-emerald-400">D9</td>
                    <td className="p-3 font-sans text-neutral-400">Güvenlik Sireni</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans text-neutral-400">Tüm Cihazlar</td>
                    <td className="p-3 text-neutral-400">GND / VCC</td>
                    <td className="p-3">GND ve VIN (5V)</td>
                    <td className="p-3">GND ve 5V</td>
                    <td className="p-3 font-sans text-neutral-400">Ortak Besleme ve Topraklama</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-neutral-400 bg-neutral-900/60 p-3 rounded-xl border border-neutral-800">
              💡 <strong>İpucu:</strong> Eğer elinde servo motor veya fan motoru yoksa bile, GPIO 2, GPIO 4 ve GPIO 18 pinlerine sadece basit 3 adet LED bağlayarak da sistemin çalıştığını hocaya kusursuzca gösterebilirsin.
            </p>
          </div>
        )}

        {/* 3. ARDUINO KURULUMU */}
        {activeTab === "arduino" && (
          <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
            <ol className="list-decimal list-inside space-y-2.5">
              <li>
                <strong>Arduino IDE</strong> programını açın.
              </li>
              <li>
                Sol menüdeki <strong>Kütüphane Yöneticisi</strong> ikonuna tıklayın ve <code>ArduinoJson</code> (Benoit Blanchon) ile <code>ESP32Servo</code> kütüphanelerini aratıp <strong>Yükle</strong> butonuna basın.
              </li>
              <li>
                Proje klasöründeki <code>esp32/esp32_all_in_one.ino</code> (veya Deneyap için <code>esp32/deneyap_all_in_one.ino</code>) dosyasını açın.
              </li>
              <li>
                Koddaki <code>WIFI_SSID</code>, <code>WIFI_PASSWORD</code> ve <code>VERCEL_URL</code> alanlarına kendi bilgilerinizi yazın.
              </li>
              <li>
                ESP32 kartınızı USB ile takın, <strong>Araçlar &gt; Kart &gt; ESP32 Dev Module</strong> ve ilgili <strong>COM Portunu</strong> seçip <strong>Yükle</strong> butonuna basın.
              </li>
            </ol>
          </div>
        )}

        {/* 4. SORUN GİDERME */}
        {activeTab === "troubleshoot" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="font-bold text-yellow-400 block mb-1">Wi-Fi Bağlanmıyor mu?</span>
              <p className="text-neutral-400">
                ESP32 sadece <strong>2.4 GHz</strong> Wi-Fi ağlarını destekler. Ev modeminiz 5 GHz ise telefonunuzun kişisel erişim noktasını (Hotspot) açıp 2.4 GHz olarak ayarlayın.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <span className="font-bold text-yellow-400 block mb-1">Web Sitesi Kırmızı (Offline) mı?</span>
              <p className="text-neutral-400">
                Koddaki <code>VERCEL_URL</code> adresinin sonuna <code>/</code> koymadığınızdan emin olun. Örnek: <code>https://ders-taupe.vercel.app</code>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
