// Web Serial API Manager for ESP32 and Deneyap Direct USB Connection
// Allows controlling the board directly via USB cable at 115200 Baud!

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

type OnDataCallback = (line: string) => void;
type OnStatusCallback = (connected: boolean, error?: string) => void;

class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private readableStreamClosed: any = null;
  private writableStreamClosed: any = null;
  private isReading = false;
  private onData: OnDataCallback | null = null;
  private onStatus: OnStatusCallback | null = null;

  public isSupported(): boolean {
    return typeof window !== "undefined" && "serial" in navigator;
  }

  public setCallbacks(onData: OnDataCallback, onStatus: OnStatusCallback) {
    this.onData = onData;
    this.onStatus = onStatus;
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      if (this.onStatus) this.onStatus(false, "Tarayıcınız Web Serial API desteklemiyor (Chrome veya Edge kullanın).");
      return false;
    }

    try {
      // Prompt user to pick USB COM Port
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });

      if (this.onStatus) this.onStatus(true);
      this.startReading();
      return true;
    } catch (err: any) {
      if (this.onStatus) this.onStatus(false, err.message || "Bağlantı iptal edildi");
      return false;
    }
  }

  private async startReading() {
    if (!this.port || !this.port.readable) return;
    this.isReading = true;

    try {
      const textDecoder = new TextDecoderStream();
      this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
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
    } catch (err) {
      // Disconnected or read error
    } finally {
      this.disconnect();
    }
  }

  public async sendCommand(cmd: string): Promise<boolean> {
    if (!this.port || !this.port.writable) return false;
    try {
      const textEncoder = new TextEncoder();
      const writer = this.port.writable.getWriter();
      await writer.write(textEncoder.encode(cmd + "\n"));
      writer.releaseLock();
      return true;
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
    if (this.onStatus) this.onStatus(false);
  }
}

export const webSerial = new WebSerialManager();
