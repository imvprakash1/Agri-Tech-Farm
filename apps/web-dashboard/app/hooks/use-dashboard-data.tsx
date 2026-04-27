"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePolling } from "./use-polling";
import { POLLING_INTERVAL_MS } from "@/app/lib/constants";
import type { AlertsStatusResponse, AutomationStatusResponse } from "@/app/lib/types";

interface DashboardData {
  alerts: { data: AlertsStatusResponse | null; error: string | null; isLoading: boolean };
  automation: { data: AutomationStatusResponse | null; error: string | null; isLoading: boolean };
}

const DashboardContext = createContext<DashboardData | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const alerts = usePolling<AlertsStatusResponse>("/api/alerts", POLLING_INTERVAL_MS);
  const automation = usePolling<AutomationStatusResponse>("/api/automation", POLLING_INTERVAL_MS);

  return (
    <DashboardContext value={{ alerts, automation }}>
      {children}
    </DashboardContext>
  );
}

export function useDashboardData(): DashboardData {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardData must be used within DashboardProvider");
  return ctx;
}
