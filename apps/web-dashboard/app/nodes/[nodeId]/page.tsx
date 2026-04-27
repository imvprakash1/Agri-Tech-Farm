"use client";

import { use } from "react";
import Link from "next/link";
import type { NodeId } from "@repo/types";
import { usePolling } from "@/app/hooks/use-polling";
import { StatusIndicator } from "@/app/components/StatusIndicator";
import { MetricDisplay } from "@/app/components/MetricDisplay";
import { LoopStatusBadge } from "@/app/components/LoopStatusBadge";
import {
  POLLING_INTERVAL_MS,
  ALL_NODES,
  NODE_LABELS,
  NODE_DESCRIPTIONS,
} from "@/app/lib/constants";
import { timeAgo, getNodeStatus, parseViolationKey } from "@/app/lib/utils";
import type { AlertsStatusResponse, AutomationStatusResponse } from "@/app/lib/types";

export default function NodeDetailPage({
  params,
}: {
  params: Promise<{ nodeId: string }>;
}) {
  const { nodeId } = use(params);

  if (!ALL_NODES.includes(nodeId as NodeId)) {
    return (
      <div className="max-w-3xl">
        <p className="text-text-muted">Unknown node: {nodeId}</p>
        <Link href="/" className="text-accent text-sm mt-2 inline-block">Back to overview</Link>
      </div>
    );
  }

  const id = nodeId as NodeId;

  const { data: alerts } = usePolling<AlertsStatusResponse>("/api/alerts", POLLING_INTERVAL_MS);
  const { data: automation } = usePolling<AutomationStatusResponse>("/api/automation", POLLING_INTERVAL_MS);

  const nodeStatus = alerts?.nodes[id];
  const lastSeen = nodeStatus?.lastSeen ?? null;
  const status = getNodeStatus(lastSeen);

  const violations = alerts?.activeViolations
    ? Object.entries(alerts.activeViolations).filter(([key]) => key.startsWith(`${id}:`))
    : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/" className="text-xs text-text-muted hover:text-foreground transition-colors">
          &larr; Overview
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <StatusIndicator status={status} size="lg" />
        <div>
          <h1 className="text-xl font-bold">{NODE_LABELS[id]}</h1>
          <p className="text-sm text-text-muted">{NODE_DESCRIPTIONS[id]}</p>
        </div>
      </div>

      <div className="rounded-xl bg-surface-raised border border-border p-4">
        <p className="text-xs text-text-muted mb-1">Last Seen</p>
        <p className="text-sm font-mono">{timeAgo(lastSeen)}</p>
      </div>

      {violations.length > 0 && (
        <div className="rounded-xl bg-surface-raised border border-status-critical/30 p-4 space-y-2">
          <h3 className="text-sm font-semibold text-status-critical">
            Active Violations ({violations.length})
          </h3>
          {violations.map(([key, since]) => {
            const { sensor } = parseViolationKey(key);
            return (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="font-medium">{sensor}</span>
                <span className="text-text-muted font-mono">{timeAgo(since)}</span>
              </div>
            );
          })}
        </div>
      )}

      {id === "node_a" && automation && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted">Automation & Sensors</h2>
          <LoopStatusBadge loopName="pH Balancer" status={automation.loops.ph.status} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricDisplay
              label="pH Level"
              value={automation.lastValues.ph}
              unit="pH"
              status={
                automation.lastValues.ph !== null &&
                (automation.lastValues.ph < 6.0 || automation.lastValues.ph > 8.5)
                  ? "critical"
                  : "normal"
              }
            />
          </div>
        </section>
      )}

      {id === "node_b" && automation && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted">Automation & Sensors</h2>
          <LoopStatusBadge loopName="CO2 Purge" status={automation.loops.co2.status} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricDisplay
              label="CO2"
              value={automation.lastValues.co2}
              unit="ppm"
              status={
                automation.lastValues.co2 !== null && automation.lastValues.co2 > 1000
                  ? "warning"
                  : "normal"
              }
            />
          </div>
        </section>
      )}

      {id === "node_c" && automation && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted">Automation & Sensors</h2>
          <LoopStatusBadge loopName="Thermal Battery" status={automation.loops.thermal.status} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricDisplay
              label="Solar Output"
              value={automation.lastValues.solarOutput}
              unit="%"
              status="normal"
            />
          </div>
        </section>
      )}

      {id === "node_d" && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted">Sensors</h2>
          <p className="text-xs text-text-muted">
            No automation loops configured for this node. Methane and digester temperature are monitored via alerts.
          </p>
        </section>
      )}
    </div>
  );
}
