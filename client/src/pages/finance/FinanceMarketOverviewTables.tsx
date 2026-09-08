import { ArrowDown, ArrowRight, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { money, percent, type MonthlyPoint } from "./FinanceMarketUtils";
import { RelevanceBeacon } from "./FinanceMarketComponents";

type Direction = "asc" | "desc";

function Header({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: Direction;
  onClick: () => void;
}) {
  const Icon = !active ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 whitespace-nowrap font-semibold text-content-tertiary hover:text-white"
    >
      {label}
      <Icon className="h-3 w-3" />
    </button>
  );
}

export function MonthlyComparisonTable({
  rows,
  onSelect,
}: {
  rows: MonthlyPoint[];
  onSelect: (month: number) => void;
}) {
  const [sort, setSort] = useState("month");
  const [direction, setDirection] = useState<Direction>("asc");
  const toggle = (key: string) => {
    if (sort === key) setDirection(value => (value === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDirection(key === "month" ? "asc" : "desc");
    }
  };
  const data = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const value = (row: MonthlyPoint) =>
          sort === "month"
            ? row.monthNumber
            : sort === "real25"
              ? (row.real25 ?? -Infinity)
              : sort === "actual"
                ? (row.real26 ?? -Infinity)
                : sort === "forecast"
                  ? (row.forecast26 ?? -Infinity)
                  : sort === "outlook"
                    ? (row.real26 ?? row.forecast26 ?? -Infinity)
                    : sort === "delta"
                      ? (row.real26 ?? row.forecast26) != null && row.real25 != null
                        ? (row.real26 ?? row.forecast26)! - row.real25
                        : -Infinity
                      : (row.real26 ?? row.forecast26) != null && row.real25
                        ? ((row.real26 ?? row.forecast26)! - row.real25) / Math.abs(row.real25)
                        : -Infinity;
        const result = value(a) - value(b);
        return direction === "asc" ? result : -result;
      }),
    [rows, sort, direction]
  );
  if (!rows.length)
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-xs text-content-tertiary">
        Nenhum mês possui fatos para o cenário, período e dimensões selecionados.
      </div>
    );
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
      <table className="w-full min-w-[940px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] bg-white/[0.025]">
            <th className="px-3 py-3">
              <Header
                label="Mês"
                active={sort === "month"}
                direction={direction}
                onClick={() => toggle("month")}
              />
            </th>
            {[
              ["real25", "Real 2025"],
              ["actual", "Realizado 2026"],
              ["forecast", "Forecast 2026"],
              ["outlook", "Outlook 2026"],
              ["delta", "Delta"],
              ["yoy", "YoY"],
            ].map(([key, label]) => (
              <th key={key} className="px-3 py-3 text-right">
                <Header
                  label={label}
                  active={sort === key}
                  direction={direction}
                  onClick={() => toggle(key)}
                />
              </th>
            ))}
            <th className="px-3 py-3">Cenário 2026</th>
            <th className="px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {data.map(row => {
            const current = row.real26 ?? row.forecast26;
            const delta = current != null && row.real25 != null ? current - row.real25 : null;
            const yoy = delta != null && row.real25 ? delta / Math.abs(row.real25) : null;
            const actual = row.real26 != null;
            const forecast = row.forecast26 != null;
            return (
              <tr
                key={row.monthNumber}
                className="border-b border-white/[0.04] hover:bg-white/[0.025]"
              >
                <td className="px-3 py-3 font-semibold text-white">{row.month}</td>
                <td className="px-3 py-3 text-right text-content-tertiary">
                  {row.real25 == null ? "—" : money(row.real25, false)}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-[var(--brand-accent-soft)]">
                  {row.real26 == null ? "—" : money(row.real26, false)}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-[var(--brand-violet-soft)]">
                  {row.forecast26 == null ? "—" : money(row.forecast26, false)}
                </td>
                <td className="px-3 py-3 text-right font-semibold text-white">
                  {current == null ? "—" : money(current, false)}
                </td>
                <td
                  className={`px-3 py-3 text-right font-semibold ${delta == null ? "text-content-tertiary" : delta >= 0 ? "text-[var(--direction-up-soft)]" : "text-cyan-200"}`}
                >
                  {delta == null ? "—" : `${delta >= 0 ? "+" : ""}${money(delta, false)}`}
                </td>
                <td
                  className={`px-3 py-3 text-right font-semibold ${yoy == null ? "text-content-tertiary" : yoy >= 0 ? "text-[var(--direction-up-soft)]" : "text-cyan-200"}`}
                >
                  {yoy == null ? "—" : `${yoy >= 0 ? "+" : ""}${percent(yoy)}`}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${actual ? "bg-[var(--brand-accent)]/10 text-[var(--brand-accent-soft)]" : forecast ? "bg-[var(--brand-violet)]/10 text-[var(--brand-violet-soft)]" : "bg-white/[0.05] text-content-tertiary"}`}
                  >
                    {actual ? "Realizado" : forecast ? "Forecast" : "Sem dado 2026"}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => onSelect(row.monthNumber)}
                    className="rounded-lg p-2 text-content-tertiary hover:bg-white/[0.06] hover:text-white"
                    aria-label={`Filtrar ${row.month}`}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type Driver = {
  key: string;
  label: string;
  real2025: number;
  real2026: number;
  delta: number;
  yoy: number | null;
  shareReal2026: number;
  movementShare: number;
};
export function DriverComparisonTable({
  rows,
  onSelect,
}: {
  rows: Driver[];
  onSelect: (row: Driver) => void;
}) {
  const [sort, setSort] = useState<keyof Driver>("delta");
  const [direction, setDirection] = useState<Direction>("desc");
  const toggle = (key: keyof Driver) => {
    if (sort === key) setDirection(value => (value === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDirection(key === "label" ? "asc" : "desc");
    }
  };
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const left = sort === "label" ? a.label : (a[sort] ?? -Infinity);
        const right = sort === "label" ? b.label : (b[sort] ?? -Infinity);
        const result =
          typeof left === "string"
            ? left.localeCompare(String(right), "pt-BR")
            : Number(left) - Number(right);
        return direction === "asc" ? result : -result;
      }),
    [rows, sort, direction]
  );
  if (!rows.length)
    return (
      <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-xs text-content-tertiary">
        Nenhum driver encontrado para o contexto selecionado.
      </div>
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] text-content-tertiary">
            <th className="px-2 py-3">
              <Header
                label="Driver"
                active={sort === "label"}
                direction={direction}
                onClick={() => toggle("label")}
              />
            </th>
            <th className="px-2 py-3 text-right">
              <Header
                label="2025"
                active={sort === "real2025"}
                direction={direction}
                onClick={() => toggle("real2025")}
              />
            </th>
            <th className="px-2 py-3 text-right">
              <Header
                label="2026"
                active={sort === "real2026"}
                direction={direction}
                onClick={() => toggle("real2026")}
              />
            </th>
            <th className="px-2 py-3 text-right">
              <Header
                label="Delta"
                active={sort === "delta"}
                direction={direction}
                onClick={() => toggle("delta")}
              />
            </th>
            <th className="px-2 py-3 text-right">
              <Header
                label="YoY"
                active={sort === "yoy"}
                direction={direction}
                onClick={() => toggle("yoy")}
              />
            </th>
            <th className="px-2 py-3 text-right">
              <Header
                label="Mix 26"
                active={sort === "shareReal2026"}
                direction={direction}
                onClick={() => toggle("shareReal2026")}
              />
            </th>
            <th className="px-2 py-3">
              <Header
                label="Relevância"
                active={sort === "movementShare"}
                direction={direction}
                onClick={() => toggle("movementShare")}
              />
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 7).map(item => (
            <tr key={item.key} className="border-b border-white/[0.04] hover:bg-white/[0.025]">
              <td className="px-2 py-3 font-semibold text-white">{item.label}</td>
              <td className="px-2 py-3 text-right text-content-tertiary">
                {money(item.real2025, false)}
              </td>
              <td className="px-2 py-3 text-right text-content-secondary">
                {money(item.real2026, false)}
              </td>
              <td
                className={`px-2 py-3 text-right font-semibold ${item.delta >= 0 ? "text-[var(--direction-up-soft)]" : "text-cyan-200"}`}
              >
                {item.delta >= 0 ? "+" : ""}
                {money(item.delta, false)}
              </td>
              <td
                className={`px-2 py-3 text-right font-semibold ${item.yoy == null ? "text-content-tertiary" : item.yoy >= 0 ? "text-[var(--direction-up-soft)]" : "text-cyan-200"}`}
              >
                {item.yoy == null ? "—" : `${item.yoy >= 0 ? "+" : ""}${percent(item.yoy)}`}
              </td>
              <td className="px-2 py-3 text-right text-content-tertiary">
                {percent(item.shareReal2026)}
              </td>
              <td className="px-2 py-3">
                <RelevanceBeacon share={item.movementShare} />
              </td>
              <td>
                <button
                  onClick={() => onSelect(item)}
                  className="rounded-lg p-2 text-content-tertiary hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
