import type { NodeId } from "@repo/types";
import { NODE_LABELS } from "@repo/types";

export const POLLING_INTERVAL_MS = 5_000;

export const ALL_NODES: NodeId[] = ["node_a", "node_b", "node_c", "node_d"];

export const NODE_DESCRIPTIONS: Record<NodeId, string> = {
  node_a: "pH dosing, vertical racks, fish tanks",
  node_b: "Saffron crocus, mushroom logs, climate control",
  node_c: "Solar array, thermal battery, water storage",
  node_d: "Milking parlor, biogas digester",
};

export const NODE_SENSORS: Record<NodeId, string[]> = {
  node_a: ["ph_level", "tds", "npk", "water_flow", "temperature", "humidity"],
  node_b: ["temperature", "co2", "substrate_moisture"],
  node_c: ["water_level", "solar_output", "voltage"],
  node_d: ["methane", "digester_temp"],
};

export const NODE_TIMEOUT_MS = 300_000; // 5 min — same as alerts-service

export { NODE_LABELS };
