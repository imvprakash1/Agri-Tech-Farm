import Link from "next/link";
import type { NodeId } from "@repo/types";
import { StatusIndicator } from "./StatusIndicator";
import { timeAgo, getNodeStatus } from "@/app/lib/utils";

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
  const status = getNodeStatus(lastSeen);

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
