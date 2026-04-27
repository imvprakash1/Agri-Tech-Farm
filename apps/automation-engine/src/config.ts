import { DEFAULT_THRESHOLDS } from "@repo/types";

export const MQTT_BROKER = process.env.MQTT_BROKER ?? "mqtt://localhost:1883";
export const PORT = Number(process.env.PORT ?? 3002);

// pH loop
export const PH_LOW = Number(process.env.PH_LOW ?? DEFAULT_THRESHOLDS.PH_LOW);
export const PH_HIGH = Number(process.env.PH_HIGH ?? DEFAULT_THRESHOLDS.PH_HIGH);
export const PH_VIOLATION_MS = Number(process.env.PH_VIOLATION_MS ?? 300_000);
export const PH_DOSE_MS = Number(process.env.PH_DOSE_MS ?? 5_000);
export const PH_COOLDOWN_MS = Number(process.env.PH_COOLDOWN_MS ?? 600_000);

// CO2 loop
export const CO2_HIGH = Number(process.env.CO2_HIGH ?? DEFAULT_THRESHOLDS.CO2_HIGH);
export const CO2_LOW = Number(process.env.CO2_LOW ?? DEFAULT_THRESHOLDS.CO2_LOW);

// Thermal loop
export const SOLAR_THRESHOLD = Number(process.env.SOLAR_THRESHOLD ?? 80);
export const CHILL_START_HOUR = Number(process.env.CHILL_START_HOUR ?? 12);
export const CHILL_END_HOUR = Number(process.env.CHILL_END_HOUR ?? 15);
export const CIRCULATE_START_HOUR = Number(process.env.CIRCULATE_START_HOUR ?? 20);
export const CIRCULATE_END_HOUR = Number(process.env.CIRCULATE_END_HOUR ?? 6);

export const TICK_INTERVAL_MS = Number(process.env.TICK_INTERVAL_MS ?? 10_000);
