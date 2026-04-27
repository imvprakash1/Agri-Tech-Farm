# Agri-Tech Farm: Software & IoT Technical Specifications

This document contains the complete technical architecture, input/output mappings, communication protocols, and database schema required for a developer to build the autonomous management system for the 1-acre farm.

## 1. System Architecture Overview

The system follows a localized, edge-computing architecture to ensure high reliability even with internet outages. The data pipeline flows as follows:

- **Edge Layer:** ESP32 microcontrollers read sensor pins (Analog/I2C/SPI) and control relays.
- **Communication Layer:** MQTT Protocol over local Wi-Fi. (Broker: Eclipse Mosquitto).
- **Logic Engine:** Node-RED or Home Assistant acts as the central brain, executing automation rules based on MQTT payloads.
- **Storage Layer:** InfluxDB (Time-Series Database) for high-frequency sensor telemetry.
- **Presentation Layer:** Grafana dashboards querying InfluxDB for visualization and alerting.

## 2. Hardware Nodes: Input/Output Specs

The physical farm is divided into four primary logical nodes.

### Node A: Aquaponics & Vertical Farm (Core Loop)

| Component | Type | Signal/Protocol | Purpose |
|---|---|---|---|
| pH Sensor | Input | Analog / I2C | Monitors water acidity for fish/plant health. |
| TDS/EC Sensor | Input | Analog | Measures nutrient density in the hydroponic loop. |
| NPK Sensor | Input | RS485 (Modbus) | Monitors Nitrogen, Phosphorus, Potassium levels. |
| Water Flow Meter | Input | Pulse / Digital | Ensures water is circulating correctly through grow beds. |
| Temp/Humidity (DHT22) | Input | Digital | Monitors greenhouse ambient climate. |
| Main Circulation Pump | Output | Relay (Digital High/Low) | Moves water between fish tanks and vertical farm. |
| Nutrient/Buffer Dosers | Output | Relay (PWM) | Peristaltic pumps to inject pH up/down or nutrients. |

### Node B: Underground Bunkers (Saffron & Mushrooms)

| Component | Type | Signal/Protocol | Purpose |
|---|---|---|---|
| PT100 Temp Probes | Input | Analog (via MAX31865) | High-precision temperature monitoring for Saffron (requires strict 10°C - 15°C). |
| CO2 Sensor (MH-Z19) | Input | UART / PWM | Crucial for mushroom fruiting stages. |
| Substrate Moisture | Input | Analog | Monitors the moisture of mushroom bags/beds. |
| Solar Chillers | Output | Relay / Contactor | Maintains underground temperature. |
| Humidifiers | Output | Relay | Maintains high humidity for mushrooms/saffron roots. |
| Exhaust Fans | Output | Relay | Purges excess CO2 buildup. |

### Node C: Utility & Energy Hub

| Component | Type | Signal/Protocol | Purpose |
|---|---|---|---|
| Ultrasonic Sensor | Input | Digital (Trigger/Echo) | Monitors water level in the 50,000L tank. |
| Voltage/Current Sensor | Input | Analog / I2C | Monitors solar array output and battery health. |
| Borewell Pump Relay | Output | Heavy Contactor | Fills the main storage tank when levels are low. |
| Thermal Battery Pump | Output | Relay | Circulates pre-chilled water to the bunkers at night. |

### Node D: Dairy & Biogas Complex

| Component | Type | Signal/Protocol | Purpose |
|---|---|---|---|
| Methane Gas Sensor | Input | Analog | Measures output/pressure from the biogas digester. |
| Digester Temp Probe | Input | Digital (DS18B20) | Ensures anaerobic bacteria are at optimal temperatures. |

## 3. MQTT Topic Structure

The developer must implement a unified namespace for MQTT topics to ensure easy routing in Node-RED.

- **Telemetry (ESP32 to Broker):** `farm/{node_id}/telemetry/{sensor_name}`
  - *Example:* `farm/node_a/telemetry/ph_level` payload: `{"value": 6.5, "timestamp": 1698765432}`
- **Commands (Broker to ESP32):** `farm/{node_id}/command/{actuator_name}`
  - *Example:* `farm/node_b/command/exhaust_fan` payload: `{"state": "ON"}`
- **Status (ESP32 to Broker):** `farm/{node_id}/status/{actuator_name}`
  - *Example:* `farm/node_b/status/exhaust_fan` payload: `{"state": "ON"}`

## 4. Database Schema (InfluxDB)

Data should be written to InfluxDB using the Line Protocol. The schema design leverages Tags for indexed metadata and Fields for the actual sensor values.

- **Bucket:** `agritech_production`
- **Measurement 1: `environment`**
  - Tags: `node` (e.g., "node_a", "node_b"), `location` (e.g., "greenhouse", "saffron_bunker")
  - Fields: `temperature` (float), `humidity` (float), `co2` (float)
- **Measurement 2: `water_quality`**
  - Tags: `node` (e.g., "node_a"), `source` (e.g., "fish_tank", "hydro_bed")
  - Fields: `ph` (float), `tds` (float), `nitrogen` (float)
- **Measurement 3: `system_status`**
  - Tags: `node`, `device` (e.g., "water_pump", "chiller")
  - Fields: `state` (integer: 1 for ON, 0 for OFF)

## 5. Core Automation Logic (Node-RED Specifications)

The developer needs to implement the following critical control loops in Node-RED:

1. **pH Balancing Loop (Node A):** If `telemetry/ph_level` < 6.0 for more than 5 minutes -> trigger `command/ph_up_doser` to "ON" for 5 seconds -> Wait 10 minutes -> Re-evaluate.
2. **CO2 Purge Loop (Node B - Mushrooms):** If `telemetry/co2` > 1000 ppm -> trigger `command/exhaust_fan` to "ON" -> When CO2 < 600 ppm -> trigger `command/exhaust_fan` to "OFF".
3. **Thermal Battery Optimization (Node C to Node B):** If Time is between 12:00 and 15:00 AND Solar Output > 80% capacity -> trigger `command/chiller` to over-chill water storage to 4°C. At 20:00, turn off chillers and trigger `command/thermal_pump` to circulate cold water to Saffron bunker.
4. **Fail-Safe Alerts:** If `telemetry/water_level` in the main tank drops below 10%, or if any node loses MQTT connection for > 5 minutes -> trigger HTTP POST to Telegram/Twilio API to alert the farm manager.
