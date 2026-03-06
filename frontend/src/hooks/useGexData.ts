import { useCallback, useEffect, useRef, useState } from "react";
import type { GEXResult } from "../types/gex";
import { fetchGex } from "../api/gexApi";

export function useGexData(ticker: string, intervalMs: number) {
  const [data, setData] = useState<GEXResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);
  const tickerRef = useRef(ticker);

  tickerRef.current = ticker;

  const doFetch = useCallback(async () => {
    const t = tickerRef.current;
    if (!t) return;
    try {
      setLoading(true);
      const result = await fetchGex(t);
      if (tickerRef.current === t) {
        setData(result);
        setError(null);
        setLastFetch(Date.now());
      }
    } catch (e: any) {
      if (tickerRef.current === t && e.message !== "computing") {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch immediately on ticker change
  useEffect(() => {
    if (!ticker) {
      setData(null);
      setError(null);
      return;
    }
    setData(null);
    setError(null);
    doFetch();
  }, [ticker, doFetch]);

  // Polling: setTimeout chain, restarts on ticker or interval change
  useEffect(() => {
    if (!ticker) return;
    let active = true;
    let timerId: ReturnType<typeof setTimeout>;

    const poll = () => {
      timerId = setTimeout(async () => {
        if (!active) return;
        await doFetch();
        if (active) poll();
      }, intervalMs);
    };

    poll();

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, [ticker, intervalMs, doFetch]);

  return { data, loading, error, lastFetch, refetch: doFetch };
}
