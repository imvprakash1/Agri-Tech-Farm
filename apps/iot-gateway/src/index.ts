import { InfluxDB, Point, WriteApi } from "@influxdata/influxdb-client";
import { createMqttClient } from "@repo/mqtt-client";
import { parseTopic, type TelemetryPayload } from "@repo/types";

const MQTT_BROKER = process.env.MQTT_BROKER ?? "mqtt://localhost:1883";
const INFLUX_URL = process.env.INFLUX_URL ?? "http://localhost:8086";
const INFLUX_TOKEN = process.env.INFLUX_TOKEN ?? "";
const INFLUX_ORG = process.env.INFLUX_ORG ?? "agritech";
const INFLUX_BUCKET = process.env.INFLUX_BUCKET ?? "agritech_production";

const influx = new InfluxDB({ url: INFLUX_URL, token: INFLUX_TOKEN });
const writeApi: WriteApi = influx.getWriteApi(INFLUX_ORG, INFLUX_BUCKET, "s");

const client = createMqttClient({
  broker: MQTT_BROKER,
  topics: ["farm/+/telemetry/#", "farm/+/status/#"],
  serviceName: "iot-gateway",
  onMessage(topic: string, message: Buffer) {
    const parsed = parseTopic(topic);
    if (!parsed) return;

    try {
      const payload: TelemetryPayload = JSON.parse(message.toString());

      if (parsed.type === "telemetry") {
        const point = new Point(parsed.name)
          .tag("node", parsed.nodeId)
          .floatField("value", payload.value)
          .timestamp(new Date(payload.timestamp * 1000));
        writeApi.writePoint(point);
      }

      if (parsed.type === "status") {
        const point = new Point("system_status")
          .tag("node", parsed.nodeId)
          .tag("device", parsed.name)
          .intField("state", payload.value)
          .timestamp(new Date(payload.timestamp * 1000));
        writeApi.writePoint(point);
      }
    } catch (err) {
      console.error(`[iot-gateway] Failed to process ${topic}:`, err);
    }
  },
});

process.on("SIGINT", async () => {
  console.log("[iot-gateway] Shutting down...");
  await writeApi.close();
  client.end();
  process.exit(0);
});

console.log("[iot-gateway] Starting... waiting for MQTT connection");
