import type { MqttClient } from "@repo/mqtt-client";
import { sendCommand, doserName } from "../commands.js";
import { state } from "../state.js";
import { PH_LOW, PH_HIGH, PH_VIOLATION_MS, PH_DOSE_MS, PH_COOLDOWN_MS } from "../config.js";

/**
 * Handle incoming pH telemetry from Node A.
 *
 * State transitions (telemetry-driven):
 * - IDLE -> VIOLATION_DETECTED: pH outside [PH_LOW, PH_HIGH] range
 * - VIOLATION_DETECTED -> IDLE: pH returns to normal before sustained period
 * - VIOLATION_DETECTED -> DOSING: violation sustained for PH_VIOLATION_MS (5 min default)
 *
 * DOSING and COOLDOWN states ignore telemetry -- they are tick-driven (see tickPh).
 */
export function handlePhTelemetry(client: MqttClient, value: number, now: number): void {
  switch (state.ph.status) {
    case "IDLE": {
      if (value < PH_LOW) {
        state.ph = { status: "VIOLATION_DETECTED", direction: "low", since: now };
        console.log(`[automation] pH violation detected: ${value} < ${PH_LOW}`);
      } else if (value > PH_HIGH) {
        state.ph = { status: "VIOLATION_DETECTED", direction: "high", since: now };
        console.log(`[automation] pH violation detected: ${value} > ${PH_HIGH}`);
      }
      break;
    }
    case "VIOLATION_DETECTED": {
      const inRange = value >= PH_LOW && value <= PH_HIGH;
      if (inRange) {
        state.ph = { status: "IDLE" };
        console.log(`[automation] pH returned to normal: ${value}`);
        return;
      }
      const newDirection: "low" | "high" = value < PH_LOW ? "low" : "high";
      if (newDirection !== state.ph.direction) {
        state.ph = { status: "VIOLATION_DETECTED", direction: newDirection, since: now };
        return;
      }
      if (now - state.ph.since >= PH_VIOLATION_MS) {
        const doser = doserName(state.ph.direction);
        sendCommand(client, "node_a", doser, "ON");
        state.ph = { status: "DOSING", direction: state.ph.direction, startedAt: now };
        console.log(`[automation] pH dosing started: ${doser} ON`);
      }
      break;
    }
    case "DOSING":
    case "COOLDOWN":
      break;
  }
}

/**
 * Tick-driven pH state transitions. Called every TICK_INTERVAL_MS.
 *
 * - DOSING -> COOLDOWN: doser has been ON for PH_DOSE_MS (5 sec default), turn it OFF
 * - COOLDOWN -> IDLE: cooldown period (PH_COOLDOWN_MS, 10 min default) elapsed, resume monitoring
 *
 * This runs on a timer so the doser always turns off even if telemetry stops.
 */
export function tickPh(client: MqttClient, now: number): void {
  switch (state.ph.status) {
    case "DOSING": {
      if (now - state.ph.startedAt >= PH_DOSE_MS) {
        const doser = doserName(state.ph.direction);
        sendCommand(client, "node_a", doser, "OFF");
        state.ph = { status: "COOLDOWN", until: now + PH_COOLDOWN_MS };
        console.log(`[automation] pH dosing complete, cooldown until ${new Date(now + PH_COOLDOWN_MS).toLocaleTimeString()}`);
      }
      break;
    }
    case "COOLDOWN": {
      if (now >= state.ph.until) {
        state.ph = { status: "IDLE" };
        console.log("[automation] pH cooldown complete, resuming monitoring");
      }
      break;
    }
  }
}
