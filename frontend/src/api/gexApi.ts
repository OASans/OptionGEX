import type { GEXResult, TickerListResponse } from "../types/gex";

const BASE = "/api";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (res.status === 202) {
    throw new Error("computing");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchGex(ticker: string): Promise<GEXResult> {
  return fetchJson<GEXResult>(`${BASE}/gex/${ticker}`);
}

export async function fetchTickers(): Promise<string[]> {
  const res = await fetchJson<TickerListResponse>(`${BASE}/tickers`);
  return res.tickers;
}

export async function addTicker(symbol: string): Promise<string[]> {
  const res = await fetchJson<TickerListResponse>(`${BASE}/tickers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol }),
  });
  return res.tickers;
}

export async function removeTicker(symbol: string): Promise<string[]> {
  const res = await fetchJson<TickerListResponse>(`${BASE}/tickers/${symbol}`, {
    method: "DELETE",
  });
  return res.tickers;
}
