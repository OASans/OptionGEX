interface Props {
  interval: number;
  onIntervalChange: (ms: number) => void;
  onRefresh: () => void;
  loading: boolean;
  lastFetch: number;
}

const OPTIONS = [
  { label: "15s", value: 15000 },
  { label: "30s", value: 30000 },
  { label: "60s", value: 60000 },
];

export function RefreshControl({ interval, onIntervalChange, onRefresh, loading, lastFetch }: Props) {
  return (
    <div className="refresh-control">
      <select
        value={interval}
        onChange={(e) => onIntervalChange(Number(e.target.value))}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button onClick={onRefresh} disabled={loading} key={lastFetch}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}
