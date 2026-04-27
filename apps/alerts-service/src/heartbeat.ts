import { type Alert, NODE_LABELS } from "@repo/types";
import { ALL_NODES, NODE_TIMEOUT_MS } from "./config.js";
import { lastSeenMap, nodeOfflineAlerted } from "./state.js";
import { dispatchAlert } from "./telegram.js";

/**
 * Check node liveness and fire alerts for nodes that have gone silent.
 *
 * Called on a timer (HEARTBEAT_INTERVAL_MS, default 1 min).
 * Skips nodes that have never been seen (prevents false alerts on cold start).
 * Fires a one-shot critical alert per node -- won't re-fire until the node recovers.
 */
export function checkHeartbeats(): void {
  const now = Date.now();

  for (const nodeId of ALL_NODES) {
    const lastSeen = lastSeenMap.get(nodeId);
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
