import type { NodeId, AlertSeverity } from "@repo/types";

export interface NodeStatus {
  label: string;
  lastSeen: number | null;
  offlineAlerted: boolean;
}

export interface AlertsStatusResponse {
  nodes: Record<NodeId, NodeStatus>;
  activeViolations: Record<string, number>;
  recentAlerts: Record<string, number>;
}

export type AlertRulesResponse = Array<{
  sensor: string;
  node: NodeId;
  min?: number;
  max?: number;
  severity: AlertSeverity;
  durationMs?: number;
}>;

export interface AutomationStatusResponse {
  loops: {
    ph: { status: string; direction?: string; since?: number; startedAt?: number; until?: number };
    co2: { status: string };
    thermal: { status: string };
  };
  lastValues: {
    ph: number | null;
    co2: number | null;
    solarOutput: number | null;
  };
  uptime: number;
}
