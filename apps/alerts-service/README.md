# alerts-service

Threshold-based alerting with Telegram dispatch and node heartbeat monitoring. Subscribes to MQTT telemetry, evaluates against configurable rules, and fires alerts when thresholds are violated.

## Data Flow

```
MQTT Telemetry ──> Threshold Engine ──> Alert Dispatch ──> Console + Telegram
                         |
                    Heartbeat Monitor ──> Node Offline Alerts
```

## Module Structure

| File | Purpose |
|---|---|
| `src/index.ts` | Orchestrator -- wires MQTT, heartbeat timer, HTTP server |
| `src/config.ts` | Environment variable reads and defaults |
| `src/state.ts` | In-memory state maps (violations, cooldowns, node liveness) |
| `src/threshold-engine.ts` | Rule matching, sustained violation tracking, deduplication |
| `src/telegram.ts` | Telegram Bot API dispatch with graceful error handling |
| `src/heartbeat.ts` | Node liveness monitoring (fires alert after 5 min silence) |
| `src/server.ts` | HTTP server with /health, /rules, /status endpoints |

## Threshold Rules

| Sensor | Node | Range | Severity | Sustained |
|---|---|---|---|---|
| `ph_level` | node_a | 6.0 - 8.5 | critical | 5 min |
| `co2` | node_b | < 1000 ppm | warning | instant |
| `water_level` | node_c | > 10% | critical | instant |
| `temperature` | node_b | 10 - 15 C | critical | instant |

## Alert Lifecycle

1. Telemetry arrives via MQTT
2. `evaluateTelemetry()` checks value against matching rules
3. For sustained rules: violation must persist for `durationMs` before alerting
4. Deduplication: same sensor+node won't re-fire within `ALERT_COOLDOWN_MS` (15 min)
5. When value returns to normal, the violation timer resets

## Heartbeat Monitoring

- Every `HEARTBEAT_INTERVAL_MS` (1 min), checks last-seen time for each node
- If a node hasn't sent data for `NODE_TIMEOUT_MS` (5 min), fires a critical alert
- Skips nodes never seen (prevents false alerts on cold start)
- One-shot: won't re-fire until the node recovers

## HTTP Endpoints

| Endpoint | Method | Response |
|---|---|---|
| `/health` | GET | `"ok"` |
| `/rules` | GET | JSON array of threshold rules |
| `/status` | GET | JSON with node liveness, active violations, recent alerts |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MQTT_BROKER` | `mqtt://localhost:1883` | MQTT broker URL |
| `PORT` | `3001` | HTTP server port |
| `TELEGRAM_BOT_TOKEN` | *(empty)* | Telegram bot token (empty = console only) |
| `TELEGRAM_CHAT_ID` | *(empty)* | Telegram chat ID for alerts |
| `ALERT_COOLDOWN_MS` | `900000` | Deduplication cooldown (15 min) |
| `HEARTBEAT_INTERVAL_MS` | `60000` | Heartbeat check interval (1 min) |
| `NODE_TIMEOUT_MS` | `300000` | Node offline timeout (5 min) |

## Running

```bash
bunx turbo dev --filter=alerts-service
```
