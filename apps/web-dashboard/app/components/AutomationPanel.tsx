"use client";

import { useDashboardData } from "@/app/hooks/use-dashboard-data";
import { LoopStatusBadge } from "./LoopStatusBadge";
import { MetricDisplay } from "./MetricDisplay";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function AutomationPanel() {
  const { automation: { data, error, isLoading } } = useDashboardData();

  if (isLoading) {
    return (
      <div className="rounded-xl bg-surface-raised border border-border p-5 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-40 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-16 bg-zinc-800 rounded" />
          <div className="h-16 bg-zinc-800 rounded" />
          <div className="h-16 bg-zinc-800 rounded" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl bg-surface-raised border border-border p-5">
        <p className="text-sm text-text-muted">Automation engine unavailable</p>
      </div>
    );
  }

  const loops = data?.loops;
  const values = data?.lastValues;

  return (
    <div className="rounded-xl bg-surface-raised border border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Automation Engine</h3>
        {data && (
          <span className="text-xs font-mono text-text-muted">
            uptime {formatUptime(data.uptime)}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-status-warn">Using stale data — engine unavailable</p>
      )}

      <div className="flex flex-wrap gap-4">
        <LoopStatusBadge loopName="pH Balancer" status={loops?.ph.status ?? "UNKNOWN"} />
        <LoopStatusBadge loopName="CO2 Purge" status={loops?.co2.status ?? "UNKNOWN"} />
        <LoopStatusBadge loopName="Thermal Battery" status={loops?.thermal.status ?? "UNKNOWN"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricDisplay
          label="pH Level (Node A)"
          value={values?.ph ?? null}
          unit="pH"
          status={values?.ph != null && (values.ph < 6.0 || values.ph > 8.5) ? "critical" : "normal"}
        />
        <MetricDisplay
          label="CO2 (Node B)"
          value={values?.co2 ?? null}
          unit="ppm"
          status={values?.co2 != null && values.co2 > 1000 ? "warning" : "normal"}
        />
        <MetricDisplay
          label="Solar Output (Node C)"
          value={values?.solarOutput ?? null}
          unit="%"
          status="normal"
        />
      </div>
    </div>
  );
}
