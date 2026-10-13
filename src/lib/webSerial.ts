// Web Serial API Manager - Arduino IDE Grade Driver
// Supports automatic USB Chip recognition, configurable Baud, DTR/RTS Reset, and Line Endings

export interface UsbChipInfo {
  name: string;
  vendorId?: number;
  productId?: number;
  description: string;
}

// Known USB-to-UART converter chip database
export function identifyUsbChip(vendorId?: number, productId?: number): UsbChipInfo {
  if (!vendorId) {
    return { name: "Bilinmeyen USB Port", description: "Standart Seri Bağlantı" };
  }

  const vHex = vendorId.toString(16).toUpperCase();
  const pHex = productId ? productId.toString(16).toUpperCase() : "";

  // Silicon Labs CP210x (ESP32 DevKit v1, NodeMCU-32S)
  if (vendorId === 0x10c4) {
    return {
      name: "Silicon Labs CP2102/CP2104",
      vendorId,
      productId,
      description: "Standart ESP32 DevKit v1 USB-UART Köprüsü",
    };
  }

  // WCH CH340 / CH341 (Klon ESP32, Arduino)
  if (vendorId === 0x1a86) {
    return {
      name: "WCH CH340 / CH341",
      vendorId,
      productId,
      description: "Ekonomik ESP32 / Arduino USB-Serial Çipi",
    };
  }

  // Espressif Native USB JTAG/CDC (ESP32-S2, ESP32-S3, Deneyap Kart 1A v2)
  if (vendorId === 0x303a) {
    return {
      name: "Espressif USB JTAG / CDC",
      vendorId,
      productId,
      description: "Deneyap Kart / ESP32-S3 Doğrudan Dahili USB CDC Portu",
    };
  }

  // FTDI FT232R
  if (vendorId === 0x0403) {
    return {
      name: "FTDI FT232R",
      vendorId,
      productId,
      description: "Endüstriyel USB-Serial Dönüştürücü",
    };
  }

  // Arduino
  if (vendorId === 0x2341) {
    return {
      name: "Arduino CDC Bootloader",
      vendorId,
      productId,
      description: "Resmi Arduino Geliştirme Kartı",
    };
  }

  return {
    name: `USB Cihazı (VID: 0x${vHex}, PID: 0x${pHex})`,
    vendorId,
    productId,
    description: "Algılanan Seri Donanım",
  };
}

type OnDataCallback = (line: string) => void;
type OnStatusCallback = (connected: boolean, chip?: UsbChipInfo, error?: string) => void;

class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private isReading = false;
  private onData: OnDataCallback | null = null;
  private onStatus: OnStatusCallback | null = null;
  public chipInfo: UsbChipInfo = { name: "Cihaz Yok", description: "" };

  public isSupported(): boolean {
    return typeof window !== "undefined" && "serial" in navigator;
  }

  public setCallbacks(onData: OnDataCallback, onStatus: OnStatusCallback) {
    this.onData = onData;
    this.onStatus = onStatus;
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      if (this.onStatus) this.onStatus(false, undefined, "Tarayıcınız Web Serial API desteklemiyor (Chrome veya Edge kullanın).");
      return false;
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });

      const info = this.port.getInfo?.() || {};
      this.chipInfo = identifyUsbChip(info.usbVendorId, info.usbProductId);

      if (this.onStatus) this.onStatus(true, this.chipInfo);
      this.startReading();
      return true;
    } catch (err: any) {
      if (this.onStatus) this.onStatus(false, undefined, err.message || "Bağlantı iptal edildi");
      return false;
    }
  }

  private async startReading() {
    if (!this.port || !this.port.readable) return;
    this.isReading = true;

    try {
      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable).catch(() => {});
      const reader = textDecoder.readable.getReader();
      this.reader = reader;

      let buffer = "";
      while (this.isReading) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const clean = line.trim();
            if (clean && this.onData) {
              this.onData(clean);
            }
          }
        }
      }
    } catch {
      // Stream error or disconnect
    } finally {
      this.disconnect();
    }
  }

  public async sendCommand(cmd: string, lineEnding: string = "\n"): Promise<boolean> {
    if (!this.port || !this.port.writable) return false;
    try {
      const textEncoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(textEncoder.encode(cmd + lineEnding));
      writer.releaseLock();
      return true;
    } catch {
      return false;
    }
  }

  // Hard Reset the ESP32 by pulsing DTR and RTS signals (Arduino IDE behavior!)
  public async resetBoard(): Promise<boolean> {
    if (!this.port) return false;
    try {
      if (this.port.setSignals) {
        // Assert DTR/RTS to pull EN pin low
        await this.port.setSignals({ dataTerminalReady: false, requestToSend: true });
        await new Promise((r) => setTimeout(r, 120));
        await this.port.setSignals({ dataTerminalReady: true, requestToSend: false });
        await new Promise((r) => setTimeout(r, 50));
        await this.port.setSignals({ dataTerminalReady: false, requestToSend: false });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public async disconnect() {
    this.isReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel().catch(() => {});
      }
      if (this.port) {
        await this.port.close().catch(() => {});
      }
    } catch {}
    this.port = null;
    this.reader = null;
    if (this.onStatus) this.onStatus(false, undefined);
  }
}

export const webSerial = new WebSerialManager();
