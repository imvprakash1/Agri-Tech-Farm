"use client";

import { useDashboardData } from "@/app/hooks/use-dashboard-data";
import { timeAgo, parseViolationKey } from "@/app/lib/utils";

export function AlertBanner() {
  const { alerts: { data, error, isLoading } } = useDashboardData();

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
        const { nodeLabel, sensor } = parseViolationKey(key);
        return (
          <div key={key} className="flex items-center justify-between text-xs">
            <span>
              <span className="text-foreground font-medium">{nodeLabel}</span>
              <span className="text-text-muted"> / {sensor}</span>
            </span>
            <span className="text-text-muted font-mono">{timeAgo(since)}</span>
          </div>
        );
      })}
    </div>
  );
}
