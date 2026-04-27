import type { NodeId } from "@repo/types";

export const MQTT_BROKER = process.env.MQTT_BROKER ?? "mqtt://localhost:1883";
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
export const ALERT_COOLDOWN_MS = Number(process.env.ALERT_COOLDOWN_MS ?? 900_000);
export const HEARTBEAT_INTERVAL_MS = Number(process.env.HEARTBEAT_INTERVAL_MS ?? 60_000);
export const NODE_TIMEOUT_MS = Number(process.env.NODE_TIMEOUT_MS ?? 300_000);
export const ALL_NODES: NodeId[] = ["node_a", "node_b", "node_c", "node_d"];
