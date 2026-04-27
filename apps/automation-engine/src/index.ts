import { createMqttClient } from "@repo/mqtt-client";
import { parseTopic, type TelemetryPayload } from "@repo/types";
import { MQTT_BROKER, TICK_INTERVAL_MS } from "./config.js";
import { state } from "./state.js";
import { sendCommand } from "./commands.js";
import { handlePhTelemetry, tickPh } from "./loops/ph.js";
import { handleCo2 } from "./loops/co2.js";
import { tickThermal } from "./loops/thermal.js";
import { startServer } from "./server.js";

const client = createMqttClient({
  broker: MQTT_BROKER,
  topics: ["farm/+/telemetry/#"],
  serviceName: "automation",
  onMessage(topic: string, message: Buffer) {
    const parsed = parseTopic(topic);
    if (!parsed || parsed.type !== "telemetry") return;

    try {
      const payload: TelemetryPayload = JSON.parse(message.toString());
      const now = Date.now();

      if (parsed.nodeId === "node_a" && parsed.name === "ph_level") {
        state.lastValues.ph = payload.value;
        handlePhTelemetry(client, payload.value, now);
      } else if (parsed.nodeId === "node_b" && parsed.name === "co2") {
        state.lastValues.co2 = payload.value;
        handleCo2(client, payload.value);
      } else if (parsed.nodeId === "node_c" && parsed.name === "solar_output") {
        state.lastValues.solarOutput = payload.value;
      }
    } catch (err) {
      console.error(`[automation] Failed to process ${topic}:`, err);
    }
  },
});

const tickTimer = setInterval(() => {
  const now = Date.now();
  tickPh(client, now);
  tickThermal(client, now);
}, TICK_INTERVAL_MS);

startServer();

process.on("SIGINT", () => {
  console.log("[automation] Shutting down — turning off all actuators...");
  clearInterval(tickTimer);
  sendCommand(client, "node_a", "ph_up_doser", "OFF");
  sendCommand(client, "node_a", "ph_down_doser", "OFF");
  sendCommand(client, "node_b", "exhaust_fan", "OFF");
  sendCommand(client, "node_c", "chiller", "OFF");
  sendCommand(client, "node_c", "thermal_pump", "OFF");
  client.end();
  process.exit(0);
});
