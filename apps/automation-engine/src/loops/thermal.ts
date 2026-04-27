import type { MqttClient } from "@repo/mqtt-client";
import { sendCommand } from "../commands.js";
import { state } from "../state.js";
import {
  SOLAR_THRESHOLD,
  CHILL_START_HOUR,
  CHILL_END_HOUR,
  CIRCULATE_START_HOUR,
  CIRCULATE_END_HOUR,
} from "../config.js";

/**
 * Tick-driven thermal battery control loop.
 *
 * Manages chilling (daytime solar excess) and circulation (evening cold water distribution):
 * - IDLE -> CHILLING: within chill window (12:00-15:00) AND solar output > 80%
 * - CHILLING -> CIRCULATING: circulation window starts (20:00), chiller OFF + pump ON
 * - CHILLING -> IDLE: chill window ended but circulation not yet started
 * - CIRCULATING -> IDLE: circulation window ended (06:00), pump OFF
 *
 * Solar output value is stored in state.lastValues.solarOutput by the MQTT message handler.
 */
export function tickThermal(client: MqttClient, now: number): void {
  const hour = new Date(now).getHours();
  const solar = state.lastValues.solarOutput;
  const inChillWindow = hour >= CHILL_START_HOUR && hour < CHILL_END_HOUR;
  const inCirculateWindow = hour >= CIRCULATE_START_HOUR || hour < CIRCULATE_END_HOUR;

  switch (state.thermal.status) {
    case "IDLE": {
      if (inChillWindow && solar !== null && solar > SOLAR_THRESHOLD) {
        sendCommand(client, "node_c", "chiller", "ON");
        state.thermal = { status: "CHILLING" };
        console.log(`[automation] Thermal: chilling started (solar at ${solar}%)`);
      } else if (inCirculateWindow) {
        sendCommand(client, "node_c", "chiller", "OFF");
        sendCommand(client, "node_c", "thermal_pump", "ON");
        state.thermal = { status: "CIRCULATING" };
        console.log("[automation] Thermal: circulation started");
      }
      break;
    }
    case "CHILLING": {
      if (inCirculateWindow) {
        sendCommand(client, "node_c", "chiller", "OFF");
        sendCommand(client, "node_c", "thermal_pump", "ON");
        state.thermal = { status: "CIRCULATING" };
        console.log("[automation] Thermal: chilling -> circulation");
      } else if (!inChillWindow) {
        sendCommand(client, "node_c", "chiller", "OFF");
        state.thermal = { status: "IDLE" };
        console.log("[automation] Thermal: chilling window ended");
      }
      break;
    }
    case "CIRCULATING": {
      if (!inCirculateWindow) {
        sendCommand(client, "node_c", "thermal_pump", "OFF");
        state.thermal = { status: "IDLE" };
        console.log("[automation] Thermal: circulation ended");
      }
      break;
    }
  }
}
