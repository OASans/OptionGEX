export interface StrikeGEX {
  strike: number;
  call_gex: number;
  put_gex: number;
  net_gex: number;
}

export interface GEXResult {
  ticker: string;
  spot_price: number;
  strikes: StrikeGEX[];
  total_gex: number;
  total_call_gex: number;
  total_put_gex: number;
  flip_point: number | null;
  max_gamma_strike: number | null;
  max_pain: number | null;
  expirations_used: string[];
  computed_at: string;
  is_stale: boolean;
}

export interface GEXSummary {
  ticker: string;
  spot_price: number;
  total_gex: number;
  total_call_gex: number;
  total_put_gex: number;
  flip_point: number | null;
  max_gamma_strike: number | null;
  max_pain: number | null;
  computed_at: string;
  is_stale: boolean;
}

export interface TickerListResponse {
  tickers: string[];
}
