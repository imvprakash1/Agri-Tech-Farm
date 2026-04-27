# Agri-Tech Farm

Autonomous 1-acre farm management platform. Bun + Turborepo monorepo powering IoT sensor ingestion, real-time dashboards, and automated alerting.

## Architecture

```
ESP32 Sensors ──MQTT──▶ iot-gateway ──▶ InfluxDB ──▶ Grafana
                  │
                  ├───▶ alerts-service ──▶ Telegram
                  │
                  └───▶ automation-engine ──MQTT──▶ ESP32 Actuators
                              │
                              ▼
                       web-dashboard (Next.js)
```

## Apps & Packages

| Name | Path | Port | Description |
|---|---|---|---|
| **iot-gateway** | `apps/iot-gateway` | -- | MQTT-to-InfluxDB ingestion service |
| **alerts-service** | `apps/alerts-service` | 3001 | Threshold-based alerting with Telegram dispatch |
| **automation-engine** | `apps/automation-engine` | 3002 | pH balancing, CO2 purge, and thermal battery control loops |
| **web-dashboard** | `apps/web-dashboard` | 3000 | Next.js dashboard for farm monitoring and control |
| **@repo/types** | `packages/types` | -- | Shared TypeScript types for sensors, MQTT topics, and alerts |
| **@repo/ui** | `packages/ui` | -- | Shared React component library |
| **@repo/typescript-config** | `packages/typescript-config` | -- | Shared `tsconfig.json` presets |
| **@repo/eslint-config** | `packages/eslint-config` | -- | Shared ESLint configuration |

## Prerequisites

- [Bun](https://bun.sh) >= 1.3
- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

## Quick Start

```bash
# 1. Start infrastructure (Mosquitto, InfluxDB, Grafana)
bun run infra:up

# 2. Install dependencies
bun install

# 3. Copy environment files (defaults work out of the box)
cp apps/iot-gateway/.env.example apps/iot-gateway/.env
cp apps/alerts-service/.env.example apps/alerts-service/.env
cp apps/automation-engine/.env.example apps/automation-engine/.env
cp apps/web-dashboard/.env.example apps/web-dashboard/.env

# 4. Run all services in dev mode
bun run dev

# 5. Stop infrastructure when done
bun run infra:down
```

## Infrastructure Services

| Service | URL | Credentials |
|---|---|---|
| Mosquitto MQTT | `mqtt://localhost:1883` | Anonymous (no auth) |
| InfluxDB | `http://localhost:8086` | admin / adminpassword |
| Grafana | `http://localhost:3003` | admin / admin |

Grafana comes pre-configured with an InfluxDB datasource and a Farm Overview dashboard.

## Environment Variables

Each app has a `.env.example` file with all variables documented. Copy it to `.env` to get started.

### iot-gateway (`apps/iot-gateway/.env`)

| Variable | Default | Description |
|---|---|---|
| `MQTT_BROKER` | `mqtt://localhost:1883` | MQTT broker URL |
| `INFLUX_URL` | `http://localhost:8086` | InfluxDB HTTP API URL |
| `INFLUX_TOKEN` | `dev-token-agritech-local` | InfluxDB API token |
| `INFLUX_ORG` | `agritech` | InfluxDB organization |
| `INFLUX_BUCKET` | `agritech_production` | InfluxDB bucket name |

### alerts-service (`apps/alerts-service/.env`)

| Variable | Default | Description |
|---|---|---|
| `MQTT_BROKER` | `mqtt://localhost:1883` | MQTT broker URL |
| `PORT` | `3001` | HTTP server port |
| `TELEGRAM_BOT_TOKEN` | *(empty)* | Telegram bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | *(empty)* | Telegram chat ID for alert delivery |
| `ALERT_COOLDOWN_MS` | `900000` | Alert deduplication cooldown (15 min) |
| `HEARTBEAT_INTERVAL_MS` | `60000` | Heartbeat check interval (1 min) |
| `NODE_TIMEOUT_MS` | `300000` | Node offline timeout (5 min) |

### automation-engine (`apps/automation-engine/.env`)

| Variable | Default | Description |
|---|---|---|
| `MQTT_BROKER` | `mqtt://localhost:1883` | MQTT broker URL |
| `PORT` | `3002` | HTTP server port |
| `PH_LOW` / `PH_HIGH` | `6.0` / `8.5` | pH safe range |
| `PH_VIOLATION_MS` | `300000` | Sustained violation before dosing (5 min) |
| `PH_DOSE_MS` | `5000` | Doser activation duration (5 sec) |
| `PH_COOLDOWN_MS` | `600000` | Post-dose cooldown (10 min) |
| `CO2_HIGH` / `CO2_LOW` | `1000` / `600` | CO2 purge thresholds (ppm) |
| `SOLAR_THRESHOLD` | `80` | Min solar output to start chilling (%) |
| `CHILL_START_HOUR` / `CHILL_END_HOUR` | `12` / `15` | Chilling window (24h) |
| `CIRCULATE_START_HOUR` / `CIRCULATE_END_HOUR` | `20` / `6` | Circulation window (24h) |
| `TICK_INTERVAL_MS` | `10000` | State machine tick interval (10 sec) |

### web-dashboard (`apps/web-dashboard/.env`)

| Variable | Default | Description |
|---|---|---|
| `ALERTS_SERVICE_URL` | `http://localhost:3001` | Alerts service base URL |
| `AUTOMATION_ENGINE_URL` | `http://localhost:3002` | Automation engine base URL |

## Farm Nodes

| Node | Zone | Key Sensors |
|---|---|---|
| **Node A** | Aquaponics & Vertical Farm | pH, TDS/EC, NPK, Water Flow, Temp/Humidity |
| **Node B** | Underground Bunkers (Saffron & Mushrooms) | PT100 Temp, CO2, Substrate Moisture |
| **Node C** | Utility & Energy Hub | Ultrasonic Water Level, Voltage/Current |
| **Node D** | Dairy & Biogas Complex | Methane Gas, Digester Temp |

## Useful Commands

```bash
# Run a specific app
bunx turbo dev --filter=iot-gateway

# Type-check the entire repo
bun run check-types

# Run tests
bunx turbo test

# View infrastructure logs
docker compose logs -f

# Reset infrastructure (destroys all data)
docker compose down -v
```

## Documentation

- [Master Plan](docs/master-plan.md) -- Physical layout, integrated resource loops, spatial allocations
- [Financials](docs/financials.md) -- Phase-wise budget, founder contributions, government subsidies
- [Technical Specs](docs/technical-specs.md) -- IoT sensor map, MQTT topics, InfluxDB schema
- [Business Setup](docs/business-setup.md) -- LLP structure and departmental breakdown
