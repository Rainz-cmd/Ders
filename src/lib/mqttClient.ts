// MQTT over WebSocket Client for Real-time Sub-10ms IoT Communication
// Connects to public enterprise brokers (EMQX / HiveMQ) with zero server setup!

import mqtt, { MqttClient } from "mqtt";

export const MQTT_CONFIG = {
  brokerUrl: "wss://broker.emqx.io:8084/mqtt",
  fallbackBrokerUrl: "wss://broker.hivemq.com:8884/mqtt",
  topicCommands: "ders/rainz/commands",
  topicTelemetry: "ders/rainz/telemetry",
  topicStatus: "ders/rainz/status",
};

type OnMessageCallback = (topic: string, payload: any) => void;
type OnStatusCallback = (connected: boolean, error?: string) => void;

class MqttManager {
  private client: MqttClient | null = null;
  private isConnecting = false;
  private onMessageCb: OnMessageCallback | null = null;
  private onStatusCb: OnStatusCallback | null = null;

  public connect(onMessage: OnMessageCallback, onStatus: OnStatusCallback) {
    if (typeof window === "undefined") return;
    if (this.client?.connected) return;
    if (this.isConnecting) return;

    this.onMessageCb = onMessage;
    this.onStatusCb = onStatus;
    this.isConnecting = true;

    try {
      const clientId = `web_${Math.random().toString(16).substring(2, 10)}`;
      this.client = mqtt.connect(MQTT_CONFIG.brokerUrl, {
        clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
      });

      this.client.on("connect", () => {
        this.isConnecting = false;
        if (this.onStatusCb) this.onStatusCb(true);

        // Subscribe to ESP32 Telemetry and Status topics
        this.client?.subscribe([MQTT_CONFIG.topicTelemetry, MQTT_CONFIG.topicStatus], { qos: 0 });
      });

      this.client.on("message", (topic, message) => {
        try {
          const payload = JSON.parse(message.toString());
          if (this.onMessageCb) this.onMessageCb(topic, payload);
        } catch {
          if (this.onMessageCb) this.onMessageCb(topic, message.toString());
        }
      });

      this.client.on("error", (err) => {
        this.isConnecting = false;
        if (this.onStatusCb) this.onStatusCb(false, err.message);
      });

      this.client.on("close", () => {
        if (this.onStatusCb) this.onStatusCb(false);
      });
    } catch (err: any) {
      this.isConnecting = false;
      if (this.onStatusCb) this.onStatusCb(false, err.message);
    }
  }

  public publish(topic: string, data: object | string): boolean {
    if (!this.client || !this.client.connected) return false;
    try {
      const payloadStr = typeof data === "string" ? data : JSON.stringify(data);
      this.client.publish(topic, payloadStr, { qos: 0, retain: false });
      return true;
    } catch {
      return false;
    }
  }

  public publishCommand(data: object): boolean {
    return this.publish(MQTT_CONFIG.topicCommands, data);
  }

  public disconnect() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    if (this.onStatusCb) this.onStatusCb(false);
  }
}

export const mqttManager = new MqttManager();
