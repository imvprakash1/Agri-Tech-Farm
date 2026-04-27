import type { MqttClient } from "@repo/mqtt-client";
import { sendCommand } from "../commands.js";
import { state } from "../state.js";
import { CO2_HIGH, CO2_LOW } from "../config.js";

/**
 * Handle incoming CO2 telemetry from Node B.
 *
 * Hysteresis-based control to prevent rapid cycling:
 * - IDLE -> PURGING: CO2 exceeds CO2_HIGH (1000 ppm default), exhaust fan ON
 * - PURGING -> IDLE: CO2 drops below CO2_LOW (600 ppm default), exhaust fan OFF
 *
 * The 400 ppm gap between thresholds prevents the fan from toggling rapidly.
 */
export function handleCo2(client: MqttClient, value: number): void {
  switch (state.co2.status) {
    case "IDLE": {
      if (value > CO2_HIGH) {
        sendCommand(client, "node_b", "exhaust_fan", "ON");
        state.co2 = { status: "PURGING" };
        console.log(`[automation] CO2 high (${value} ppm), exhaust fan ON`);
      }
      break;
    }
    case "PURGING": {
      if (value < CO2_LOW) {
        sendCommand(client, "node_b", "exhaust_fan", "OFF");
        state.co2 = { status: "IDLE" };
        console.log(`[automation] CO2 normalized (${value} ppm), exhaust fan OFF`);
      }
      break;
    }
  }
}
