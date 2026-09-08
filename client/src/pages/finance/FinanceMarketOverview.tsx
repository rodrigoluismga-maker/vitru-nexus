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
  type MonthlyPoint,
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
import { DriverComparisonTable, MonthlyComparisonTable } from "./FinanceMarketOverviewTables";
export function Overview() {
  const { filters, setFilter, analysis, analysisMonths } = useMarketFinanceFilters();
  const [, navigate] = useLocation();
  const [compositionBy, setCompositionBy] = useState<keyof typeof dimensionLabels>("brand");
  const [visual, setVisual] = useState<"bars" | "waterfall" | "cumulative">("bars");
  const comparableFilters = useMemo(() => ({ ...filters, months: [] }), [filters]);
  const query = trpc.marketFinance.overview.useQuery({
    filters,
    compositionBy,
    analysis: { scenarioMode: analysis.scenarioMode, months: analysisMonths },
  });
  const comparableQuery = trpc.marketFinance.overview.useQuery({
    filters: comparableFilters,
    compositionBy,
    analysis: { scenarioMode: "actual", months: [1, 2, 3, 4, 5, 6, 7] },
  });
  const data = query.data;
  const comparable = comparableQuery.data;
  const monthly = useMemo<MonthlyPoint[]>(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const get = (year: number, scenario: "actual" | "forecast") =>
          data?.monthly.find(
            item => item.year === year && item.month === month && item.scenario === scenario
          )?.amount ?? null;
        return {
          month: monthNames[index],
          monthNumber: month,
          real25: get(2025, "actual"),
          real26: get(2026, "actual"),
          forecast26: get(2026, "forecast"),
        };
      }),
    [data?.monthly]
  );
  const temporal = useMemo(
    () => aggregateTemporal(monthly, analysis.grain, analysis.scenarioMode, analysisMonths),
    [monthly, analysis.grain, analysis.scenarioMode, analysisMonths.join(",")]
  );
  const tableRows = useMemo(
    () =>
      monthly
        .filter(row => analysisMonths.includes(row.monthNumber))
        .map(row => ({
          ...row,
          real26: analysis.scenarioMode === "forecast" ? null : row.real26,
          forecast26: analysis.scenarioMode === "actual" ? null : row.forecast26,
        }))
        .filter(row => row.real25 !== null || row.real26 !== null || row.forecast26 !== null),
    [monthly, analysis.scenarioMode, analysisMonths.join(",")]
  );
  if (query.isLoading || comparableQuery.isLoading) return <LoadingGrid />;
  if (query.error || comparableQuery.error)
    return (
      <QueryErrorState
        onRetry={() => void Promise.all([query.refetch(), comparableQuery.refetch()])}
        occurredAt={Math.max(query.errorUpdatedAt, comparableQuery.errorUpdatedAt)}
        message={(query.error ?? comparableQuery.error)?.message}
      />
    );
  if (!data || !comparable) return <EmptyState />;
  const k = data.kpis;
  const windowLabel = periodLabel(analysisMonths);
  const valid = data.analysis.comparisonValid;
  const leadingIncrease = data.composition
    .filter(item => item.delta > 0)
    .sort((a, b) => b.delta - a.delta)[0];
  const leadingReduction = data.composition
    .filter(item => item.delta < 0)
    .sort((a, b) => a.delta - b.delta)[0];
  const noCurrentData = k.realJanJul26Transactions === 0;
  const insight = noCurrentData
    ? `Nenhum lançamento encontrado para ${scenarioLabel[analysis.scenarioMode]} 2026 em ${windowLabel} com os filtros selecionados.`
    : valid
      ? "" +
        scenarioLabel[analysis.scenarioMode] +
        " 2026 ficou " +
        percent(Math.abs(k.yoyYtd ?? 0)) +
        " " +
        (k.deltaYtd >= 0 ? "acima" : "abaixo") +
        " de 2025 em " +
        windowLabel +
        " (" +
        (k.deltaYtd >= 0 ? "+" : "") +
        money(k.deltaYtd) +
        ")." +
        (leadingIncrease
          ? ` ${leadingIncrease.label} lidera os aumentos com +${money(leadingIncrease.delta)}.`
          : "") +
        (leadingReduction
          ? ` ${leadingReduction.label} compensa parte do movimento com ${money(leadingReduction.delta)}.`
          : "")
      : analysis.scenarioMode === "forecast"
        ? "O Forecast selecionado totaliza " +
          money(k.realJanJul26) +
          " em " +
          windowLabel +
          ". N\u00E3o h\u00E1 YoY porque Forecast n\u00E3o \u00E9 Realizado."
        : "A janela " +
          windowLabel +
          (" cont\u00E9m meses sem Realizado fechado em 2026. O valor \u00E9 " +
            "exibido, mas o YoY foi bloqueado para evitar compara\u00E7\u00E3o incompleta.");
  return (
    <div className="space-y-5">
      <section>
        <p className="nexus-kicker">
          {scenarioLabel[analysis.scenarioMode]} · {windowLabel}
        </p>
        <h2 className="nexus-heading mt-2 text-2xl font-semibold text-white">
          Comparação temporal sob seu controle
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-content-tertiary">
          Escolha cenário, meses e granularidade no contexto analítico. YoY só aparece em janelas
          metodologicamente comparáveis.
        </p>
      </section>
      <section>
        <p className="nexus-kicker">Capítulo 1 · Realizado comparável</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Jan–Jul/25 × Jan–Jul/26</h3>
        <div className="mt-3">
          <ComparisonBridge
            real25={comparable.kpis.realJanJul25}
            increases={comparable.movement.increases}
            reductions={comparable.movement.reductions}
            real26={comparable.kpis.realJanJul26}
            yoy={comparable.kpis.yoyYtd}
            period="Jan–Jul"
            currentLabel="Real"
          />
        </div>
      </section>
      <section className="rounded-3xl border border-[var(--brand-violet)]/12 bg-[linear-gradient(135deg,rgba(166,137,247,.07),rgba(166,137,247,.02))] p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CircleDashed className="h-4 w-4 text-[var(--brand-violet)]" />
          <p className="nexus-kicker text-[var(--brand-violet-soft)]">Capítulo 2 · Outlook anual</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <MetricCard
            eyebrow="Realizado Jan–Jul/26"
            value={money(comparable.kpis.realJanJul26)}
            detail={`${integer(comparable.kpis.realJanJul26Transactions)} lançamentos realizados`}
          />
          <MetricCard
            eyebrow="Forecast Ago–Dez/26"
            value={money(k.forecastRemaining26)}
            detail="Projeção restante · não é Realizado"
            tone="forecast"
            icon={CircleDashed}
          />
          <MetricCard
            eyebrow="Outlook FY26"
            value={money(k.outlookFY26)}
            detail={`${k.outlookDelta >= 0 ? "+" : ""}${money(k.outlookDelta)} · ${percent(k.outlookYoY)} vs Real FY25 de ${money(k.realFY25)}`}
            tone="forecast"
            icon={Sparkles}
          />
        </div>
      </section>
      <section
        className={
          "flex flex-col justify-between gap-4 rounded-2xl border " +
          "border-[var(--brand-accent)]/10 " +
          "bg-[var(--brand-accent)]/[0.035] p-5 sm:flex-row sm:items-center"
        }
      >
        <div>
          <p
            className={
              "text-[11px] font-bold uppercase " +
              "tracking-[.16em] text-[var(--brand-accent-soft)]"
            }
          >
            Síntese factual
          </p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-content-secondary">{insight}</p>
        </div>
        <Button
          variant="outline"
          className={
            "shrink-0 border-[var(--brand-accent)]/18 " +
            "bg-[var(--brand-accent)]/[0.06] text-[var(--brand-accent-soft)]"
          }
          onClick={() => navigate(`/finance/variation${window.location.search}`)}
        >
          Abrir decomposição
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="nexus-surface rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="nexus-kicker">Janeiro a dezembro</p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                {analysis.scenarioMode === "outlook"
                  ? "Real 2025 × Atual 2026"
                  : analysis.scenarioMode === "actual"
                    ? "Real 2025 × Realizado 2026"
                    : "Forecast 2026"}{" "}
                ·{" "}
                {analysis.grain === "month"
                  ? "por mês"
                  : analysis.grain === "quarter"
                    ? "por trimestre"
                    : "por semestre"}
              </h3>
              <p className="mt-1 text-[11px] text-content-tertiary">
                {analysis.scenarioMode === "outlook"
                  ? "Realizado Jan–Jul em amarelo e Forecast Ago–Dez em violeta, sempre comparados ao Real 2025."
                  : analysis.scenarioMode === "actual"
                    ? "Somente Realizado 2026; meses sem fechamento permanecem vazios."
                    : "Somente Forecast 2026; não é apresentado como Realizado."}
              </p>
            </div>
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
              {(
                [
                  { key: "bars", label: "Comparativo" },
                  { key: "waterfall", label: "Waterfall" },
                  { key: "cumulative", label: "Acumulado" },
                ] as const
              ).map(item => (
                <button
                  key={item.key}
                  onClick={() => setVisual(item.key)}
                  className={
                    "rounded-lg px-3 py-2 text-[11px] font-semibold transition " +
                    (visual === item.key
                      ? "bg-white/[0.09] text-white"
                      : "text-content-tertiary hover:text-content-secondary")
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-5 h-[330px]">
            <TemporalChart
              data={temporal}
              visual={visual}
              mode={analysis.scenarioMode}
              onSelect={months => setFilter("months", months)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-content-tertiary">
            {analysis.scenarioMode !== "forecast" && (
              <Legend color="var(--neutral-slate)" label="Real 2025" />
            )}
            {analysis.scenarioMode === "actual" && (
              <Legend color="var(--brand-accent)" label="Realizado 2026" />
            )}
            {analysis.scenarioMode === "forecast" && (
              <Legend color="var(--brand-violet)" label="Forecast 2026" />
            )}
            {analysis.scenarioMode === "outlook" && (
              <>
                <Legend color="var(--brand-accent)" label="Realizado 2026" />
                <Legend color="var(--brand-violet)" label="Forecast 2026" />
              </>
            )}
            <span>Clique em um período para filtrar todo o módulo.</span>
          </div>
          <div className="mt-5 border-t border-white/[0.06] pt-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[.15em] text-content-tertiary">
              Detalhamento mensal auditável
            </p>
            <MonthlyComparisonTable
              rows={tableRows}
              onSelect={month => setFilter("months", [month])}
            />
          </div>
        </section>
        <section className="nexus-surface rounded-3xl p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="nexus-kicker">Quem explica o movimento</p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                Drivers do {valid ? "delta" : "valor"}
              </h3>
            </div>
            <Select value={compositionBy} onValueChange={value => setCompositionBy(value as any)}>
              <SelectTrigger className="h-9 w-[140px] border-white/10 bg-black/20 text-xs">
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
          </div>
          <div className="mt-4">
            <DriverComparisonTable
              rows={data.composition.map(item => ({
                ...item,
                shareReal2026: item.shareReal2026 ?? 0,
                movementShare: item.movementShare ?? 0,
                label: compositionBy === "month" ? monthNames[Number(item.key) - 1] : item.label,
              }))}
              onSelect={item =>
                setFilter(dimensionFilterKeys[compositionBy], [
                  compositionBy === "month" ? Number(item.key) : item.key,
                ] as any)
              }
            />
          </div>
        </section>
      </div>
      <section className="grid gap-3 md:grid-cols-2">
        <NarrativeCard
          icon={Target}
          title="Base transacional do recorte"
          text={
            "" +
            integer(k.realJanJul26Transactions) +
            " lan\u00E7amentos sustentam " +
            scenarioLabel[analysis.scenarioMode] +
            " 2026 em " +
            windowLabel +
            "."
          }
        />
        <NarrativeCard
          icon={AlertTriangle}
          title="Pontos de atenção"
          text={
            "" +
            data.attention.length +
            (" observa\u00E7\u00F5es da fonte est\u00E3o dispon\u00EDveis para " +
              "leitura metodol\u00F3gica; elas n\u00E3o s\u00E3o causalidade autom\u00E1tica.")
          }
        />
      </section>
    </div>
  );
}
