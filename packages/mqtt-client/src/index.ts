import mqtt, { type MqttClient } from "mqtt";

export interface MqttClientOptions {
  broker: string;
  topics: string[];
  serviceName: string;
  onMessage: (topic: string, message: Buffer) => void;
}

/**
 * Create and connect an MQTT client with standard logging and error handling.
 * Subscribes to the given topics on connect. The mqtt library handles
 * reconnection automatically with exponential backoff.
 */
export function createMqttClient(opts: MqttClientOptions): MqttClient {
  const client = mqtt.connect(opts.broker);

  client.on("connect", () => {
    console.log(`[${opts.serviceName}] Connected to MQTT broker at ${opts.broker}`);
    for (const topic of opts.topics) {
      client.subscribe(topic);
    }
  });

  client.on("message", opts.onMessage);

  client.on("error", (err) => {
    console.error(`[${opts.serviceName}] MQTT error:`, err);
  });

  return client;
}

export type { MqttClient };
