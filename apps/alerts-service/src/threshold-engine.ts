import { type Alert, type ThresholdRule, type NodeId, DEFAULT_THRESHOLDS } from "@repo/types";
import { ALERT_COOLDOWN_MS } from "./config.js";
import { violationStartMap, lastAlertMap, lastSeenMap, nodeOfflineAlerted } from "./state.js";
import { dispatchAlert } from "./telegram.js";

/** Default threshold rules derived from the technical spec. */
export const rules: ThresholdRule[] = [
  { sensor: "ph_level", node: "node_a", min: DEFAULT_THRESHOLDS.PH_LOW, max: DEFAULT_THRESHOLDS.PH_HIGH, severity: "critical", durationMs: 300_000 },
  { sensor: "co2", node: "node_b", max: DEFAULT_THRESHOLDS.CO2_HIGH, severity: "warning" },
  { sensor: "water_level", node: "node_c", min: 10, severity: "critical" },
  { sensor: "temperature", node: "node_b", min: 10, max: 15, severity: "critical" },
];

function buildMessage(sensor: string, value: number, threshold: number, rule: ThresholdRule): string {
  const direction = rule.min !== undefined && value < rule.min ? "below minimum" : "above maximum";
  const duration = rule.durationMs ? ` (sustained ${Math.round(rule.durationMs / 60_000)}m)` : "";
  return `${sensor} at ${value} is ${direction} ${threshold}${duration}`;
}

/**
 * Evaluate an incoming telemetry reading against all matching threshold rules.
 *
 * For rules with durationMs: tracks when the violation started and only fires
 * after sustained violation. For instant rules: fires immediately.
 * Deduplication prevents re-firing within ALERT_COOLDOWN_MS (15 min default).
 * Resets the violation timer when the value returns to normal.
 */
export function evaluateTelemetry(nodeId: NodeId, sensor: string, value: number): void {
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
      if (rule.durationMs) {
        const start = violationStartMap.get(key);
        if (!start) {
          violationStartMap.set(key, Date.now());
          return;
        }
        if (Date.now() - start < rule.durationMs) {
          return;
        }
      }

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
      violationStartMap.delete(key);
    }
  }
}
