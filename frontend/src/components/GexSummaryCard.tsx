import { useEffect, useState } from "react";
import type { GEXResult } from "../types/gex";
import { formatGex, timeAgo } from "../utils";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const TOOLTIPS: Record<string, string> = {
  "Spot Price": "Current trading price of the underlying stock.",
  "Net GEX":
    "Total gamma exposure across all strikes. Positive = market makers dampen moves (low vol). Negative = market makers amplify moves (high vol).",
  "Call GEX":
    "Gamma exposure from call options. Calls contribute positive (stabilizing) gamma -- market makers sell on rallies, buy on dips.",
  "Put GEX":
    "Gamma exposure from put options. Puts contribute negative (destabilizing) gamma -- market makers sell on dips, buy on rallies.",
  "Flip Point":
    "Price where cumulative net GEX crosses zero. Above = calm, range-bound. Below = volatile, trending.",
  "Max Pain":
    "Strike where total option holder payout is minimized. Stocks tend to gravitate here near expiration.",
  "Max Gamma Strike":
    "Strike with the highest absolute net gamma. Strong pinning magnet if positive GEX, breakout zone if negative.",
  Expirations: "Option expiration dates used in the calculation. Near-term expirations dominate GEX.",
  Updated: "Time since last data refresh from the server.",
};

function MetricCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [showTip, setShowTip] = useState(false);
  const tip = TOOLTIPS[label];

  return (
    <div className="summary-card">
      <div
        className="summary-label"
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {label}
        {tip && <span className="info-icon">?</span>}
        {showTip && tip && <div className="tooltip">{tip}</div>}
      </div>
      {children}
    </div>
  );
}

interface Props {
  data: GEXResult;
}

export function GexSummaryCard({ data }: Props) {
  const now = useNow();
  return (
    <div className="summary-grid">
      <MetricCard label="Spot Price">
        <div className="summary-value">${data.spot_price.toFixed(2)}</div>
      </MetricCard>
      <MetricCard label="Net GEX">
        <div className={`summary-value ${data.total_gex >= 0 ? "positive" : "negative"}`}>
          {formatGex(data.total_gex)}
        </div>
      </MetricCard>
      <MetricCard label="Call GEX">
        <div className="summary-value positive">{formatGex(data.total_call_gex)}</div>
      </MetricCard>
      <MetricCard label="Put GEX">
        <div className="summary-value negative">{formatGex(data.total_put_gex)}</div>
      </MetricCard>
      <MetricCard label="Flip Point">
        <div className="summary-value">
          {data.flip_point ? `$${data.flip_point.toFixed(2)}` : "N/A"}
        </div>
      </MetricCard>
      <MetricCard label="Max Pain">
        <div className="summary-value">
          {data.max_pain ? `$${data.max_pain.toFixed(2)}` : "N/A"}
        </div>
      </MetricCard>
      <MetricCard label="Max Gamma Strike">
        <div className="summary-value">
          {data.max_gamma_strike ? `$${data.max_gamma_strike.toFixed(2)}` : "N/A"}
        </div>
      </MetricCard>
      <MetricCard label="Expirations">
        <div className="summary-value small">{data.expirations_used.join(", ")}</div>
      </MetricCard>
      <MetricCard label="Updated">
        <div className={`summary-value small ${data.is_stale ? "stale" : ""}`}>
          {timeAgo(data.computed_at, now)}
          {data.is_stale && " (stale)"}
        </div>
      </MetricCard>
    </div>
  );
}
