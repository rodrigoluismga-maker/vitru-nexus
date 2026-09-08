import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Database,
  RefreshCw,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { money, percent, type VariationSort } from "./FinanceMarketUtils";
export function LoadingGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-36 rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}
export function QueryErrorState({
  onRetry,
  occurredAt,
  message = "Não foi possível consultar os dados neste momento.",
}: {
  onRetry: () => void;
  occurredAt?: number;
  message?: string;
}) {
  const timestamp = occurredAt ? new Date(occurredAt).toLocaleString("pt-BR") : "não informado";
  return (
    <div className="rounded-3xl border border-red-300/20 bg-red-300/[0.055] p-8 text-center">
      <TriangleAlert className="mx-auto h-7 w-7 text-red-200" />
      <h2 className="mt-4 text-lg font-semibold text-white">Falha na consulta financeira</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-content-secondary">{message}</p>
      <p className="mt-2 text-[11px] text-content-tertiary">Última falha: {timestamp}</p>
      <Button onClick={onRetry} className="mt-5 gap-2 bg-white text-black hover:bg-white/90">
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </div>
  );
}
export function MetricCard({
  eyebrow,
  value,
  detail,
  tone = "neutral",
  icon: Icon = TrendingUp,
}: {
  eyebrow: string;
  value: string;
  detail: string;
  tone?: "neutral" | "positive" | "warning" | "forecast";
  icon?: any;
}) {
  const accent =
    tone === "forecast"
      ? "var(--brand-violet)"
      : tone === "warning"
        ? "var(--status-negative)"
        : tone === "positive"
          ? "var(--status-positive)"
          : "var(--brand-accent)";
  return (
    <article
      className={
        "group relative overflow-hidden rounded-2xl border border-white/[0.07] " +
        "bg-[linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))] p-5 " +
        "shadow-[0_18px_50px_rgba(0,0,0,.18)] " +
        "transition-transform duration-200 hover:-translate-y-0.5"
      }
    >
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${accent}80,transparent)` }}
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[.18em] text-content-tertiary">
          {eyebrow}
        </p>
        <span className="rounded-lg border border-white/[0.06] bg-white/[0.035] p-2">
          <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-[-.04em] text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-content-tertiary">{detail}</p>
    </article>
  );
}
export function RelevanceBeacon({ share }: { share: number | null }) {
  const level = (share ?? 0) >= 0.2 ? "Alta" : (share ?? 0) >= 0.08 ? "Média" : "Baixa";
  const color =
    level === "Alta"
      ? "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.48)]"
      : level === "Média"
        ? "bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.34)]"
        : "bg-slate-400";
  return (
    <span
      className={
        "inline-flex items-center gap-2 " + "text-[11px] font-semibold text-content-tertiary"
      }
    >
      <span className={`h-2 w-2 rounded-full ${color}`} />
      Impacto {level.toLowerCase()}
    </span>
  );
}
export function ComparisonBridge({
  real25,
  increases,
  reductions,
  real26,
  yoy,
  period,
  currentLabel = "Real",
}: {
  real25: number;
  increases: number;
  reductions: number;
  real26: number;
  yoy: number | null;
  period: string;
  currentLabel?: string;
}) {
  return (
    <section
      className={
        "relative overflow-hidden rounded-3xl border border-white/[0.07] " +
        "bg-[linear-gradient(135deg,rgba(255,255,255,.055),rgba(255,255,255,.018))] " +
        "p-5 shadow-[0_22px_70px_rgba(0,0,0,.2)] sm:p-6"
      }
    >
      <div
        className={
          "absolute inset-x-[12%] top-0 h-px " +
          "bg-[linear-gradient(90deg,transparent,rgba(255,194,14,.55),transparent)]"
        }
      />
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div
          className={
            "min-w-0 flex-1 rounded-2xl border " + "border-slate-400/10 bg-slate-400/[0.035] p-4"
          }
        >
          <p className="text-[11px] font-bold uppercase tracking-[.17em] text-content-tertiary">
            Real {period}/25
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-.035em] text-white sm:text-3xl">
            {money(real25)}
          </p>
        </div>
        <ArrowRight className="hidden h-5 w-5 shrink-0 text-content-tertiary xl:block" />
        <div className="grid flex-[1.35] gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <div
            className={
              "rounded-2xl border border-[var(--direction-up)]/15 " +
              "bg-[var(--direction-up)]/[0.055] p-4"
            }
          >
            <div className="flex items-center gap-2 text-[var(--direction-up-soft)]">
              <ArrowUpRight className="h-4 w-4" />
              <p className="text-[11px] font-bold uppercase tracking-[.14em]">Aumentos</p>
            </div>
            <p className="mt-2 text-xl font-semibold text-white">+{money(increases)}</p>
            <p className="mt-1 text-[11px] text-content-tertiary">Maior investimento</p>
          </div>
          <div className="hidden items-center text-content-tertiary sm:flex">−</div>
          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.045] p-4">
            <div className="flex items-center gap-2 text-cyan-200">
              <ArrowDownRight className="h-4 w-4" />
              <p className="text-[11px] font-bold uppercase tracking-[.14em]">Reduções</p>
            </div>
            <p className="mt-2 text-xl font-semibold text-white">−{money(reductions)}</p>
            <p className="mt-1 text-[11px] text-content-tertiary">Menor investimento</p>
          </div>
        </div>
        <ArrowRight className="hidden h-5 w-5 shrink-0 text-content-tertiary xl:block" />
        <div
          className={
            "min-w-0 flex-1 rounded-2xl border " +
            "border-[var(--brand-accent)]/18 bg-[var(--brand-accent)]/[0.055] p-4"
          }
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className={
                "text-[11px] font-bold uppercase " +
                "tracking-[.17em] text-[var(--brand-accent-soft)]"
              }
            >
              {currentLabel} {period}/26
            </p>
            <span
              className={
                "rounded-full border border-[var(--brand-accent)]/18 " +
                "bg-[var(--brand-accent)]/10 px-2 py-1 " +
                "text-[11px] font-bold text-[var(--brand-accent-soft)]"
              }
            >
              {percent(yoy)} YoY
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-[-.035em] text-white sm:text-3xl">
            {money(real26)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-content-tertiary">
        Ponte reconciliada: Real 2025 + aumentos − reduções = Real 2026. As cores indicam direção do
        investimento, não desempenho.
      </p>
    </section>
  );
}
export function SortHeader({
  label,
  sortKey,
  active,
  direction,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: VariationSort;
  active: boolean;
  direction: "asc" | "desc";
  onSort: (key: VariationSort) => void;
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={
        "flex items-center gap-1.5 transition hover:text-content-secondary " +
        (align === "right" ? "justify-end text-right" : "justify-start text-left")
      }
    >
      <span>{label}</span>
      {active ? (
        direction === "asc" ? (
          <ChevronUp className="h-3 w-3 text-[var(--brand-accent)]" />
        ) : (
          <ChevronDown className="h-3 w-3 text-[var(--brand-accent)]" />
        )
      ) : (
        <span className="h-3 w-3 text-center text-content-tertiary">↕</span>
      )}
    </button>
  );
}
export function EmptyState() {
  return (
    <div className="nexus-surface rounded-3xl p-12 text-center">
      <Database className="mx-auto h-7 w-7 text-[var(--brand-accent)]" />
      <h2 className="mt-4 text-lg font-semibold text-white">Carga oficial não encontrada</h2>
      <p className="mt-2 text-sm text-content-tertiary">
        Ative uma carga validada para liberar a experiência analítica.
      </p>
    </div>
  );
}
export function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5 text-content-tertiary">
      <span
        className={`h-0.5 w-5 ${dashed ? "border-t border-dashed" : ""}`}
        style={{ background: dashed ? "transparent" : color, borderColor: color }}
      />
      {label}
    </span>
  );
}
export function ScenarioBadge({ scenario }: { scenario: string }) {
  return scenario === "forecast" ? (
    <Badge
      className={
        "border-[var(--brand-violet)]/20 " +
        "bg-[var(--brand-violet)]/10 text-[11px] text-[var(--brand-violet-soft)]"
      }
    >
      Forecast
    </Badge>
  ) : (
    <Badge
      className={
        "border-[var(--brand-accent)]/20 " +
        "bg-[var(--brand-accent)]/10 text-[11px] text-[var(--brand-accent-soft)]"
      }
    >
      Realizado
    </Badge>
  );
}
export function NarrativeCard({ icon: Icon, title, text }: any) {
  return (
    <article className="nexus-surface rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--brand-accent)]" />
        <h3 className="text-xs font-semibold text-content-secondary">{title}</h3>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-content-tertiary">{text}</p>
    </article>
  );
}
export function RoadmapStep({ number, title, text }: any) {
  return (
    <article className="rounded-2xl border border-white/[0.055] bg-white/[0.02] p-5">
      <span className="text-[11px] font-bold text-[var(--brand-accent)]">{number}</span>
      <h3 className="mt-3 text-sm font-semibold text-content-secondary">{title}</h3>
      <p className="mt-2 text-[11px] leading-5 text-content-tertiary">{text}</p>
    </article>
  );
}
