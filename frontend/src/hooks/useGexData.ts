import { useCallback, useEffect, useRef, useState } from "react";
import type { GEXResult } from "../types/gex";
import { fetchGex } from "../api/gexApi";

export function useGexData(ticker: string, intervalMs: number, expirations?: string[]) {
  const [data, setData] = useState<GEXResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState(0);
  const tickerRef = useRef(ticker);
  const expRef = useRef(expirations);

  tickerRef.current = ticker;
  expRef.current = expirations;

  const doFetch = useCallback(async () => {
    const t = tickerRef.current;
    if (!t) return;
    try {
      setLoading(true);
      const result = await fetchGex(t, expRef.current);
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

  // Fetch immediately on ticker or expirations change
  useEffect(() => {
    if (!ticker) {
      setData(null);
      setError(null);
      return;
    }
    doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, doFetch, expirations?.join(",")]);

  // Polling: setTimeout chain
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
