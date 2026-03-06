import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";
import type { GEXResult } from "../types/gex";
import { formatGex } from "../utils";

interface Props {
  data: GEXResult;
}

export function GexBarChart({ data }: Props) {
  const lower = data.spot_price * 0.9;
  const upper = data.spot_price * 1.1;
  const filtered = data.strikes.filter(
    (s) => s.strike >= lower && s.strike <= upper
  );

  return (
    <div className="chart-container">
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-bar legend-call" />
          <span>Call GEX (stabilizing)</span>
        </div>
        <div className="legend-item">
          <span className="legend-bar legend-put" />
          <span>Put GEX (destabilizing)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line legend-spot" />
          <span>Spot price</span>
        </div>
        <div className="legend-item">
          <span className="legend-line legend-flip" />
          <span>Flip point</span>
        </div>
        <div className="legend-item">
          <span className="legend-line legend-maxpain" />
          <span>Max pain</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={filtered} barSize={8} barGap={-8} margin={{ top: 52, right: 24, left: 16, bottom: 8 }}>
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
            tickFormatter={(v) => formatGex(v)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatGex(value), name]}
            labelFormatter={(label) => `Strike: $${Number(label).toFixed(1)}`}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e8e5e0",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: "13px",
            }}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <ReferenceLine
            x={findClosestStrike(filtered.map((s) => s.strike), data.spot_price)}
            stroke="#1a1a1a"
            strokeWidth={1.5}
          >
            <Label
              value={`Spot $${data.spot_price.toFixed(1)}`}
              position="top"
              offset={8}
              fill="#1a1a1a"
              fontSize={11}
              fontWeight={600}
            />
          </ReferenceLine>
          {data.flip_point && (
            <ReferenceLine
              x={findClosestStrike(filtered.map((s) => s.strike), data.flip_point)}
              stroke="#b8860b"
              strokeDasharray="5 5"
              strokeWidth={1.5}
            >
              <Label
                value={`Flip $${data.flip_point.toFixed(1)}`}
                position="top"
                offset={22}
                fill="#b8860b"
                fontSize={11}
                fontWeight={500}
              />
            </ReferenceLine>
          )}
          {data.max_pain && (
            <ReferenceLine
              x={findClosestStrike(filtered.map((s) => s.strike), data.max_pain)}
              stroke="#7c5cbf"
              strokeDasharray="3 3"
              strokeWidth={1.5}
            >
              <Label
                value={`MaxPain $${data.max_pain.toFixed(1)}`}
                position="top"
                offset={36}
                fill="#7c5cbf"
                fontSize={11}
                fontWeight={500}
              />
            </ReferenceLine>
          )}
          <Bar dataKey="call_gex" name="Call GEX" radius={[3, 3, 0, 0]}>
            {filtered.map((_, i) => (
              <Cell key={i} fill="#2d8a56" />
            ))}
          </Bar>
          <Bar dataKey="put_gex" name="Put GEX" radius={[0, 0, 3, 3]}>
            {filtered.map((_, i) => (
              <Cell key={i} fill="#c23b3b" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-guide">
        <p><strong>X-axis:</strong> Strike prices (+/- 10% from spot). <strong>Y-axis:</strong> GEX in dollars -- hedging pressure market makers exert at each strike.</p>
        <p>Tall green bars = strong support (MM sell rallies, buy dips). Tall red bars = acceleration zone (MM sell dips, buy rallies).</p>
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
