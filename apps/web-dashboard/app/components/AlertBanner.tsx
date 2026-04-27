"use client";

import { usePolling } from "@/app/hooks/use-polling";
import { POLLING_INTERVAL_MS, NODE_LABELS } from "@/app/lib/constants";
import type { AlertsStatusResponse } from "@/app/lib/types";
import type { NodeId } from "@repo/types";

function parseViolationKey(key: string): { node: string; sensor: string } {
  const [nodeId, sensor] = key.split(":");
  const node = NODE_LABELS[nodeId as NodeId] ?? nodeId;
  return { node, sensor: sensor ?? key };
}

function timeAgo(ms: number): string {
  const sec = Math.round((Date.now() - ms) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}

export function AlertBanner() {
  const { data, error, isLoading } = usePolling<AlertsStatusResponse>(
    "/api/alerts",
    POLLING_INTERVAL_MS
  );

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-raised border border-border p-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-32" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl bg-surface-raised border border-border p-4">
        <p className="text-sm text-text-muted">Alerts service unavailable</p>
      </div>
    );
  }

  const violations = Object.entries(data.activeViolations);

  if (violations.length === 0) {
    return (
      <div className="rounded-xl bg-surface-raised border border-status-ok/20 p-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-status-ok" />
          <p className="text-sm text-status-ok font-medium">All systems normal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-raised border border-status-critical/30 p-4 space-y-2">
      <h3 className="text-sm font-semibold text-status-critical">
        Active Violations ({violations.length})
      </h3>
      {violations.map(([key, since]) => {
        const { node, sensor } = parseViolationKey(key);
        return (
          <div key={key} className="flex items-center justify-between text-xs">
            <span>
              <span className="text-foreground font-medium">{node}</span>
              <span className="text-text-muted"> / {sensor}</span>
            </span>
            <span className="text-text-muted font-mono">{timeAgo(since)}</span>
          </div>
        );
      })}
    </div>
  );
}
