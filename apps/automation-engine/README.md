# automation-engine

Autonomous control loops for the farm. Subscribes to MQTT telemetry and publishes actuator commands based on state machine logic. Three independent loops manage pH dosing, CO2 ventilation, and thermal energy storage.

## Data Flow

```
MQTT Telemetry ──> State Machines ──> MQTT Commands ──> ESP32 Actuators
```

## Module Structure

| File | Purpose |
|---|---|
| `src/index.ts` | Orchestrator -- wires MQTT, tick timer, HTTP server |
| `src/config.ts` | Environment variable reads with spec defaults |
| `src/state.ts` | State machine types and initial state |
| `src/commands.ts` | MQTT command publisher helper |
| `src/loops/ph.ts` | pH balancing loop (Node A) |
| `src/loops/co2.ts` | CO2 purge loop (Node B) |
| `src/loops/thermal.ts` | Thermal battery loop (Node C) |
| `src/server.ts` | HTTP server with /health and /status |

## Control Loops

### pH Balancing (Node A)

Manages peristaltic dosers for pH adjustment in the aquaponics system.

**State machine:** `IDLE` -> `VIOLATION_DETECTED` -> `DOSING` -> `COOLDOWN` -> `IDLE`

| Transition | Trigger | Action |
|---|---|---|
| IDLE -> VIOLATION_DETECTED | pH < 6.0 or > 8.5 | Record direction + timestamp |
| VIOLATION_DETECTED -> IDLE | pH returns to range | Clear violation timer |
| VIOLATION_DETECTED -> DOSING | Sustained 5 min | Turn doser ON |
| DOSING -> COOLDOWN | After 5 sec (tick) | Turn doser OFF |
| COOLDOWN -> IDLE | After 10 min (tick) | Resume monitoring |

**Actuators:** `ph_up_doser` (low pH), `ph_down_doser` (high pH)

### CO2 Purge (Node B)

Hysteresis-based exhaust fan control for mushroom growing bunkers.

**State machine:** `IDLE` <-> `PURGING`

| Transition | Trigger | Action |
|---|---|---|
| IDLE -> PURGING | CO2 > 1000 ppm | Exhaust fan ON |
| PURGING -> IDLE | CO2 < 600 ppm | Exhaust fan OFF |

The 400 ppm gap prevents rapid cycling.

**Actuator:** `exhaust_fan`

### Thermal Battery (Node C -> Node B)

Solar-driven chilling and evening cold-water circulation for saffron bunkers.

**State machine:** `IDLE` -> `CHILLING` -> `CIRCULATING` -> `IDLE`

| Transition | Trigger | Action |
|---|---|---|
| IDLE -> CHILLING | 12:00-15:00 AND solar > 80% | Chiller ON |
| CHILLING -> CIRCULATING | At 20:00 | Chiller OFF, thermal pump ON |
| CHILLING -> IDLE | Past 15:00, before 20:00 | Chiller OFF |
| CIRCULATING -> IDLE | At 06:00 | Thermal pump OFF |

**Actuators:** `chiller`, `thermal_pump`

## Safety

On graceful shutdown (SIGINT), all 5 actuators are explicitly turned OFF before the service exits. This prevents a doser or pump from being stuck ON if the service restarts.

## HTTP Endpoints

| Endpoint | Method | Response |
|---|---|---|
| `/health` | GET | `"ok"` |
| `/status` | GET | JSON with loop states, last sensor values, uptime |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MQTT_BROKER` | `mqtt://localhost:1883` | MQTT broker URL |
| `PORT` | `3002` | HTTP server port |
| `PH_LOW` / `PH_HIGH` | `6.0` / `8.5` | pH safe range |
| `PH_VIOLATION_MS` | `300000` | Sustained violation before dosing (5 min) |
| `PH_DOSE_MS` | `5000` | Doser ON duration (5 sec) |
| `PH_COOLDOWN_MS` | `600000` | Post-dose cooldown (10 min) |
| `CO2_HIGH` / `CO2_LOW` | `1000` / `600` | CO2 hysteresis thresholds (ppm) |
| `SOLAR_THRESHOLD` | `80` | Min solar % to start chilling |
| `CHILL_START_HOUR` / `CHILL_END_HOUR` | `12` / `15` | Chilling window |
| `CIRCULATE_START_HOUR` / `CIRCULATE_END_HOUR` | `20` / `6` | Circulation window |
| `TICK_INTERVAL_MS` | `10000` | Tick interval for time-based transitions (10 sec) |

## Running

```bash
bunx turbo dev --filter=automation-engine
```
