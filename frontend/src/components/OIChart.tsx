import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
  Customized,
} from "recharts";
import type { GEXResult } from "../types/gex";

interface Props {
  data: GEXResult;
}

function formatOI(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (abs >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return v.toFixed(0);
}

function CustomOIBars(props: any) {
  const { formattedGraphicalItems } = props;
  const barSeries = formattedGraphicalItems?.[0];
  if (!barSeries?.props?.data) return null;

  const items = barSeries.props.data as Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    value: number;
    payload: { call_oi: number; put_oi: number; strike: number; _oi_range: number };
  }>;

  // Derive zeroY and scale from any bar with non-zero value
  let zeroY: number | null = null;
  let pxPerUnit: number | null = null;

  for (const item of items) {
    const val = item.value;
    if (val > 0 && item.height > 0) {
      zeroY = item.y + item.height;
      pxPerUnit = item.height / val;
      break;
    }
    if (val < 0 && item.height > 0) {
      zeroY = item.y;
      pxPerUnit = item.height / Math.abs(val);
      break;
    }
  }

  if (zeroY === null || pxPerUnit === null) return null;

  return (
    <g>
      {items.map((item, i) => {
        const { x, width, payload } = item;
        const callH = Math.max(payload.call_oi * pxPerUnit!, 0);
        const putH = Math.max(payload.put_oi * pxPerUnit!, 0);

        return (
          <g key={i}>
            {callH > 0.5 && (
              <rect
                x={x}
                y={zeroY! - callH}
                width={width}
                height={callH}
                fill="#1a6cb5"
                rx={2}
                ry={2}
              />
            )}
            {putH > 0.5 && (
              <rect
                x={x}
                y={zeroY!}
                width={width}
                height={putH}
                fill="#e8a030"
                rx={2}
                ry={2}
              />
            )}
          </g>
        );
      })}
    </g>
  );
}

export function OIChart({ data }: Props) {
  const lower = data.spot_price * 0.9;
  const upper = data.spot_price * 1.1;
  const filtered = data.strikes.filter(
    (s) => s.strike >= lower && s.strike <= upper
  );

  const maxCallOI = Math.max(...filtered.map((s) => s.call_oi), 0);
  const maxPutOI = Math.max(...filtered.map((s) => s.put_oi), 0);
  const yMax = Math.max(maxCallOI, maxPutOI) * 1.1;

  // OI chart: call_oi goes up, put_oi goes down (as negative)
  const chartData = filtered.map((s) => ({
    strike: s.strike,
    call_oi: s.call_oi,
    put_oi: s.put_oi,
    // Dummy field for invisible bar: net difference to drive axis
    _oi_range: s.call_oi - s.put_oi,
  }));

  return (
    <div className="chart-container">
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-bar" style={{ background: "#1a6cb5" }} />
          <span>Call Open Interest</span>
        </div>
        <div className="legend-item">
          <span className="legend-bar" style={{ background: "#e8a030" }} />
          <span>Put Open Interest</span>
        </div>
        <div className="legend-item">
          <span className="legend-line legend-spot" />
          <span>Spot price</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={chartData} margin={{ top: 40, right: 24, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e5e0" vertical={false} />
          <XAxis
            dataKey="strike"
            tick={{ fontSize: 11, fill: "#9b9590" }}
            tickFormatter={(v) => v.toFixed(0)}
            axisLine={{ stroke: "#e8e5e0" }}
            tickLine={{ stroke: "#e8e5e0" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9b9590" }}
            tickFormatter={(v) => formatOI(v)}
            axisLine={false}
            tickLine={false}
            domain={[-yMax, yMax]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload;
              if (!d) return null;
              return (
                <div style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e8e5e0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  fontSize: "13px",
                  padding: "10px 14px",
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Strike: ${Number(label).toFixed(1)}</div>
                  <div style={{ color: "#1a6cb5" }}>Call OI: {formatOI(d.call_oi)}</div>
                  <div style={{ color: "#e8a030" }}>Put OI: {formatOI(d.put_oi)}</div>
                </div>
              );
            }}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <ReferenceLine y={0} stroke="#ccc" />
          <ReferenceLine
            x={findClosestStrike(filtered.map((s) => s.strike), data.spot_price)}
            stroke="#2d8a56"
            strokeWidth={1.5}
          >
            <Label
              value={`Last: $${data.spot_price.toFixed(1)}`}
              position="top"
              offset={8}
              fill="#2d8a56"
              fontSize={11}
              fontWeight={600}
            />
          </ReferenceLine>
          {/* Invisible bar to drive positioning for CustomOIBars */}
          <Bar dataKey="_oi_range" fill="transparent" isAnimationActive={false} />
          <Customized component={CustomOIBars} />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-guide">
        <p>Call OI (blue, up) and Put OI (orange, down) by strike. High OI = strong support/resistance level and potential pinning target near expiration.</p>
      </div>
    </div>
  );
}

function findClosestStrike(strikes: number[], target: number): number | undefined {
  if (strikes.length === 0) return undefined;
  return strikes.reduce((prev, curr) =>
    Math.abs(curr - target) < Math.abs(prev - target) ? curr : prev
  );
}
