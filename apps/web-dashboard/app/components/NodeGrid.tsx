"use client";

import { useDashboardData } from "@/app/hooks/use-dashboard-data";
import { ALL_NODES, NODE_LABELS, NODE_DESCRIPTIONS } from "@/app/lib/constants";
import { NodeCard } from "./NodeCard";

export function NodeGrid() {
  const { alerts: { data, error, isLoading } } = useDashboardData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ALL_NODES.map((id) => (
          <div key={id} className="rounded-xl bg-surface-raised border border-border p-4 animate-pulse">
            <div className="h-4 bg-zinc-800 rounded w-40 mb-2" />
            <div className="h-3 bg-zinc-800 rounded w-56 mb-3" />
            <div className="h-3 bg-zinc-800 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-status-warn mb-2">
          Using stale data — alerts service unavailable
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ALL_NODES.map((nodeId) => (
          <NodeCard
            key={nodeId}
            nodeId={nodeId}
            label={NODE_LABELS[nodeId]}
            description={NODE_DESCRIPTIONS[nodeId]}
            lastSeen={data?.nodes[nodeId]?.lastSeen ?? null}
          />
        ))}
      </div>
    </div>
  );
}
