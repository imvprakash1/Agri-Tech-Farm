# Agri-Tech Farm

Autonomous 1-acre farm management platform. Bun + Turborepo monorepo powering IoT sensor ingestion, real-time dashboards, and automated alerting.

## Architecture

```
ESP32 Sensors ──MQTT──▶ iot-gateway ──▶ InfluxDB ──▶ Grafana
                              │
                              ▼
                       alerts-service ──▶ Telegram / Twilio
                              │
                              ▼
                       web-dashboard (Next.js)
```

## Apps & Packages

| Name | Path | Description |
|---|---|---|
| **web-dashboard** | `apps/web-dashboard` | Next.js dashboard for farm monitoring and control |
| **iot-gateway** | `apps/iot-gateway` | MQTT-to-InfluxDB ingestion service |
| **alerts-service** | `apps/alerts-service` | Threshold-based alerting with Telegram/Twilio dispatch |
| **@repo/types** | `packages/types` | Shared TypeScript types for sensors, MQTT topics, and alerts |
| **@repo/ui** | `packages/ui` | Shared React component library |
| **@repo/typescript-config** | `packages/typescript-config` | Shared `tsconfig.json` presets |
| **@repo/eslint-config** | `packages/eslint-config` | Shared ESLint configuration |

## Farm Nodes

| Node | Zone | Key Sensors |
|---|---|---|
| **Node A** | Aquaponics & Vertical Farm | pH, TDS/EC, NPK, Water Flow, Temp/Humidity |
| **Node B** | Underground Bunkers (Saffron & Mushrooms) | PT100 Temp, CO2, Substrate Moisture |
| **Node C** | Utility & Energy Hub | Ultrasonic Water Level, Voltage/Current |
| **Node D** | Dairy & Biogas Complex | Methane Gas, Digester Temp |

## Quick Start

```bash
# Install all dependencies
bun install

# Run everything in dev mode
bun run dev

# Run a specific app
bunx turbo dev --filter=iot-gateway

# Type-check the entire repo
bun run check-types

# Run tests
bunx turbo test
```

## Environment Variables

### iot-gateway (`apps/iot-gateway/.env`)

```env
MQTT_BROKER=mqtt://localhost:1883
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=your-token
INFLUX_ORG=agritech
INFLUX_BUCKET=agritech_production
```

### alerts-service (`apps/alerts-service/.env`)

```env
PORT=3001
ALERT_WEBHOOK_URL=https://api.telegram.org/bot<token>/sendMessage
```

## Documentation

- [Master Plan](docs/master-plan.md) -- Physical layout, integrated resource loops, spatial allocations
- [Financials](docs/financials.md) -- Phase-wise budget, founder contributions, government subsidies
- [Technical Specs](docs/technical-specs.md) -- IoT sensor map, MQTT topics, InfluxDB schema
- [Business Setup](docs/business-setup.md) -- LLP structure and departmental breakdown
