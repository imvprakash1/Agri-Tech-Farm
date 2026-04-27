import type { Alert } from "@repo/types";
import { NODE_LABELS } from "@repo/types";
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from "./config.js";

/**
 * Dispatch an alert to console and optionally to Telegram.
 * Telegram dispatch is skipped if TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID are empty.
 * Telegram errors are logged but never thrown -- alerting failures must not crash the service.
 */
export async function dispatchAlert(alert: Alert): Promise<void> {
  const label = NODE_LABELS[alert.node];
  console.log(
    `[ALERT][${alert.severity.toUpperCase()}] ${label} - ${alert.sensor}: ${alert.message} (value: ${alert.value}, threshold: ${alert.threshold})`
  );

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const icon = alert.severity === "critical" ? "\u{1F6A8}" : "\u26A0\uFE0F";
    const text = [
      `${icon} *Farm Alert*`,
      `*Severity:* ${alert.severity.toUpperCase()}`,
      `*Zone:* ${label}`,
      `*Sensor:* ${alert.sensor}`,
      `*Message:* ${alert.message}`,
      `*Value:* ${alert.value}`,
      `*Time:* ${new Date(alert.timestamp * 1000).toLocaleString()}`,
    ].join("\n");

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
        }
      );
      if (!res.ok) {
        console.error(`[alerts-service] Telegram API error: ${res.status} ${await res.text()}`);
      }
    } catch (err) {
      console.error("[alerts-service] Telegram dispatch failed:", err);
    }
  }
}
