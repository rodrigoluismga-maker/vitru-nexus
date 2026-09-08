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
  RelevanceBeacon,
  RoadmapStep,
  ScenarioBadge,
  SortHeader,
} from "./FinanceMarketComponents";
import { TemporalChart } from "./FinanceMarketCharts";
export function Future() {
  const current = ["Realizado", "Forecast", "YoY", "Mix", "Evolução", "Drill-down", "Diagnóstico"];
  const future = [
    "Budget",
    "Comprometido",
    "Saldo",
    "Revisão",
    "Resultado",
    "Eficiência",
    "Realocação",
  ];
  return (
    <div className="space-y-6">
      <section
        className={
          "relative overflow-hidden rounded-[2rem] " +
          "border border-[var(--brand-violet)]/15 " +
          "bg-[radial-gradient(circle_at_82%_22%,rgba(166,137,247,.19),transparent_32%)," +
          "linear-gradient(145deg,rgba(34,19,58,.85),rgba(10,8,15,.95))] " +
          "p-7 sm:p-10"
        }
      >
        <span
          className={
            "inline-flex items-center gap-2 " +
            "rounded-full border border-[var(--brand-violet)]/20 " +
            "bg-[var(--brand-violet)]/10 px-3 py-1.5 text-[11px] " +
            "font-bold uppercase tracking-[.16em] text-[var(--brand-violet-soft)]"
          }
        >
          <Sparkles className="h-3 w-3" />
          Em construção
        </span>
        <h2 className="nexus-heading mt-5 max-w-3xl text-3xl font-semibold text-white sm:text-4xl">
          Do diagnóstico do investimento à decisão de alocação.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-content-tertiary">
          A fonte oficial desta V1 sustenta Realizado e Forecast. Budget, Comprometido, Saldo e
          métricas de eficiência ainda não estão disponíveis e, por integridade, não recebem valores
          simulados.
        </p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="nexus-surface rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <div>
              <p className="nexus-kicker">O que já temos</p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Capital visível e explicável
              </h3>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {current.map((item, index) => (
              <div
                key={item}
                className="rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.045] p-4"
              >
                <span className="text-[11px] font-bold text-emerald-300/55">0{index + 1}</span>
                <p className="mt-2 text-xs font-semibold text-content-secondary">{item}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="nexus-surface rounded-3xl p-6">
          <div className="flex items-center gap-3">
            <CircleDashed className="h-5 w-5 text-[var(--brand-violet)]" />
            <div>
              <p className="nexus-kicker">Próxima fronteira</p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                Capital planejado e realocável
              </h3>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {future.map((item, index) => (
              <div
                key={item}
                className={
                  "rounded-2xl border border-[var(--brand-violet)]/10 " +
                  "bg-[var(--brand-violet)]/[0.045] p-4"
                }
              >
                <span className="text-[11px] font-bold text-[var(--brand-violet)]/55">
                  0{index + 1}
                </span>
                <p className="mt-2 text-xs font-semibold text-content-tertiary">{item}</p>
                <p className="mt-1 text-[11px] text-content-tertiary">Sem dado nesta fonte</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="nexus-surface rounded-3xl p-6">
        <p className="nexus-kicker">Norte do produto</p>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <RoadmapStep
            number="01"
            title="Enxergar"
            text="Consolidar Realizado e Forecast com governança."
          />
          <RoadmapStep
            number="02"
            title="Explicar"
            text="Decompor variações até lançamento e evidência."
          />
          <RoadmapStep
            number="03"
            title="Decidir"
            text="Conectar Budget, comprometimentos e revisões."
          />
          <RoadmapStep
            number="04"
            title="Realocar"
            text="Simular cenários e registrar decisões rastreáveis."
          />
        </div>
      </section>
    </div>
  );
}
