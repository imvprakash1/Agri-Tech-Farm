import mqtt from "mqtt";
import {
  type ActuatorState,
  type CommandPayload,
  type TelemetryPayload,
  type NodeId,
  NODE_LABELS,
  buildTopic,
  parseTopic,
} from "@repo/types";

// ── Configuration ─────────────────────────────────────────────────
const MQTT_BROKER = process.env.MQTT_BROKER ?? "mqtt://localhost:1883";
const PORT = Number(process.env.PORT ?? 3002);

// pH loop
const PH_LOW = Number(process.env.PH_LOW ?? 6.0);
const PH_HIGH = Number(process.env.PH_HIGH ?? 8.5);
const PH_VIOLATION_MS = Number(process.env.PH_VIOLATION_MS ?? 300_000);  // 5 min
const PH_DOSE_MS = Number(process.env.PH_DOSE_MS ?? 5_000);             // 5 sec
const PH_COOLDOWN_MS = Number(process.env.PH_COOLDOWN_MS ?? 600_000);   // 10 min

// CO2 loop
const CO2_HIGH = Number(process.env.CO2_HIGH ?? 1000);
const CO2_LOW = Number(process.env.CO2_LOW ?? 600);

// Thermal loop
const SOLAR_THRESHOLD = Number(process.env.SOLAR_THRESHOLD ?? 80);
const CHILL_START_HOUR = Number(process.env.CHILL_START_HOUR ?? 12);
const CHILL_END_HOUR = Number(process.env.CHILL_END_HOUR ?? 15);
const CIRCULATE_START_HOUR = Number(process.env.CIRCULATE_START_HOUR ?? 20);
const CIRCULATE_END_HOUR = Number(process.env.CIRCULATE_END_HOUR ?? 6);

// Tick interval for time-based state transitions
const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 10_000); // 10 sec

// ── State Machine Types ───────────────────────────────────────────
type PhState =
  | { status: "IDLE" }
  | { status: "VIOLATION_DETECTED"; direction: "low" | "high"; since: number }
  | { status: "DOSING"; direction: "low" | "high"; startedAt: number }
  | { status: "COOLDOWN"; until: number };

type Co2State =
  | { status: "IDLE" }
  | { status: "PURGING" };

type ThermalState =
  | { status: "IDLE" }
  | { status: "CHILLING" }
  | { status: "CIRCULATING" };

interface EngineState {
  ph: PhState;
  co2: Co2State;
  thermal: ThermalState;
  lastValues: {
    ph: number | null;
    co2: number | null;
    solarOutput: number | null;
  };
}

// ── State Initialization ──────────────────────────────────────────
const state: EngineState = {
  ph: { status: "IDLE" },
  co2: { status: "IDLE" },
  thermal: { status: "IDLE" },
  lastValues: { ph: null, co2: null, solarOutput: null },
};

// ── Command Publisher ─────────────────────────────────────────────
function sendCommand(nodeId: NodeId, actuator: string, actState: ActuatorState): void {
  const topic = buildTopic({ nodeId, type: "command", name: actuator });
  const payload: CommandPayload = { state: actState };
  client.publish(topic, JSON.stringify(payload));
  console.log(`[automation] ${topic} -> ${actState}`);
}

function doserName(direction: "low" | "high"): string {
  return direction === "low" ? "ph_up_doser" : "ph_down_doser";
}

// ── pH Control Loop (Telemetry-Driven) ────────────────────────────
function handlePhTelemetry(value: number, now: number): void {
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

      // Direction changed — restart timer
      const newDirection: "low" | "high" = value < PH_LOW ? "low" : "high";
      if (newDirection !== state.ph.direction) {
        state.ph = { status: "VIOLATION_DETECTED", direction: newDirection, since: now };
        return;
      }

      // Check if sustained long enough
      if (now - state.ph.since >= PH_VIOLATION_MS) {
        const doser = doserName(state.ph.direction);
        sendCommand("node_a", doser, "ON");
        state.ph = { status: "DOSING", direction: state.ph.direction, startedAt: now };
        console.log(`[automation] pH dosing started: ${doser} ON`);
      }
      break;
    }
    // DOSING and COOLDOWN are tick-driven — ignore telemetry
    case "DOSING":
    case "COOLDOWN":
      break;
  }
}

// ── pH Control Loop (Tick-Driven) ─────────────────────────────────
function tickPh(now: number): void {
  switch (state.ph.status) {
    case "DOSING": {
      if (now - state.ph.startedAt >= PH_DOSE_MS) {
        const doser = doserName(state.ph.direction);
        sendCommand("node_a", doser, "OFF");
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

// ── CO2 Control Loop (Telemetry-Driven) ───────────────────────────
function handleCo2(value: number): void {
  switch (state.co2.status) {
    case "IDLE": {
      if (value > CO2_HIGH) {
        sendCommand("node_b", "exhaust_fan", "ON");
        state.co2 = { status: "PURGING" };
        console.log(`[automation] CO2 high (${value} ppm), exhaust fan ON`);
      }
      break;
    }
    case "PURGING": {
      if (value < CO2_LOW) {
        sendCommand("node_b", "exhaust_fan", "OFF");
        state.co2 = { status: "IDLE" };
        console.log(`[automation] CO2 normalized (${value} ppm), exhaust fan OFF`);
      }
      break;
    }
  }
}

// ── Thermal Battery Control Loop (Tick-Driven) ────────────────────
function tickThermal(now: number): void {
  const hour = new Date(now).getHours();
  const solar = state.lastValues.solarOutput;
  const inChillWindow = hour >= CHILL_START_HOUR && hour < CHILL_END_HOUR;
  const inCirculateWindow = hour >= CIRCULATE_START_HOUR || hour < CIRCULATE_END_HOUR;

  switch (state.thermal.status) {
    case "IDLE": {
      if (inChillWindow && solar !== null && solar > SOLAR_THRESHOLD) {
        sendCommand("node_c", "chiller", "ON");
        state.thermal = { status: "CHILLING" };
        console.log(`[automation] Thermal: chilling started (solar at ${solar}%)`);
      } else if (inCirculateWindow) {
        sendCommand("node_c", "chiller", "OFF");
        sendCommand("node_c", "thermal_pump", "ON");
        state.thermal = { status: "CIRCULATING" };
        console.log("[automation] Thermal: circulation started");
      }
      break;
    }
    case "CHILLING": {
      if (inCirculateWindow) {
        sendCommand("node_c", "chiller", "OFF");
        sendCommand("node_c", "thermal_pump", "ON");
        state.thermal = { status: "CIRCULATING" };
        console.log("[automation] Thermal: chilling -> circulation");
      } else if (!inChillWindow) {
        sendCommand("node_c", "chiller", "OFF");
        state.thermal = { status: "IDLE" };
        console.log("[automation] Thermal: chilling window ended");
      }
      break;
    }
    case "CIRCULATING": {
      if (!inCirculateWindow) {
        sendCommand("node_c", "thermal_pump", "OFF");
        state.thermal = { status: "IDLE" };
        console.log("[automation] Thermal: circulation ended");
      }
      break;
    }
  }
}

// ── MQTT Client ───────────────────────────────────────────────────
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log(`[automation] Connected to MQTT broker at ${MQTT_BROKER}`);
  client.subscribe("farm/+/telemetry/#");
});

client.on("message", (topic: string, message: Buffer) => {
  const parsed = parseTopic(topic);
  if (!parsed || parsed.type !== "telemetry") return;

  try {
    const payload: TelemetryPayload = JSON.parse(message.toString());
    const now = Date.now();

    if (parsed.nodeId === "node_a" && parsed.name === "ph_level") {
      state.lastValues.ph = payload.value;
      handlePhTelemetry(payload.value, now);
    } else if (parsed.nodeId === "node_b" && parsed.name === "co2") {
      state.lastValues.co2 = payload.value;
      handleCo2(payload.value);
    } else if (parsed.nodeId === "node_c" && parsed.name === "solar_output") {
      state.lastValues.solarOutput = payload.value;
    }
  } catch (err) {
    console.error(`[automation] Failed to process ${topic}:`, err);
  }
});

client.on("error", (err) => {
  console.error("[automation] MQTT error:", err);
});

// ── Tick Interval ─────────────────────────────────────────────────
const tickTimer = setInterval(() => {
  const now = Date.now();
  tickPh(now);
  tickThermal(now);
}, TICK_INTERVAL_MS);

// ── Health Check & Status Server ──────────────────────────────────
Bun.serve({
  port: PORT,
  routes: {
    "/health": new Response("ok"),
  },
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/status") {
      return new Response(
        JSON.stringify(
          {
            loops: {
              ph: state.ph,
              co2: state.co2,
              thermal: state.thermal,
            },
            lastValues: state.lastValues,
            uptime: process.uptime(),
          },
          null,
          2
        ),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
});

// ── Graceful Shutdown ─────────────────────────────────────────────
process.on("SIGINT", () => {
  console.log("[automation] Shutting down — turning off all actuators...");
  clearInterval(tickTimer);

  sendCommand("node_a", "ph_up_doser", "OFF");
  sendCommand("node_a", "ph_down_doser", "OFF");
  sendCommand("node_b", "exhaust_fan", "OFF");
  sendCommand("node_c", "chiller", "OFF");
  sendCommand("node_c", "thermal_pump", "OFF");

  client.end();
  process.exit(0);
});

console.log(`[automation] Running on port ${PORT}`);
