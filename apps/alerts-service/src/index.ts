import { type Alert, type ThresholdRule, type NodeId, NODE_LABELS } from "@repo/types";

// ── Default Threshold Rules (from technical spec) ──────────────────
const rules: ThresholdRule[] = [
  { sensor: "ph_level", node: "node_a", min: 6.0, max: 8.5, severity: "critical", durationMs: 300_000 },
  { sensor: "co2", node: "node_b", max: 1000, severity: "warning" },
  { sensor: "water_level", node: "node_c", min: 10, severity: "critical" },
  { sensor: "temperature", node: "node_b", min: 10, max: 15, severity: "critical" },
];

// ── Alert Dispatcher ───────────────────────────────────────────────
async function dispatchAlert(alert: Alert): Promise<void> {
  const label = NODE_LABELS[alert.node];
  console.log(
    `[ALERT][${alert.severity.toUpperCase()}] ${label} - ${alert.sensor}: ${alert.message} (value: ${alert.value}, threshold: ${alert.threshold})`
  );

  // TODO: Integrate Telegram/Twilio HTTP POST
  // const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  // if (webhookUrl) {
  //   await fetch(webhookUrl, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(alert),
  //   });
  // }
}

// ── Health Check Server ────────────────────────────────────────────
Bun.serve({
  port: Number(process.env.PORT ?? 3001),
  routes: {
    "/health": new Response("ok"),
    "/rules": new Response(JSON.stringify(rules, null, 2), {
      headers: { "Content-Type": "application/json" },
    }),
  },
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`[alerts-service] Running on port ${process.env.PORT ?? 3001}`);

export { rules, dispatchAlert };
