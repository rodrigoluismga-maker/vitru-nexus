import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { money, scenarioLabel, type TemporalPoint } from "./FinanceMarketUtils";

export function TemporalChart({
  data,
  visual,
  mode,
  onSelect,
}: {
  data: TemporalPoint[];
  visual: "bars" | "waterfall" | "cumulative";
  mode: "actual" | "forecast" | "outlook";
  onSelect: (months: number[]) => void;
}) {
  const isMonthly = data.every(item => item.months.length === 1);
  const currentColor =
    mode === "forecast"
      ? "var(--brand-violet)"
      : mode === "outlook"
        ? "var(--brand-violet-soft)"
        : "var(--brand-accent)";
  if (visual === "cumulative")
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          onClick={(state: any) =>
            state?.activePayload?.[0] && onSelect(state.activePayload[0].payload.months)
          }
        >
          <defs>
            <linearGradient id="currentCumulative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={currentColor} stopOpacity={0.23} />
              <stop offset="1" stopColor={currentColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={value => money(value)}
            tick={{ fill: "rgba(255,255,255,.32)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="cumulativeReference"
            name="Acumulado 2025"
            stroke="var(--neutral-slate)"
            fill="transparent"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="cumulativeCurrent"
            name={`Acumulado ${scenarioLabel[mode]} 2026`}
            stroke={currentColor}
            fill="url(#currentCumulative)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  if (visual === "waterfall")
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          onClick={(state: any) =>
            state?.activePayload?.[0] && onSelect(state.activePayload[0].payload.months)
          }
        >
          <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={value => money(value)}
            tick={{ fill: "rgba(255,255,255,.32)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<ChartTooltip />} />
          <Bar
            dataKey={mode === "forecast" ? "current" : "delta"}
            name={mode === "forecast" ? "Forecast 2026" : "Variação YoY"}
            radius={[5, 5, 5, 5]}
            maxBarSize={34}
          >
            {data.map((item, index) => (
              <Cell
                key={index}
                fill={
                  mode === "forecast"
                    ? "var(--brand-violet)"
                    : (item.delta ?? 0) >= 0
                      ? "var(--direction-up)"
                      : "var(--direction-down)"
                }
                fillOpacity={item.selected ? 1 : 0.35}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        barGap={3}
        onClick={(state: any) =>
          state?.activePayload?.[0] && onSelect(state.activePayload[0].payload.months)
        }
      >
        <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,.4)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={value => money(value)}
          tick={{ fill: "rgba(255,255,255,.32)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={72}
        />
        <Tooltip content={<ChartTooltip />} />
        {mode !== "forecast" && (
          <Bar
            dataKey="reference"
            name="Real 2025"
            fill="var(--neutral-slate)"
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          >
            {data.map((item, index) => (
              <Cell
                key={index}
                fill="var(--neutral-slate)"
                fillOpacity={item.selected ? 0.9 : 0.28}
              />
            ))}
          </Bar>
        )}
        {mode === "forecast" ? (
          <Bar
            dataKey="current"
            name={`${scenarioLabel[mode]} 2026`}
            fill={currentColor}
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          >
            {data.map((item, index) => (
              <Cell key={index} fill={currentColor} fillOpacity={item.selected ? 1 : 0.28} />
            ))}
          </Bar>
        ) : mode === "actual" || isMonthly ? (
          <Bar
            dataKey="current"
            name={mode === "actual" ? "Realizado 2026" : "Atual 2026"}
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          >
            {data.map((item, index) => (
              <Cell
                key={index}
                fill={item.actual != null ? "var(--brand-accent)" : "var(--brand-violet)"}
                fillOpacity={item.selected ? 1 : 0.55}
              />
            ))}
          </Bar>
        ) : (
          <>
            <Bar
              dataKey="actual"
              name="Realizado 2026"
              stackId="outlook26"
              fill="var(--brand-accent)"
              radius={[5, 5, 0, 0]}
              maxBarSize={22}
            />
            <Bar
              dataKey="forecast"
              name="Forecast 2026"
              stackId="outlook26"
              fill="var(--brand-violet)"
              radius={[5, 5, 0, 0]}
              maxBarSize={22}
            />
          </>
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const values = Object.fromEntries(payload.map((item: any) => [item.dataKey, item.value]));
  const current = values.actual ?? values.forecast ?? values.current;
  const delta = values.reference != null && current != null ? current - values.reference : null;
  const yoy = delta != null && values.reference ? delta / Math.abs(values.reference) : null;
  return (
    <div className="rounded-xl border border-white/10 bg-[var(--surface-1)]/95 p-3 shadow-2xl backdrop-blur-xl">
      <p className="text-[11px] font-semibold text-content-tertiary">{label}</p>
      {payload
        .filter((item: any) => item.value !== null)
        .map((item: any) => (
          <div key={item.name} className="mt-2 flex items-center justify-between gap-6 text-[11px]">
            <span style={{ color: item.color }}>{item.name}</span>
            <span className="font-semibold text-content-secondary">{money(item.value, false)}</span>
          </div>
        ))}
      {delta != null && (
        <div className="mt-3 flex items-center justify-between gap-6 border-t border-white/10 pt-2 text-[11px]">
          <span className="text-content-tertiary">Variação vs 2025</span>
          <span
            className={
              delta >= 0
                ? "font-semibold text-[var(--direction-up-soft)]"
                : "font-semibold text-cyan-200"
            }
          >
            {delta >= 0 ? "+" : ""}
            {money(delta, false)} ·{" "}
            {yoy != null ? `${yoy >= 0 ? "+" : ""}${(yoy * 100).toFixed(1)}%` : "—"}
          </span>
        </div>
      )}
    </div>
  );
}
