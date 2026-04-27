# System Architecture

## Overview

The Agri-Tech Farm platform is a localized, edge-computing system that runs on a single server at the farm. It collects sensor data from ESP32 microcontrollers via MQTT, stores time-series telemetry in InfluxDB, and runs autonomous control loops that command actuators back through MQTT.

## System Diagram

```
                           +---------------------------------------------+
                           |              Farm Server                     |
                           |                                             |
  ESP32 Nodes              |   +--------------+    +------------------+  |
  +---------+  telemetry   |   |              |    |                  |  |
  | Node A  |--------------+-->|  Mosquitto   |--->|   iot-gateway    |--+--> InfluxDB --> Grafana
  | Node B  |--------------+-->|  MQTT Broker |--->|                  |  |
  | Node C  |--------------+-->|              |--->+------------------+  |
  | Node D  |--------------+-->|  port 1883   |--->| alerts-service   |--+--> Telegram
  +---------+              |   |              |--->|                  |  |
       ^                   |   |              |--->+------------------+  |
       | commands          |   |              |<--|automation-engine  |  |
       +-------------------+---|              |   |                  |  |
                           |   +--------------+   +--------+---------+  |
                           |                               |            |
                           |                      +--------v---------+  |
                           |                      |  web-dashboard   |  |
                           |                      |  (Next.js)       |  |
                           |                      |  port 3000       |  |
                           |                      +------------------+  |
                           +---------------------------------------------+
```

## Services

| Service | Runtime | Port | Role |
|---|---|---|---|
| **iot-gateway** | Bun | -- | Subscribes to MQTT, writes to InfluxDB |
| **alerts-service** | Bun | 3001 | Threshold monitoring, Telegram alerts, heartbeat |
| **automation-engine** | Bun | 3002 | pH/CO2/thermal control loops, publishes MQTT commands |
| **web-dashboard** | Next.js | 3000 | Monitoring UI, proxies to backend APIs |

## Infrastructure (Docker Compose)

| Service | Image | Port | Purpose |
|---|---|---|---|
| **Mosquitto** | eclipse-mosquitto:2 | 1883 | MQTT message broker |
| **InfluxDB** | influxdb:2 | 8086 | Time-series database |
| **Grafana** | grafana/grafana | 3003 | Historical data visualization |

## Communication Patterns

### MQTT (Pub/Sub)
- **Telemetry:** ESP32 -> Mosquitto -> iot-gateway, alerts-service, automation-engine
- **Commands:** automation-engine -> Mosquitto -> ESP32 actuators
- **Status:** ESP32 -> Mosquitto -> iot-gateway (actuator state confirmations)

### HTTP (Request/Response)
- **web-dashboard -> alerts-service:** `/status`, `/rules` (via API proxy routes)
- **web-dashboard -> automation-engine:** `/status` (via API proxy routes)
- **alerts-service -> Telegram API:** Alert dispatch (outbound only)

## Shared Packages

| Package | Purpose | Consumers |
|---|---|---|
| `@repo/types` | TypeScript types, MQTT helpers, threshold constants | All apps |
| `@repo/mqtt-client` | MQTT connection factory with standard logging | iot-gateway, alerts-service, automation-engine |
| `@repo/ui` | React component library | web-dashboard |
| `@repo/typescript-config` | Shared tsconfig presets | All packages |
| `@repo/eslint-config` | Shared ESLint config | All packages |

## Data Flow

1. **Sensors -> Broker:** ESP32 nodes publish telemetry to `farm/{node}/telemetry/{sensor}` every few seconds
2. **Broker -> Storage:** iot-gateway writes each reading to InfluxDB as a time-series point
3. **Broker -> Alerting:** alerts-service evaluates readings against threshold rules, dispatches alerts
4. **Broker -> Automation:** automation-engine feeds readings into state machines, publishes commands
5. **Dashboard -> Services:** web-dashboard polls alerts-service and automation-engine HTTP APIs every 5 seconds
6. **Grafana -> InfluxDB:** Grafana queries InfluxDB directly for historical charts
