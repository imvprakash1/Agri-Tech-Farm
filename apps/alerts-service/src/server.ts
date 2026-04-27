import { type NodeId, NODE_LABELS } from "@repo/types";
import { ALL_NODES } from "./config.js";
import { violationStartMap, lastAlertMap, lastSeenMap, nodeOfflineAlerted } from "./state.js";
import { rules } from "./threshold-engine.js";

/** Start the HTTP health check, rules, and status server. */
export function startServer(port: number): void {
  Bun.serve({
    port,
    routes: {
      "/health": new Response("ok"),
      "/rules": new Response(JSON.stringify(rules, null, 2), {
        headers: { "Content-Type": "application/json" },
      }),
    },
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/status") {
        const status = {
          nodes: Object.fromEntries(
            ALL_NODES.map((id: NodeId) => [
              id,
              {
                label: NODE_LABELS[id],
                lastSeen: lastSeenMap.get(id) ?? null,
                offlineAlerted: nodeOfflineAlerted.get(id) ?? false,
              },
            ])
          ),
          activeViolations: Object.fromEntries(violationStartMap),
          recentAlerts: Object.fromEntries(lastAlertMap),
        };
        return new Response(JSON.stringify(status, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Not Found", { status: 404 });
    },
  });
  console.log(`[alerts-service] Running on port ${port}`);
}
