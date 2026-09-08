import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDashed,
  Database,
  FileSearch,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { useLocation } from "wouter";
import FinanceLayout, { type MarketFilters, useMarketFinanceFilters } from "./FinanceLayout";
import {
  aggregateTemporal,
  clean,
  dimensionFilterKeys,
  dimensionLabels,
  integer,
  money,
  monthNames,
  percent,
  periodLabel,
  scenarioLabel,
  type VariationSort,
} from "./FinanceMarketUtils";
import {
  ComparisonBridge,
  EmptyState,
  Legend,
  LoadingGrid,
  MetricCard,
  NarrativeCard,
  QueryErrorState,
  RelevanceBeacon,
  RoadmapStep,
  ScenarioBadge,
  SortHeader,
} from "./FinanceMarketComponents";
import { TemporalChart } from "./FinanceMarketCharts";
export function Variation() {
  const { filters, setFilter, analysis, analysisMonths } = useMarketFinanceFilters();
  const [, navigate] = useLocation();
  const [by, setBy] = useState<keyof typeof dimensionLabels>("brand");
  const [viewMode, setViewMode] = useState<"impact" | "increase" | "decrease">("impact");
  const [sort, setSort] = useState<{
    key: VariationSort;
    direction: "asc" | "desc";
  }>({
    key: "delta",
    direction: "desc",
  });
  const query = trpc.marketFinance.variation.useQuery({
    filters,
    by,
    analysis: { scenarioMode: analysis.scenarioMode, months: analysisMonths },
  });
  const rows = query.data ?? [];
  const max = Math.max(...rows.map(item => Math.abs(item.delta)), 1);
  const total = rows.reduce((sum, item) => sum + item.delta, 0);
  const increases = rows.filter(item => item.delta > 0).reduce((sum, item) => sum + item.delta, 0);
  const reductions = rows
    .filter(item => item.delta < 0)
    .reduce((sum, item) => sum + Math.abs(item.delta), 0);
  const real25 = rows.reduce((sum, item) => sum + item.real2025, 0);
  const real26 = rows.reduce((sum, item) => sum + item.real2026, 0);
  const valid = rows[0]?.comparisonValid ?? analysis.scenarioMode !== "forecast";
  const windowLabel = periodLabel(analysisMonths);
  const visible = useMemo(
    () =>
      rows
        .filter(
          item =>
            viewMode === "impact" || (viewMode === "increase" ? item.delta > 0 : item.delta < 0)
        )
        .sort((a, b) => {
          const direction = sort.direction === "asc" ? 1 : -1;
          if (sort.key === "label") return a.label.localeCompare(b.label, "pt-BR") * direction;
          const av = Number(a[sort.key] ?? Number.NEGATIVE_INFINITY);
          const bv = Number(b[sort.key] ?? Number.NEGATIVE_INFINITY);
          return (av - bv) * direction;
        }),
    [rows, viewMode, sort]
  );
  const toggleSort = (key: VariationSort) =>
    setSort(current =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "label" ? "asc" : "desc" }
    );
  const nextDimension: Partial<Record<keyof typeof dimensionLabels, keyof typeof dimensionLabels>> =
    {
      brand: "category",
      businessUnit: "category",
      modality: "product",
      product: "category",
      category: "account",
      account: "costCenter",
      month: "category",
      entryType: "category",
    };
  const explore = (item: (typeof rows)[number]) => {
    setFilter(dimensionFilterKeys[by], [by === "month" ? Number(item.key) : item.key] as any);
    const next = nextDimension[by];
    if (next) setBy(next);
    else navigate(`/finance/transactions${window.location.search}`);
  };
  if (query.error)
    return (
      <QueryErrorState
        onRetry={() => void query.refetch()}
        occurredAt={query.errorUpdatedAt}
        message={query.error.message}
      />
    );
  return (
    <div className="space-y-5">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="nexus-kicker">Macro → causa → lançamento · {windowLabel}</p>
          <h2 className="nexus-heading mt-2 text-2xl font-semibold text-white">
            Variation Explorer
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-content-tertiary">
            Clique em qualquer cabeçalho para ordenar. Vermelho representa aumento de investimento e
            verde representa redução; a cor indica temperatura do gasto, não desempenho.
          </p>
        </div>
        <Select value={by} onValueChange={value => setBy(value as any)}>
          <SelectTrigger className="h-11 w-full border-white/10 bg-white/[0.03] sm:w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(dimensionLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
      {valid ? (
        <ComparisonBridge
          real25={real25}
          increases={increases}
          reductions={reductions}
          real26={real26}
          yoy={real25 ? total / Math.abs(real25) : null}
          period={windowLabel}
          currentLabel={analysis.scenarioMode === "outlook" ? "Outlook" : "Real"}
        />
      ) : (
        <section
          className={
            "grid gap-3 rounded-3xl border border-[var(--brand-violet)]/15 " +
            "bg-[var(--brand-violet)]/[0.045] p-5 md:grid-cols-2"
          }
        >
          <MetricCard
            eyebrow={`${scenarioLabel[analysis.scenarioMode]} 2026 · ${windowLabel}`}
            value={money(real26)}
            detail={`${rows.length} drivers no contexto`}
            tone="forecast"
          />
          <NarrativeCard
            icon={ShieldCheck}
            title="Comparação protegida"
            text={
              "Forecast \u00E9 analisado por valor e composi\u00E7\u00E3o. O " +
              "Nexus n\u00E3o apresenta esse cen\u00E1rio como YoY realizado."
            }
          />
        </section>
      )}
      <section className="nexus-surface overflow-hidden rounded-3xl">
        <div
          className={
            "flex flex-col justify-between gap-3 border-b " +
            "border-white/[0.06] p-4 sm:flex-row sm:items-center"
          }
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.16em] text-content-tertiary">
              Drivers por {dimensionLabels[by]}
            </p>
            <p className="mt-1 text-xs text-content-tertiary">
              {visible.length} componentes · ordenação ativa:{" "}
              {sort.key === "label"
                ? dimensionLabels[by]
                : sort.key === "real2025"
                  ? "Real 25"
                  : sort.key === "real2026"
                    ? `${scenarioLabel[analysis.scenarioMode]} 26`
                    : sort.key === "shareReal2026"
                      ? "Mix 26"
                      : sort.key === "movementShare"
                        ? "Relevância"
                        : sort.key.toUpperCase()}{" "}
              {sort.direction === "asc" ? "↑" : "↓"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
            {(
              [
                { key: "impact", label: "Todos" },
                { key: "increase", label: "Aumentos" },
                { key: "decrease", label: "Reduções" },
              ] as const
            ).map(option => (
              <button
                key={option.key}
                onClick={() => setViewMode(option.key)}
                className={
                  "rounded-lg px-3 py-2 text-[11px] font-semibold transition " +
                  (viewMode === option.key
                    ? "bg-white/[0.09] text-white"
                    : "text-content-tertiary hover:text-content-secondary")
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[1060px]">
            <div
              className={
                "grid grid-cols-[minmax(250px,1fr)_100px_100px_110px_75px_80px_120px_140px] gap-3 border-b " +
                "border-white/[0.06] px-5 py-3 text-[11px] " +
                "font-bold uppercase tracking-[.14em] text-content-tertiary"
              }
            >
              <SortHeader
                label={dimensionLabels[by]}
                sortKey="label"
                active={sort.key === "label"}
                direction={sort.direction}
                onSort={toggleSort}
                align="left"
              />
              <SortHeader
                label="Real 25"
                sortKey="real2025"
                active={sort.key === "real2025"}
                direction={sort.direction}
                onSort={toggleSort}
              />
              <SortHeader
                label={`${scenarioLabel[analysis.scenarioMode]} 26`}
                sortKey="real2026"
                active={sort.key === "real2026"}
                direction={sort.direction}
                onSort={toggleSort}
              />
              <SortHeader
                label={valid ? "Delta" : "Valor"}
                sortKey="delta"
                active={sort.key === "delta"}
                direction={sort.direction}
                onSort={toggleSort}
              />
              <SortHeader
                label="YoY"
                sortKey="yoy"
                active={sort.key === "yoy"}
                direction={sort.direction}
                onSort={toggleSort}
              />
              <SortHeader
                label="Mix 26"
                sortKey="shareReal2026"
                active={sort.key === "shareReal2026"}
                direction={sort.direction}
                onSort={toggleSort}
              />
              <SortHeader
                label="Relevância"
                sortKey="movementShare"
                active={sort.key === "movementShare"}
                direction={sort.direction}
                onSort={toggleSort}
                align="left"
              />
              <span />
            </div>
            <div className="max-h-[620px] overflow-auto">
              {query.isLoading ? (
                <div className="p-5">
                  <Skeleton className="h-96 rounded-2xl bg-white/[0.04]" />
                </div>
              ) : (
                visible.slice(0, 100).map(item => (
                  <div
                    key={item.key}
                    className={
                      "group grid grid-cols-[minmax(250px,1fr)_100px_100px_110px_75px_80px_120px_140px] " +
                      "items-center gap-3 border-b border-white/[0.045] " +
                      "px-5 py-3 hover:bg-white/[0.025]"
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border " +
                            (item.delta > 0
                              ? "border-rose-400/15 bg-rose-400/[0.06] text-rose-300"
                              : item.delta < 0
                                ? "border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-200"
                                : "border-white/10 bg-white/[0.03] text-content-tertiary")
                          }
                        >
                          {item.delta > 0 ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : item.delta < 0 ? (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <span className="truncate text-xs font-semibold text-content-secondary">
                          {by === "month" ? monthNames[Number(item.key) - 1] : item.label}
                        </span>
                      </div>
                      <div
                        className={
                          "relative mt-2 grid h-1.5 grid-cols-2 " +
                          "overflow-hidden rounded-full bg-white/[0.025]"
                        }
                      >
                        <div className="flex justify-end border-r border-white/10">
                          {item.delta < 0 && (
                            <span
                              className="h-full rounded-l-full bg-emerald-300/70"
                              style={{
                                width: `${Math.max(3, (Math.abs(item.delta) / max) * 100)}%`,
                              }}
                            />
                          )}
                        </div>
                        <div>
                          {item.delta > 0 && (
                            <span
                              className="block h-full rounded-r-full bg-rose-400/75"
                              style={{
                                width: `${Math.max(3, (Math.abs(item.delta) / max) * 100)}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-right text-[11px] tabular-nums text-content-tertiary">
                      {valid ? money(item.real2025) : "—"}
                    </span>
                    <span className="text-right text-[11px] tabular-nums text-content-secondary">
                      {money(item.real2026)}
                    </span>
                    <span
                      className={
                        "text-right text-[11px] font-semibold tabular-nums " +
                        (item.delta > 0
                          ? "text-rose-300"
                          : item.delta < 0
                            ? "text-emerald-200"
                            : "text-content-tertiary")
                      }
                    >
                      {item.delta > 0 ? "+" : ""}
                      {money(item.delta)}
                    </span>
                    <span
                      className={
                        "mx-auto rounded-full px-2 py-1 " +
                        "text-center text-[11px] font-bold tabular-nums " +
                        (item.yoy === null
                          ? "text-content-tertiary"
                          : item.yoy > 0
                            ? "bg-rose-400/[0.08] text-rose-300"
                            : item.yoy < 0
                              ? "bg-emerald-300/[0.07] text-emerald-200"
                              : "text-content-tertiary")
                      }
                    >
                      {percent(item.yoy)}
                    </span>
                    <span className="text-right text-[11px] tabular-nums text-content-tertiary">
                      {percent(item.shareReal2026)}
                    </span>
                    <RelevanceBeacon share={item.movementShare} />
                    <Button
                      size="sm"
                      variant="outline"
                      className={
                        "h-8 border-white/[0.08] bg-white/[0.025] text-[11px] text-content-tertiary " +
                        "hover:border-[var(--brand-accent)]/20 hover:text-[var(--brand-accent-soft)]"
                      }
                      onClick={() => explore(item)}
                    >
                      {nextDimension[by]
                        ? `Explorar ${dimensionLabels[nextDimension[by]!]}`
                        : "Ver lançamentos"}
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
