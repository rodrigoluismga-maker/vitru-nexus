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
import { CompactRow, Mini, StatusPill } from "./ExpansionWorkspaceComponents";
export function ScenarioPanel({
  data,
  common,
}: {
  data: ExpansionData["scenarios"];
  common: CommonProps;
}) {
  return (
    <Section
      title="Cenários"
      description="Conservador, Base e Acelerado."
      action={<ExpansionCreateDialog kind="scenario" {...common} compact />}
    >
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        {(["conservative", "base", "accelerated"] as const).map(name => (
          <ScenarioCard
            key={name}
            name={name}
            rows={data.filter(item => item.scenario.name === name)}
            compact
          />
        ))}
      </div>
    </Section>
  );
}
export function ScenarioCard({
  name,
  rows,
  compact = false,
}: {
  name: "conservative" | "base" | "accelerated";
  rows: ExpansionData["scenarios"];
  compact?: boolean;
}) {
  const enrollments = sumNullable(rows.map(item => item.scenario.targetEnrollments));
  const investment = sumNullable(rows.map(item => item.scenario.totalInvestment));
  return (
    <article
      className={
        "rounded-2xl border p-4 " +
        (name === "base"
          ? "border-[var(--brand-accent)]/20 bg-[var(--brand-accent)]/[0.035]"
          : "border-white/[0.06] bg-white/[0.02]")
      }
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-[.13em] text-content-tertiary">
          {scenarioLabel(name)}
        </p>
        <span
          className={
            "h-2 w-2 rounded-full " +
            (name === "conservative"
              ? "bg-blue-400"
              : name === "base"
                ? "bg-[var(--brand-accent)]"
                : "bg-[var(--brand-violet)]")
          }
        />
      </div>
      <div className={`mt-4 grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2"}`}>
        <Mini
          label="Matrículas"
          value={enrollments === null ? "—" : enrollments.toLocaleString("pt-BR")}
        />
        <Mini label="Investimento" value={investment === null ? "—" : money(investment)} />
      </div>
      <p className="mt-3 text-[11px] text-content-tertiary">
        {rows.length ? `${rows.length} premissa(s)` : "Não estruturado"}
      </p>
    </article>
  );
}
export function OffersPanel({
  data,
  common,
}: {
  data: ExpansionData["offers"];
  common: CommonProps;
}) {
  return (
    <Section
      title="Portfólio de ofertas"
      description="Curso, marca, praça, preço e capacidade planejada."
      action={<ExpansionCreateDialog kind="offer" {...common} compact />}
    >
      {data.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr
                className={
                  "border-b border-white/[0.07] text-[11px] " +
                  "uppercase tracking-[.13em] text-content-tertiary"
                }
              >
                <th className="px-3 py-3 text-left">Oferta</th>
                <th className="px-3 py-3 text-left">Praça</th>
                <th className="px-3 py-3 text-center">Marca</th>
                <th className="px-3 py-3 text-center">Preço bruto</th>
                <th className="px-3 py-3 text-center">Preço líquido</th>
                <th className="px-3 py-3 text-center">Capacidade</th>
                <th className="px-3 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(item => (
                <tr key={item.offer.id} className="border-b border-white/[0.045] text-xs">
                  <td className="px-3 py-4">
                    <p className="font-semibold text-content-secondary">{item.offer.courseName}</p>
                    <p className="mt-1 text-[11px] text-content-tertiary">
                      {item.modalityName || "Modalidade não definida"}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-content-tertiary">
                    {item.cityName}/{item.stateCode}
                  </td>
                  <td className="px-3 py-4 text-center text-content-tertiary">
                    {item.companyName}
                  </td>
                  <td className="px-3 py-4 text-center">{money(item.offer.grossPrice)}</td>
                  <td className="px-3 py-4 text-center">{money(item.offer.targetNetPrice)}</td>
                  <td className="px-3 py-4 text-center">{item.offer.capacity ?? "—"}</td>
                  <td className="px-3 py-4 text-center">
                    <StatusPill value={offerStatusLabel(item.offer.status)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Nenhuma oferta cadastrada"
          description="Vincule cursos, marcas e preços às praças após validação das premissas."
        />
      )}
    </Section>
  );
}
export function MediaPanel({
  data,
  common,
}: {
  data: ExpansionData["mediaPlans"];
  common: CommonProps;
}) {
  return (
    <Section
      title="Plano de mídia"
      description="Digital, offline, eventos e parcerias."
      action={<ExpansionCreateDialog kind="media" {...common} compact />}
    >
      {data.length ? (
        <div className="space-y-2">
          {data.slice(0, 5).map(item => (
            <CompactRow
              key={item.plan.id}
              title={item.plan.campaignName}
              subtitle={`${item.cityName}/${item.stateCode} · ${item.plan.channelName}`}
              value={money(item.plan.investment)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Mídia ainda não planejada"
          description="Cadastre investimento, canais e metas por cidade."
        />
      )}
    </Section>
  );
}
export function SalesPanel({
  data,
  common,
}: {
  data: ExpansionData["salesPlans"];
  common: CommonProps;
}) {
  return (
    <Section
      title="Força comercial"
      description="Capacidade, metas e mobilização por cidade."
      action={<ExpansionCreateDialog kind="sales" {...common} compact />}
    >
      {data.length ? (
        <div className="space-y-2">
          {data.slice(0, 5).map(item => (
            <CompactRow
              key={item.plan.id}
              title={item.plan.channelName}
              subtitle={`${item.cityName}/${item.stateCode} · ${readinessLabel(item.plan.readiness)}`}
              value={
                item.plan.targetEnrollments === null
                  ? "—"
                  : `${item.plan.targetEnrollments} matrículas`
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Força comercial não dimensionada"
          description="Registre canais, responsáveis, headcount e metas por cidade."
        />
      )}
    </Section>
  );
}
export function LaunchPhases() {
  return (
    <Section
      title="Jornada de implantação"
      description="Fases recomendadas para organizar o cronograma de cada praça."
    >
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
        {["Estudo", "Aprovação", "Implantação", "Go-to-market", "Operação", "Abertura"].map(
          (phase, index) => (
            <div
              key={phase}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <span className="text-[11px] font-bold text-[var(--brand-accent)]">0{index + 1}</span>
              <p className="mt-3 text-xs font-semibold text-content-secondary">{phase}</p>
            </div>
          )
        )}
      </div>
    </Section>
  );
}
