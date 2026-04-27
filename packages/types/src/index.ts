// ── Farm Node Identifiers ──────────────────────────────────────────
export type NodeId = "node_a" | "node_b" | "node_c" | "node_d";

// ── MQTT Topic Helpers ─────────────────────────────────────────────
export type MqttTopicType = "telemetry" | "command" | "status";

export interface MqttTopic {
  nodeId: NodeId;
  type: MqttTopicType;
  name: string;
}

export function buildTopic({ nodeId, type, name }: MqttTopic): string {
  return `farm/${nodeId}/${type}/${name}`;
}

export function parseTopic(topic: string): MqttTopic | null {
  const parts = topic.split("/");
  if (parts.length !== 4 || parts[0] !== "farm") return null;
  return {
    nodeId: parts[1] as NodeId,
    type: parts[2] as MqttTopicType,
    name: parts[3]!,
  };
}

// ── Sensor Telemetry Payloads ──────────────────────────────────────
export interface TelemetryPayload {
  value: number;
  timestamp: number;
}

export interface EnvironmentReading {
  node: NodeId;
  location: string;
  temperature: number;
  humidity: number;
  co2?: number;
}

export interface WaterQualityReading {
  node: NodeId;
  source: string;
  ph: number;
  tds: number;
  nitrogen?: number;
}

// ── Actuator Command Payloads ──────────────────────────────────────
export type ActuatorState = "ON" | "OFF";

export interface CommandPayload {
  state: ActuatorState;
}

export interface SystemStatusReading {
  node: NodeId;
  device: string;
  state: 0 | 1;
}

// ── Alert Types ────────────────────────────────────────────────────
export type AlertSeverity = "info" | "warning" | "critical";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  node: NodeId;
  sensor: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

// ── Threshold Configuration ────────────────────────────────────────
export interface ThresholdRule {
  sensor: string;
  node: NodeId;
  min?: number;
  max?: number;
  severity: AlertSeverity;
  durationMs?: number;
}

// ── Node Hardware Maps (from technical spec) ───────────────────────
export const NODE_LABELS: Record<NodeId, string> = {
  node_a: "Aquaponics & Vertical Farm",
  node_b: "Underground Bunkers (Saffron & Mushrooms)",
  node_c: "Utility & Energy Hub",
  node_d: "Dairy & Biogas Complex",
};
