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
        <BarChart
          data={filtered}
          stackOffset="sign"
          margin={{ top: 52, right: 24, left: 16, bottom: 8 }}
        >
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
                  <div style={{ color: "#2d8a56" }}>Call GEX: {formatGex(d.call_gex)}</div>
                  <div style={{ color: "#c23b3b" }}>Put GEX: {formatGex(d.put_gex)}</div>
                  <div style={{ borderTop: "1px solid #e8e5e0", marginTop: 4, paddingTop: 4, fontWeight: 500 }}>
                    Net: {formatGex(d.net_gex)}
                  </div>
                </div>
              );
            }}
            cursor={{ fill: "rgba(0,0,0,0.03)" }}
          />
          <ReferenceLine y={0} stroke="#ccc" />
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
          <Bar dataKey="call_gex" name="Call GEX" stackId="gex" fill="#2d8a56" />
          <Bar dataKey="put_gex" name="Put GEX" stackId="gex" fill="#c23b3b" />
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-guide">
        <p><strong>X-axis:</strong> Strike prices (+/- 10% from spot). <strong>Y-axis:</strong> GEX in dollars -- hedging pressure market makers exert at each strike.</p>
        <p>Green bars (up) = call gamma, stabilizing. Red bars (down) = put gamma, destabilizing. Hover for breakdown.</p>
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
