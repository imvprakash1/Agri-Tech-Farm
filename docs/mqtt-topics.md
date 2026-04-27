# MQTT Topic Reference

All MQTT communication follows the unified namespace: `farm/{node_id}/{type}/{name}`

## Topic Format

```
farm/{node_id}/{type}/{name}
  |      |        |      |
  |      |        |      +-- Sensor or actuator name
  |      |        +-- "telemetry" | "command" | "status"
  |      +-- "node_a" | "node_b" | "node_c" | "node_d"
  +-- Root prefix
```

## Telemetry Topics (ESP32 -> Broker)

Published by ESP32 nodes. Consumed by iot-gateway, alerts-service, automation-engine.

**Payload format:** `{"value": <number>, "timestamp": <unix_seconds>}`

### Node A -- Aquaponics & Vertical Farm

| Topic | Sensor | Unit | Consumed By |
|---|---|---|---|
| `farm/node_a/telemetry/ph_level` | pH Sensor | pH (0-14) | iot-gateway, alerts-service, automation-engine |
| `farm/node_a/telemetry/tds` | TDS/EC Sensor | ppm | iot-gateway |
| `farm/node_a/telemetry/npk` | NPK Sensor (Modbus) | ppm | iot-gateway |
| `farm/node_a/telemetry/water_flow` | Water Flow Meter | L/min | iot-gateway |
| `farm/node_a/telemetry/temperature` | DHT22 | Celsius | iot-gateway |
| `farm/node_a/telemetry/humidity` | DHT22 | % | iot-gateway |

### Node B -- Underground Bunkers (Saffron & Mushrooms)

| Topic | Sensor | Unit | Consumed By |
|---|---|---|---|
| `farm/node_b/telemetry/temperature` | PT100 Probe | Celsius | iot-gateway, alerts-service |
| `farm/node_b/telemetry/co2` | MH-Z19 CO2 | ppm | iot-gateway, alerts-service, automation-engine |
| `farm/node_b/telemetry/substrate_moisture` | Substrate Moisture | % | iot-gateway |

### Node C -- Utility & Energy Hub

| Topic | Sensor | Unit | Consumed By |
|---|---|---|---|
| `farm/node_c/telemetry/water_level` | Ultrasonic | % | iot-gateway, alerts-service |
| `farm/node_c/telemetry/solar_output` | Voltage/Current | % capacity | iot-gateway, automation-engine |
| `farm/node_c/telemetry/voltage` | Voltage Sensor | V | iot-gateway |

### Node D -- Dairy & Biogas Complex

| Topic | Sensor | Unit | Consumed By |
|---|---|---|---|
| `farm/node_d/telemetry/methane` | Methane Gas Sensor | ppm | iot-gateway |
| `farm/node_d/telemetry/digester_temp` | DS18B20 | Celsius | iot-gateway |

## Command Topics (Broker -> ESP32)

Published by automation-engine. Consumed by ESP32 actuators.

**Payload format:** `{"state": "ON" | "OFF"}`

| Topic | Actuator | Controlled By |
|---|---|---|
| `farm/node_a/command/ph_up_doser` | pH Up Peristaltic Pump | automation-engine (pH loop) |
| `farm/node_a/command/ph_down_doser` | pH Down Peristaltic Pump | automation-engine (pH loop) |
| `farm/node_b/command/exhaust_fan` | CO2 Exhaust Fan | automation-engine (CO2 loop) |
| `farm/node_c/command/chiller` | Solar Chiller | automation-engine (thermal loop) |
| `farm/node_c/command/thermal_pump` | Cold Water Circulation Pump | automation-engine (thermal loop) |

## Status Topics (ESP32 -> Broker)

Published by ESP32 nodes to confirm actuator state changes. Consumed by iot-gateway.

**Payload format:** `{"state": "ON" | "OFF"}` (written to InfluxDB as value 1 or 0)

| Topic | Example |
|---|---|
| `farm/{node_id}/status/{actuator_name}` | `farm/node_b/status/exhaust_fan` |

## Subscription Patterns

| Service | Subscription | Purpose |
|---|---|---|
| iot-gateway | `farm/+/telemetry/#` | All sensor data for InfluxDB storage |
| iot-gateway | `farm/+/status/#` | Actuator state for InfluxDB storage |
| alerts-service | `farm/+/telemetry/#` | Threshold evaluation and alerting |
| automation-engine | `farm/+/telemetry/#` | Feed state machines for control loops |

## Example Messages

```bash
# Publish a pH reading
mosquitto_pub -t farm/node_a/telemetry/ph_level -m '{"value": 6.5, "timestamp": 1698765432}'

# Command the exhaust fan ON
mosquitto_pub -t farm/node_b/command/exhaust_fan -m '{"state": "ON"}'

# Check actuator status confirmation
mosquitto_sub -t farm/+/status/#
```
