import Link from "next/link";
import type { NodeId } from "@repo/types";
import { StatusIndicator } from "./StatusIndicator";
import { NODE_TIMEOUT_MS } from "@/app/lib/constants";

function getStatus(lastSeen: number | null): "online" | "offline" | "unknown" {
  if (lastSeen === null) return "unknown";
  return Date.now() - lastSeen < NODE_TIMEOUT_MS ? "online" : "offline";
}

function timeAgo(ms: number | null): string {
  if (ms === null) return "Never connected";
  const sec = Math.round((Date.now() - ms) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export function NodeCard({
  nodeId,
  label,
  description,
  lastSeen,
}: {
  nodeId: NodeId;
  label: string;
  description: string;
  lastSeen: number | null;
}) {
  const status = getStatus(lastSeen);

  return (
    <Link
      href={`/nodes/${nodeId}`}
      className="block rounded-xl bg-surface-raised border border-border p-4 transition-colors hover:bg-zinc-800/60"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{label}</h3>
        <StatusIndicator status={status} />
      </div>
      <p className="text-xs text-text-muted mb-3">{description}</p>
      <p className="text-xs font-mono text-text-muted">
        {timeAgo(lastSeen)}
      </p>
    </Link>
  );
}
