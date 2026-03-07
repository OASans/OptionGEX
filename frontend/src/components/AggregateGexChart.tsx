import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
  Cell,
  ReferenceArea,
} from "recharts";
import type { GEXResult } from "../types/gex";
import { formatGex } from "../utils";

interface Props {
  data: GEXResult;
}

export function AggregateGexChart({ data }: Props) {
  const lower = data.spot_price * 0.9;
  const upper = data.spot_price * 1.1;
  const filtered = data.strikes.filter(
    (s) => s.strike >= lower && s.strike <= upper
  );

  // Compute aggregate GEX: sum net_gex from right to left
  // At each strike, aggregate = sum of net_gex for all strikes >= current
  // This starts negative on the left (put dominated) and rises to positive on the right
  const aggValues: number[] = new Array(filtered.length).fill(0);
  let cumulative = 0;
  for (let i = filtered.length - 1; i >= 0; i--) {
    cumulative += filtered[i].net_gex;
    aggValues[i] = cumulative;
  }
  const chartData = filtered.map((s, i) => ({
    strike: s.strike,
    net_gex: s.net_gex,
    aggregate_gex: aggValues[i],
    call_gex: s.call_gex,
    put_gex: s.put_gex,
  }));

  const strikes = filtered.map((s) => s.strike);
  const flipStrike = data.flip_point
    ? findClosestStrike(strikes, data.flip_point)
    : undefined;
  const minStrike = filtered.length > 0 ? filtered[0].strike : 0;
  const maxStrike = filtered.length > 0 ? filtered[filtered.length - 1].strike : 0;

  return (
    <div className="chart-container">
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-bar" style={{ background: "#1a6cb5" }} />
          <span>Net GEX by Strike</span>
        </div>
        <div className="legend-item">
          <span className="legend-line" style={{ borderColor: "#1a6cb5", borderTopWidth: 2, borderTopStyle: "solid", width: 18 }} />
          <span>Aggregate GEX</span>
        </div>
        <div className="legend-item">
          <span className="legend-bar" style={{ background: "rgba(45,138,86,0.15)" }} />
          <span>Positive Gamma Zone</span>
        </div>
        <div className="legend-item">
          <span className="legend-bar" style={{ background: "rgba(194,59,59,0.1)" }} />
          <span>Negative Gamma Zone</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart data={chartData} margin={{ top: 52, right: 60, left: 16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e5e0" vertical={false} />
          {/* Background shading: negative gamma zone (left of flip) and positive (right of flip) */}
          {flipStrike != null && (
            <ReferenceArea
              x1={minStrike}
              x2={flipStrike}
              fill="rgba(194,59,59,0.08)"
              fillOpacity={1}
            />
          )}
          {flipStrike != null && (
            <ReferenceArea
              x1={flipStrike}
              x2={maxStrike}
              fill="rgba(45,138,86,0.08)"
              fillOpacity={1}
            />
          )}
          <XAxis
            dataKey="strike"
            tick={{ fontSize: 11, fill: "#9b9590" }}
            tickFormatter={(v) => v.toFixed(0)}
            axisLine={{ stroke: "#e8e5e0" }}
            tickLine={{ stroke: "#e8e5e0" }}
          />
          <YAxis
            yAxisId="bar"
            tick={{ fontSize: 11, fill: "#9b9590" }}
            tickFormatter={(v) => formatGex(v)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="line"
            orientation="right"
            tick={{ fontSize: 11, fill: "#1a6cb5" }}
            tickFormatter={(v) => formatGex(v)}
            axisLine={false}
            tickLine={false}
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
                  <div>Net GEX: {formatGex(d.net_gex)}</div>
                  <div style={{ color: "#1a6cb5" }}>Aggregate: {formatGex(d.aggregate_gex)}</div>
                </div>
              );
            }}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <ReferenceLine yAxisId="bar" y={0} stroke="#ccc" />
          <ReferenceLine
            x={findClosestStrike(filtered.map((s) => s.strike), data.spot_price)}
            yAxisId="bar"
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
          {data.flip_point && (
            <ReferenceLine
              x={findClosestStrike(filtered.map((s) => s.strike), data.flip_point)}
              yAxisId="bar"
              stroke="#c23b3b"
              strokeWidth={1.5}
            >
              <Label
                value={`Flip: $${data.flip_point.toFixed(1)}`}
                position="top"
                offset={22}
                fill="#c23b3b"
                fontSize={11}
                fontWeight={500}
              />
            </ReferenceLine>
          )}
          <Bar dataKey="net_gex" yAxisId="bar" isAnimationActive={false}>
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.net_gex >= 0 ? "#1a6cb5" : "#e8a030"} />
            ))}
          </Bar>
          <Line
            type="monotone"
            dataKey="aggregate_gex"
            yAxisId="line"
            stroke="#1a6cb5"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="chart-guide">
        <p><strong>Positive Gamma</strong> (green zone): Above flip point, dealers buy dips and sell rallies — stabilizing, lower volatility.</p>
        <p><strong>Negative Gamma</strong> (red zone): Below flip point, dealers sell dips and buy rallies — amplifying moves, higher volatility.</p>
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
