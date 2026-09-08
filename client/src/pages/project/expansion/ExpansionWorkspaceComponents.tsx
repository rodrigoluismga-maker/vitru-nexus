import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarRange,
  ChartNoAxesCombined,
  CircleDollarSign,
  ClipboardCheck,
  Compass,
  FileChartColumn,
  FileSearch,
  FileText,
  Flag,
  Gauge,
  GraduationCap,
  History,
  Landmark,
  Lightbulb,
  MapPin,
  Megaphone,
  Scale,
  ShieldAlert,
  Target,
  TrendingUp,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/nexus/EmptyState";
import { ExecutiveCanvas } from "@/components/nexus/ExecutiveCanvas";
import { MetricCard } from "@/components/nexus/MetricCard";
import { StatusBadge } from "@/components/nexus/StatusBadge";
import { Section } from "../WorkspaceIndicators";
import { ExpansionCreateDialog } from "./ExpansionCreateDialog";
import {
  formatDate,
  formatMetric,
  money,
  numberOrNull,
  offerStatusLabel,
  readinessLabel,
  scenarioLabel,
  stageLabel,
  sumNullable,
  unique,
  uniqueObjects,
  type CommonProps,
  type Context,
  type Enriched,
  type ExpansionData,
  type Governance,
  type Person,
  type Project,
} from "./ExpansionWorkspaceUtils";
export function PersonCard({ role, person }: { role: string; person: Person | null }) {
  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <UserRoundCog className="h-5 w-5 text-[var(--brand-violet)]" />
      <p className="mt-4 text-[11px] uppercase tracking-[.13em] text-content-tertiary">{role}</p>
      <p className="mt-2 font-semibold text-content-secondary">{person?.name || "Não definido"}</p>
      <p className="mt-1 text-xs text-content-tertiary">
        {person?.jobTitle || person?.email || "Sem vínculo cadastrado"}
      </p>
    </article>
  );
}
export function CityRow({ city }: { city: ExpansionData["cities"][number] }) {
  return (
    <div
      className={
        "flex flex-col gap-3 rounded-2xl border " +
        "border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center"
      }
    >
      <span
        className={
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
          "border border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
        }
      >
        <MapPin className="h-4 w-4 text-[var(--brand-violet)]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-content-secondary">
          {city.name}/{city.stateCode}
        </p>
        <p className="mt-1 text-[11px] text-content-tertiary">
          {stageLabel(city.stage)} · {city.region || "Região não informada"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={city.health} />
        <div className="min-w-16 text-right">
          <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">Score</p>
          <p className="mt-1 text-sm font-bold text-content-secondary">
            {city.overallScore ?? "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
export function CompactRow({
  title,
  subtitle,
  value,
}: {
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <div
      className={
        "flex items-center justify-between gap-4 rounded-xl " +
        "border border-white/[0.055] bg-white/[0.015] px-4 py-3"
      }
    >
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-content-secondary">{title}</p>
        <p className="mt-1 truncate text-[11px] text-content-tertiary">{subtitle}</p>
      </div>
      <span className="shrink-0 text-xs text-content-tertiary">{value}</span>
    </div>
  );
}
export function SimpleMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <div className="nexus-surface rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-[.14em] text-content-tertiary">{label}</p>
      <p className="nexus-number mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-[11px] text-content-tertiary">{helper}</p>
    </div>
  );
}
export function Mini({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
      <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">{label}</p>
      <p className="mt-1.5 truncate text-xs text-content-tertiary">{value || "Não definido"}</p>
    </div>
  );
}
export function StatusPill({ value }: { value: string }) {
  return (
    <span
      className={
        "inline-flex rounded-full border border-white/[0.07] " +
        "bg-white/[0.03] px-2.5 py-1 text-[11px] text-content-tertiary"
      }
    >
      {value}
    </span>
  );
}
export function CanvasBlock({
  icon: Icon,
  title,
  text,
  className = "",
}: {
  icon: typeof Gauge;
  title: string;
  text: string;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-[clamp(.7rem,1.3vw,1.1rem)] border " +
        "border-white/[0.07] bg-white/[0.025] p-[clamp(.75rem,1.5vw,1.35rem)] " +
        className
      }
    >
      <Icon
        className={
          "h-[clamp(.9rem,1.4vw,1.25rem)] " +
          "w-[clamp(.9rem,1.4vw,1.25rem)] text-[var(--brand-violet)]"
        }
      />
      <p
        className={
          "mt-[clamp(.5rem,1vw,.85rem)] text-[clamp(.65rem,1vw,.9rem)] " +
          "font-semibold text-content-secondary"
        }
      >
        {title}
      </p>
      <p className="mt-1 text-[clamp(.5rem,.8vw,.68rem)] leading-relaxed text-content-tertiary">
        {text}
      </p>
    </div>
  );
}
export function FilterBar({
  cityId,
  setCityId,
  company,
  setCompany,
  course,
  setCourse,
  scenario,
  setScenario,
  period,
  setPeriod,
  data,
  courses,
  periods,
}: {
  cityId: string;
  setCityId: (value: string) => void;
  company: string;
  setCompany: (value: string) => void;
  course: string;
  setCourse: (value: string) => void;
  scenario: string;
  setScenario: (value: string) => void;
  period: string;
  setPeriod: (value: string) => void;
  data: ExpansionData;
  courses: string[];
  periods: string[];
}) {
  return (
    <div className="nexus-surface grid gap-2 rounded-2xl p-3 sm:grid-cols-2 xl:grid-cols-5">
      <Filter
        value={cityId}
        onChange={setCityId}
        placeholder="Cidade"
        options={[
          { value: "all", label: "Todas as cidades" },
          ...data.cities.map(city => ({
            value: String(city.id),
            label: `${city.name}/${city.stateCode}`,
          })),
        ]}
      />
      <Filter
        value={company}
        onChange={setCompany}
        placeholder="Marca"
        options={[
          { value: "all", label: "Todas as marcas" },
          ...uniqueObjects(
            data.offers.map(item => ({
              value: String(item.offer.companyId),
              label: item.companyName,
            }))
          ),
        ]}
      />
      <Filter
        value={course}
        onChange={setCourse}
        placeholder="Curso"
        options={[
          { value: "all", label: "Todos os cursos" },
          ...courses.map(value => ({ value, label: value })),
        ]}
      />
      <Filter
        value={scenario}
        onChange={setScenario}
        placeholder="Cenário"
        options={[
          { value: "all", label: "Todos os cenários" },
          { value: "conservative", label: "Conservador" },
          { value: "base", label: "Base" },
          { value: "accelerated", label: "Acelerado" },
        ]}
      />
      <Filter
        value={period}
        onChange={setPeriod}
        placeholder="Período"
        options={[
          { value: "all", label: "Todos os períodos" },
          ...periods.map(value => ({ value, label: value })),
        ]}
      />
    </div>
  );
}
export function Filter({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="border-white/[0.07] bg-white/[0.02]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export function ResultsMetrics({ metrics }: { metrics: ExpansionData["metrics"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics
        .filter(item => item.metric.actualValue !== null)
        .slice(0, 8)
        .map(item => (
          <article
            key={item.metric.id}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">
              {item.cityName || "Consolidado"}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-content-secondary">
              {item.metric.name}
            </h3>
            <p className="nexus-number mt-4 text-2xl font-bold">
              {formatMetric(numberOrNull(item.metric.actualValue), item.metric.unit)}
            </p>
            <p className="mt-2 text-[11px] text-content-tertiary">
              Meta: {formatMetric(numberOrNull(item.metric.targetValue), item.metric.unit)}
            </p>
          </article>
        ))}
    </div>
  );
}
