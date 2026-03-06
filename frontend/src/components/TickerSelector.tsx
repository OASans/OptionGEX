import { useState } from "react";

interface Props {
  tickers: string[];
  activeTicker: string;
  onSelect: (ticker: string) => void;
  onAdd: (symbol: string) => Promise<void>;
  onRemove: (symbol: string) => void;
  error: string | null;
}

export function TickerSelector({
  tickers,
  activeTicker,
  onSelect,
  onAdd,
  onRemove,
  error,
}: Props) {
  const [input, setInput] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    const symbol = input.trim().toUpperCase();
    if (!symbol) return;
    setAdding(true);
    try {
      await onAdd(symbol);
      setInput("");
    } catch {
      // error is surfaced via the error prop
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="ticker-selector">
      <div className="ticker-chips">
        {tickers.map((t) => (
          <button
            key={t}
            className={`chip ${t === activeTicker ? "active" : ""}`}
            onClick={() => onSelect(t)}
          >
            {t}
            <span
              className="chip-remove"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(t);
              }}
            >
              &#215;
            </span>
          </button>
        ))}
      </div>
      <div className="ticker-add">
        <input
          type="text"
          placeholder="Add ticker (e.g. AAPL)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          disabled={adding}
        />
        <button onClick={handleAdd} disabled={adding || !input.trim()}>
          {adding ? "Adding..." : "Add"}
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
