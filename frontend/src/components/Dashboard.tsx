import { useState } from "react";
import { useGexData } from "../hooks/useGexData";
import { useTickers } from "../hooks/useTickers";
import { TickerSelector } from "./TickerSelector";
import { GexBarChart } from "./GexBarChart";
import { AggregateGexChart } from "./AggregateGexChart";
import { OIChart } from "./OIChart";
import { GexSummaryCard } from "./GexSummaryCard";
import { RefreshControl } from "./RefreshControl";
import { OptionsGuide } from "./OptionsGuide";

type Tab = "dashboard" | "learn";

export function Dashboard() {
  const { tickers, error: tickerError, add, remove } = useTickers();
  const [activeTicker, setActiveTicker] = useState<string>("");
  const [pollInterval, setPollInterval] = useState(30000);
  const [tab, setTab] = useState<Tab>("dashboard");

  const selected = activeTicker || tickers[0] || "";
  const { data, loading, error, lastFetch, refetch } = useGexData(selected, pollInterval);

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-left">
          <h1>OptionGEX</h1>
          <nav className="header-tabs">
            <button
              className={`header-tab ${tab === "dashboard" ? "active" : ""}`}
              onClick={() => setTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`header-tab ${tab === "learn" ? "active" : ""}`}
              onClick={() => setTab("learn")}
            >
              Learn Options
            </button>
          </nav>
        </div>
        {tab === "dashboard" && (
          <RefreshControl
            interval={pollInterval}
            onIntervalChange={setPollInterval}
            onRefresh={refetch}
            loading={loading}
            lastFetch={lastFetch}
          />
        )}
      </header>

      {tab === "dashboard" ? (
        <>
          <TickerSelector
            tickers={tickers}
            activeTicker={selected}
            onSelect={setActiveTicker}
            onAdd={add}
            onRemove={remove}
            error={tickerError}
          />

          {selected && loading && !data && (
            <div className="loading">Loading {selected}...</div>
          )}

          {selected && error && !data && (
            <div className="error-banner">Error loading {selected}: {error}</div>
          )}

          {selected && data && (
            <div className="ticker-panel">
              <h2>{data.ticker} Gamma Exposure</h2>
              {data.is_stale && (
                <div className="warning-banner">Data is stale - waiting for refresh</div>
              )}
              {error && <div className="warning-banner">Refresh error: {error}</div>}
              <GexSummaryCard data={data} />
              <GexBarChart data={data} />
              <div style={{ marginTop: 24 }}>
                <AggregateGexChart data={data} />
              </div>
              <div style={{ marginTop: 24 }}>
                <OIChart data={data} />
              </div>
            </div>
          )}

          {!selected && tickers.length === 0 && (
            <div className="empty-state">
              Add a ticker above to get started
            </div>
          )}
        </>
      ) : (
        <OptionsGuide />
      )}
    </div>
  );
}
