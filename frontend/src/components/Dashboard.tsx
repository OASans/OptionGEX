import { useEffect, useState } from "react";
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

  const [selectedExpirations, setSelectedExpirations] = useState<string[]>([]);

  const selected = activeTicker || tickers[0] || "";

  // Reset expiration selection when ticker changes
  useEffect(() => {
    setSelectedExpirations([]);
  }, [selected]);
  const expsToSend = selectedExpirations.length > 0 ? selectedExpirations : undefined;
  const { data, loading, error, lastFetch, refetch } = useGexData(selected, pollInterval, expsToSend);

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
              {data.strikes.length < 20 && data.strikes.length > 0 && (
                <div className="warning-banner">
                  Limited data — market may be closed. Yahoo Finance returns sparse open interest data after hours. Charts will be more accurate during market hours (9:30 AM – 4:00 PM ET).
                </div>
              )}
              {data.total_gex === 0 && data.strikes.length === 0 && (
                <div className="warning-banner">
                  No options data available. The market is likely closed and Yahoo Finance has cleared open interest data. Try again during market hours.
                </div>
              )}
              <GexSummaryCard data={data} />

              {data.available_expirations.length > 0 && (
                <div className="expiration-selector">
                  <label>Expirations:</label>
                  <div className="expiration-chips">
                    <button
                      className={`exp-chip ${selectedExpirations.length === 0 ? "active" : ""}`}
                      onClick={() => setSelectedExpirations([])}
                    >
                      All
                    </button>
                    {data.available_expirations.map((exp) => {
                      const isSelected = selectedExpirations.includes(exp);
                      return (
                        <button
                          key={exp}
                          className={`exp-chip ${isSelected ? "active" : ""}`}
                          onClick={() => {
                            setSelectedExpirations((prev) =>
                              isSelected
                                ? prev.filter((e) => e !== exp)
                                : [...prev, exp]
                            );
                          }}
                        >
                          {exp}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
