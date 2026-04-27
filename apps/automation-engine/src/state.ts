/** pH control loop state machine. Transitions: IDLE -> VIOLATION_DETECTED -> DOSING -> COOLDOWN -> IDLE */
export type PhState =
  | { status: "IDLE" }
  | { status: "VIOLATION_DETECTED"; direction: "low" | "high"; since: number }
  | { status: "DOSING"; direction: "low" | "high"; startedAt: number }
  | { status: "COOLDOWN"; until: number };

/** CO2 purge loop state. Hysteresis: IDLE (fan off) <-> PURGING (fan on) */
export type Co2State =
  | { status: "IDLE" }
  | { status: "PURGING" };

/** Thermal battery loop state. Time-driven: IDLE -> CHILLING -> CIRCULATING -> IDLE */
export type ThermalState =
  | { status: "IDLE" }
  | { status: "CHILLING" }
  | { status: "CIRCULATING" };

export interface EngineState {
  ph: PhState;
  co2: Co2State;
  thermal: ThermalState;
  lastValues: {
    ph: number | null;
    co2: number | null;
    solarOutput: number | null;
  };
}

export const state: EngineState = {
  ph: { status: "IDLE" },
  co2: { status: "IDLE" },
  thermal: { status: "IDLE" },
  lastValues: { ph: null, co2: null, solarOutput: null },
};
