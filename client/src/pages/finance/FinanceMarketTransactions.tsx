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

export function Transactions() {
  const { filters, analysis, analysisMonths } = useMarketFinanceFilters();
  const [page, setPage] = useState(1);
  const [year, setYear] = useState("2026");
  const [search, setSearch] = useState("");
  const scenario =
    analysis.scenarioMode === "actual"
      ? ("actual" as const)
      : analysis.scenarioMode === "forecast"
        ? ("forecast" as const)
        : undefined;
  const query = trpc.marketFinance.transactions.useQuery({
    filters,
    scenario,
    year: year === "all" ? undefined : Number(year),
    search,
    page,
    pageSize: 50,
  });
  const pages = Math.max(1, Math.ceil((query.data?.total ?? 0) / 50));
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
      <section>
        <p className="nexus-kicker">
          Evidência e rastreabilidade · {scenarioLabel[analysis.scenarioMode]} ·{" "}
          {periodLabel(analysisMonths)}
        </p>
        <h2 className="nexus-heading mt-2 text-2xl font-semibold text-white">Lançamentos</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-content-tertiary">
          O cenário e os meses seguem o contexto analítico global. Aprofunde até a linha de origem,
          preservando valor gerencial, sinal contábil, lote e alertas de qualidade.
        </p>
      </section>
      <section className="nexus-surface rounded-2xl p-3">
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-content-tertiary" />
            <Input
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar histórico, conta ou categoria"
              className="h-10 border-white/10 bg-black/20 pl-9"
            />
          </div>
          <div
            className={`flex h-10 items-center rounded-md border px-3 text-[11px] font-semibold ${
              analysis.scenarioMode === "forecast"
                ? "border-[var(--brand-violet)]/15 bg-[var(--brand-violet)]/[0.08] text-[var(--brand-violet-soft)]"
                : "border-[var(--brand-accent)]/15 bg-[var(--brand-accent)]/[0.07] text-[var(--brand-accent-soft)]"
            }`}
          >
            {scenarioLabel[analysis.scenarioMode]}
          </div>
          <Select
            value={year}
            onValueChange={value => {
              setYear(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 border-white/10 bg-black/20 lg:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>
      <section className="nexus-surface overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead>
              <tr className="border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-[.14em] text-content-tertiary">
                <th className="px-5 py-4">Cenário / período</th>
                <th className="px-3 py-4">Marca · BU · Produto</th>
                <th className="px-3 py-4">Categoria / conta</th>
                <th className="px-3 py-4">Histórico</th>
                <th className="px-3 py-4 text-right">Gerencial</th>
                <th className="px-3 py-4 text-right">Contábil</th>
                <th className="px-3 py-4">Lineage</th>
              </tr>
            </thead>
            <tbody>
              {query.isLoading ? (
                <tr>
                  <td colSpan={7} className="p-5">
                    <Skeleton className="h-80 rounded-2xl bg-white/[0.04]" />
                  </td>
                </tr>
              ) : (
                query.data?.rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-white/[0.04] align-top hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4">
                      <ScenarioBadge scenario={row.scenario} />
                      <p className="mt-2 text-[11px] text-content-tertiary">{row.period}</p>
                      {row.manualEntry && (
                        <Badge className="mt-2 border-amber-400/15 bg-amber-400/[0.08] text-[11px] text-amber-300">
                          Manual
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-xs font-semibold text-content-secondary">
                        {clean(row.brand)}
                      </p>
                      <p className="mt-1 max-w-[180px] truncate text-[11px] text-content-tertiary">
                        {clean(row.businessUnit)} · {clean(row.product)}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="max-w-[190px] truncate text-xs text-content-secondary">
                        {clean(row.category)}
                      </p>
                      <p className="mt-1 max-w-[190px] truncate text-[11px] text-content-tertiary">
                        {clean(row.accountCode)} · {clean(row.accountName)}
                      </p>
                    </td>
                    <td className="max-w-[260px] px-3 py-4">
                      <p className="line-clamp-2 text-[11px] leading-5 text-content-tertiary">
                        {clean(row.history)}
                      </p>
                      {row.exactDuplicate && (
                        <Badge className="mt-2 border-rose-400/15 bg-rose-400/[0.08] text-[11px] text-rose-300">
                          Possível duplicidade
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-4 text-right text-xs font-semibold tabular-nums text-content-secondary">
                      {money(row.amountManagement, false)}
                    </td>
                    <td className="px-3 py-4 text-right text-[11px] tabular-nums text-content-tertiary">
                      {money(row.amountSigned, false)}
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-[11px] text-content-tertiary">
                        Linha Excel {row.sourceExcelRow}
                      </p>
                      <p className="mt-1 text-[11px] text-content-tertiary">
                        {clean(row.ledgerBatch)} / {clean(row.ledgerSubBatch)}
                      </p>
                      <p className="mt-1 max-w-[160px] truncate text-[11px] text-content-tertiary">
                        Origem: {clean(row.origin)}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-4">
          <p className="text-[11px] text-content-tertiary">
            {integer(query.data?.total ?? 0)} lançamentos no contexto
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-8 w-8 border-white/10"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] text-content-tertiary">
              {page} / {pages}
            </span>
            <Button
              size="icon"
              variant="outline"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
              className="h-8 w-8 border-white/10"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
