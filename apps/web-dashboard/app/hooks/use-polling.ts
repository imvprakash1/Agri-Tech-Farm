"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UsePollingResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  lastUpdated: number | null;
  refresh: () => void;
}

export function usePolling<T>(url: string, intervalMs: number): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `HTTP ${res.status}`);
        return;
      }
      const json = await res.json() as T;
      setData(json);
      setError(null);
      setLastUpdated(Date.now());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, intervalMs);
    return () => {
      clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [fetchData, intervalMs]);

  return { data, error, isLoading, lastUpdated, refresh: fetchData };
}
