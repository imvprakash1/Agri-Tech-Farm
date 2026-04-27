import { NODE_LABELS } from "@repo/types";
import { state } from "./state.js";
import { PORT } from "./config.js";

/** Start the HTTP health check and status server. */
export function startServer(): void {
  Bun.serve({
    port: PORT,
    routes: {
      "/health": new Response("ok"),
    },
    fetch(req) {
      const url = new URL(req.url);
      if (url.pathname === "/status") {
        return new Response(
          JSON.stringify(
            { loops: { ph: state.ph, co2: state.co2, thermal: state.thermal }, lastValues: state.lastValues, uptime: process.uptime() },
            null,
            2
          ),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not Found", { status: 404 });
    },
  });
  console.log(`[automation] Running on port ${PORT}`);
}
