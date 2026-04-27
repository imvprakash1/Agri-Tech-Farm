import mqtt from "mqtt";
import {
  type Alert,
  type ThresholdRule,
  type TelemetryPayload,
  type NodeId,
  NODE_LABELS,
  parseTopic,
} from "@repo/types";

// ── Configuration ─────────────────────────────────────────────────
const MQTT_BROKER = process.env.MQTT_BROKER ?? "mqtt://localhost:1883";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
const ALERT_COOLDOWN_MS = Number(process.env.ALERT_COOLDOWN_MS ?? 900_000); // 15 min
const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS ?? 60_000); // 1 min
const NODE_TIMEOUT_MS = Number(process.env.NODE_TIMEOUT_MS ?? 300_000); // 5 min

const ALL_NODES: NodeId[] = ["node_a", "node_b", "node_c", "node_d"];

// ── Default Threshold Rules (from technical spec) ─────────────────
const rules: ThresholdRule[] = [
  { sensor: "ph_level", node: "node_a", min: 6.0, max: 8.5, severity: "critical", durationMs: 300_000 },
  { sensor: "co2", node: "node_b", max: 1000, severity: "warning" },
  { sensor: "water_level", node: "node_c", min: 10, severity: "critical" },
  { sensor: "temperature", node: "node_b", min: 10, max: 15, severity: "critical" },
];

// ── In-Memory State ───────────────────────────────────────────────
const violationStartMap = new Map<string, number>(); // key: "node:sensor" → when violation began
const lastAlertMap = new Map<string, number>();       // key: "node:sensor" → last dispatch time
const lastSeenMap = new Map<string, number>();        // key: NodeId → last MQTT message time
const nodeOfflineAlerted = new Map<string, boolean>(); // key: NodeId → already fired offline alert?

// ── Alert Message Builder ─────────────────────────────────────────
function buildMessage(sensor: string, value: number, threshold: number, rule: ThresholdRule): string {
  const direction = rule.min !== undefined && value < rule.min ? "below minimum" : "above maximum";
  const duration = rule.durationMs ? ` (sustained ${Math.round(rule.durationMs / 60_000)}m)` : "";
  return `${sensor} at ${value} is ${direction} ${threshold}${duration}`;
}

// ── Alert Dispatcher ──────────────────────────────────────────────
async function dispatchAlert(alert: Alert): Promise<void> {
  const label = NODE_LABELS[alert.node];
  console.log(
    `[ALERT][${alert.severity.toUpperCase()}] ${label} - ${alert.sensor}: ${alert.message} (value: ${alert.value}, threshold: ${alert.threshold})`
  );

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const icon = alert.severity === "critical" ? "\u{1F6A8}" : "\u26A0\uFE0F";
    const text = [
      `${icon} *Farm Alert*`,
      `*Severity:* ${alert.severity.toUpperCase()}`,
      `*Zone:* ${label}`,
      `*Sensor:* ${alert.sensor}`,
      `*Message:* ${alert.message}`,
      `*Value:* ${alert.value}`,
      `*Time:* ${new Date(alert.timestamp * 1000).toLocaleString()}`,
    ].join("\n");

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
        }
      );
      if (!res.ok) {
        console.error(`[alerts-service] Telegram API error: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.error("[alerts-service] Telegram dispatch failed:", err);
    }
  }
}

// ── Threshold Evaluation Engine ───────────────────────────────────
function evaluateTelemetry(nodeId: NodeId, sensor: string, value: number): void {
  // Update node liveness
  lastSeenMap.set(nodeId, Date.now());
  nodeOfflineAlerted.set(nodeId, false);

  const matching = rules.filter((r) => r.sensor === sensor && r.node === nodeId);
  if (matching.length === 0) return;

  for (const rule of matching) {
    const key = `${nodeId}:${sensor}`;
    let violated = false;
    let thresholdValue = 0;

    if (rule.min !== undefined && value < rule.min) {
      violated = true;
      thresholdValue = rule.min;
    } else if (rule.max !== undefined && value > rule.max) {
      violated = true;
      thresholdValue = rule.max;
    }

    if (violated) {
      // Duration-based: track start, only fire after sustained violation
      if (rule.durationMs) {
        const start = violationStartMap.get(key);
        if (!start) {
          violationStartMap.set(key, Date.now());
          return; // just started, wait
        }
        if (Date.now() - start < rule.durationMs) {
          return; // still within grace period
        }
      }

      // Deduplication: skip if recently alerted
      const lastFired = lastAlertMap.get(key);
      if (lastFired && Date.now() - lastFired < ALERT_COOLDOWN_MS) {
        return;
      }

      const alert: Alert = {
        id: `${key}:${Date.now()}`,
        severity: rule.severity,
        node: nodeId,
        sensor,
        message: buildMessage(sensor, value, thresholdValue, rule),
        value,
        threshold: thresholdValue,
        timestamp: Math.floor(Date.now() / 1000),
      };

      dispatchAlert(alert);
      lastAlertMap.set(key, Date.now());
    } else {
      // Value returned to normal — reset sustained violation timer
      violationStartMap.delete(key);
    }
  }
}

// ── Node Heartbeat Monitor ────────────────────────────────────────
function checkHeartbeats(): void {
  const now = Date.now();

  for (const nodeId of ALL_NODES) {
    const lastSeen = lastSeenMap.get(nodeId);

    // Skip nodes we've never heard from (prevents false alerts on cold start)
    if (lastSeen === undefined) continue;

    const elapsed = now - lastSeen;

    if (elapsed > NODE_TIMEOUT_MS) {
      if (nodeOfflineAlerted.get(nodeId)) continue;

      const alert: Alert = {
        id: `${nodeId}:heartbeat:${now}`,
        severity: "critical",
        node: nodeId,
        sensor: "heartbeat",
        message: `${NODE_LABELS[nodeId]} has not sent data for ${Math.round(elapsed / 60_000)} minutes`,
        value: elapsed,
        threshold: NODE_TIMEOUT_MS,
        timestamp: Math.floor(now / 1000),
      };

      dispatchAlert(alert);
      nodeOfflineAlerted.set(nodeId, true);
    }
  }
}

// ── MQTT Client ───────────────────────────────────────────────────
const client = mqtt.connect(MQTT_BROKER);

client.on("connect", () => {
  console.log(`[alerts-service] Connected to MQTT broker at ${MQTT_BROKER}`);
  client.subscribe("farm/+/telemetry/#");
});

client.on("message", (topic: string, message: Buffer) => {
  const parsed = parseTopic(topic);
  if (!parsed || parsed.type !== "telemetry") return;

  try {
    const payload: TelemetryPayload = JSON.parse(message.toString());
    evaluateTelemetry(parsed.nodeId, parsed.name, payload.value);
  } catch (err) {
    console.error(`[alerts-service] Failed to process ${topic}:`, err);
  }
});

client.on("error", (err) => {
  console.error("[alerts-service] MQTT error:", err);
});

// ── Heartbeat Interval ────────────────────────────────────────────
const heartbeatTimer = setInterval(checkHeartbeats, HEARTBEAT_INTERVAL_MS);

// ── Health Check & Status Server ──────────────────────────────────
Bun.serve({
  port: Number(process.env.PORT ?? 3001),
  routes: {
    "/health": new Response("ok"),
    "/rules": new Response(JSON.stringify(rules, null, 2), {
      headers: { "Content-Type": "application/json" },
    }),
  },
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/status") {
      const status = {
        nodes: Object.fromEntries(
          ALL_NODES.map((id) => [
            id,
            {
              label: NODE_LABELS[id],
              lastSeen: lastSeenMap.get(id) ?? null,
              offlineAlerted: nodeOfflineAlerted.get(id) ?? false,
            },
          ])
        ),
        activeViolations: Object.fromEntries(violationStartMap),
        recentAlerts: Object.fromEntries(lastAlertMap),
      };
      return new Response(JSON.stringify(status, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

// ── Graceful Shutdown ─────────────────────────────────────────────
process.on("SIGINT", () => {
  console.log("[alerts-service] Shutting down...");
  clearInterval(heartbeatTimer);
  client.end();
  process.exit(0);
});

console.log(`[alerts-service] Running on port ${process.env.PORT ?? 3001}`);

export { rules, dispatchAlert };
