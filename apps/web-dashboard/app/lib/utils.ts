import type { NodeId } from "@repo/types";
import { NODE_LABELS, NODE_TIMEOUT_MS } from "./constants";

/** Format a millisecond timestamp as a relative time string (e.g., "3m ago"). */
export function timeAgo(ms: number | null): string {
  if (ms === null) return "Never connected";
  const sec = Math.round((Date.now() - ms) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

/** Determine node online/offline status from its last-seen timestamp. */
export function getNodeStatus(lastSeen: number | null): "online" | "offline" | "unknown" {
  if (lastSeen === null) return "unknown";
  return Date.now() - lastSeen < NODE_TIMEOUT_MS ? "online" : "offline";
}

/** Parse a "nodeId:sensor" violation key into display-friendly names. */
export function parseViolationKey(key: string): { nodeLabel: string; sensor: string } {
  const [nodeId, sensor] = key.split(":");
  const nodeLabel = NODE_LABELS[nodeId as NodeId] ?? nodeId ?? key;
  return { nodeLabel, sensor: sensor ?? key };
}
