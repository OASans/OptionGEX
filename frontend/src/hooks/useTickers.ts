import { useCallback, useEffect, useState } from "react";
import * as api from "../api/gexApi";

export function useTickers() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .fetchTickers()
      .then(setTickers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const add = useCallback(async (symbol: string) => {
    try {
      setError(null);
      const updated = await api.addTicker(symbol);
      setTickers(updated);
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, []);

  const remove = useCallback(async (symbol: string) => {
    try {
      setError(null);
      const updated = await api.removeTicker(symbol);
      setTickers(updated);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  return { tickers, loading, error, add, remove };
}
