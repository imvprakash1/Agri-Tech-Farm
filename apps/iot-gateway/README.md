# iot-gateway

MQTT-to-InfluxDB ingestion service. Subscribes to sensor telemetry and actuator status topics, writes time-series data points to InfluxDB.

## Data Flow

```
ESP32 Sensors ──MQTT──> iot-gateway ──> InfluxDB
```

## MQTT Subscriptions

| Pattern | Purpose |
|---|---|
| `farm/+/telemetry/#` | Sensor readings from all nodes |
| `farm/+/status/#` | Actuator state confirmations |

## InfluxDB Write Mapping

| MQTT Topic Type | InfluxDB Measurement | Tags | Fields |
|---|---|---|---|
| `telemetry` | Sensor name (e.g., `ph_level`) | `node` | `value` (float) |
| `status` | `system_status` | `node`, `device` | `state` (int: 1=ON, 0=OFF) |

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `MQTT_BROKER` | `mqtt://localhost:1883` | No | MQTT broker URL |
| `INFLUX_URL` | `http://localhost:8086` | No | InfluxDB HTTP API URL |
| `INFLUX_TOKEN` | *(empty)* | **Yes** | InfluxDB API token |
| `INFLUX_ORG` | `agritech` | No | InfluxDB organization |
| `INFLUX_BUCKET` | `agritech_production` | No | InfluxDB bucket name |

## Running

```bash
# Dev mode (hot reload)
bunx turbo dev --filter=iot-gateway

# Production
bun run build && bun run start
```

## Module Structure

Single file service (`src/index.ts`) -- connects MQTT, writes to InfluxDB, handles graceful shutdown.
