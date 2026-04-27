import { createMqttClient } from "@repo/mqtt-client";
import { parseTopic, type TelemetryPayload } from "@repo/types";
import { MQTT_BROKER, HEARTBEAT_INTERVAL_MS } from "./config.js";
import { evaluateTelemetry, rules } from "./threshold-engine.js";
import { dispatchAlert } from "./telegram.js";
import { checkHeartbeats } from "./heartbeat.js";
import { startServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3001);

const client = createMqttClient({
  broker: MQTT_BROKER,
  topics: ["farm/+/telemetry/#"],
  serviceName: "alerts-service",
  onMessage(topic: string, message: Buffer) {
    const parsed = parseTopic(topic);
    if (!parsed || parsed.type !== "telemetry") return;

    try {
      const payload: TelemetryPayload = JSON.parse(message.toString());
      evaluateTelemetry(parsed.nodeId, parsed.name, payload.value);
    } catch (err) {
      console.error(`[alerts-service] Failed to process ${topic}:`, err);
    }
  },
});

const heartbeatTimer = setInterval(checkHeartbeats, HEARTBEAT_INTERVAL_MS);

startServer(PORT);

process.on("SIGINT", () => {
  console.log("[alerts-service] Shutting down...");
  clearInterval(heartbeatTimer);
  client.end();
  process.exit(0);
});

export { rules, dispatchAlert };
