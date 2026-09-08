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
import {
  CanvasBlock,
  CityRow,
  FilterBar,
  Mini,
  PersonCard,
  ResultsMetrics,
  SimpleMetric,
} from "./ExpansionWorkspaceComponents";
import {
  LaunchPhases,
  MediaPanel,
  OffersPanel,
  SalesPanel,
  ScenarioCard,
  ScenarioPanel,
} from "./ExpansionWorkspacePanels";

export function AnalysesView({ data, common }: { data: ExpansionData; common: CommonProps }) {
  return (
    <div className="space-y-4">
      <ExecutiveCanvas
        eyebrow="Market Intelligence"
        title="Viabilidade da praça"
        subtitle="A análise deve separar evidência, hipótese e recomendação antes da aprovação."
      >
        <div className="grid h-full grid-cols-2 gap-[clamp(.6rem,1.2vw,1rem)] lg:grid-cols-4">
          <CanvasBlock
            icon={Building2}
            title="Cidade"
            text="População, renda, acessibilidade e demanda."
          />
          <CanvasBlock
            icon={GraduationCap}
            title="Portfólio"
            text="Cursos, marca, turno, capacidade e preço."
          />
          <CanvasBlock
            icon={Landmark}
            title="Competição"
            text="Privados locais, faixas de preço e presença."
          />
          <CanvasBlock
            icon={Megaphone}
            title="Go-to-market"
            text="Mídia, força comercial e conversão."
          />
        </div>
      </ExecutiveCanvas>
      <Section
        title="Mapa competitivo"
        description="Concorrentes privados e evidências por praça."
        action={<ExpansionCreateDialog kind="competitor" {...common} compact />}
      >
        {data.competitors.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.competitors.map(item => (
              <article
                key={item.competitor.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-content-secondary">
                      {item.competitor.institutionName}
                    </p>
                    <p className="mt-1 text-[11px] text-content-tertiary">
                      {item.cityName}/{item.stateCode}
                    </p>
                  </div>
                  <span className="rounded-full border border-white/[0.07] px-2 py-1 text-[11px] text-content-tertiary">
                    {item.competitor.isPrivate ? "Privada" : "Pública"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Mini label="Curso" value={item.competitor.courseName} />
                  <Mini label="Preço líquido" value={money(item.competitor.netPrice)} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Concorrência ainda não mapeada"
            description="Registre somente evidências datadas e com fonte para compor os comparativos."
          />
        )}
      </Section>
    </div>
  );
}

export function OwnersView({
  context,
  data,
  common,
}: {
  context: Context;
  data: ExpansionData;
  common: CommonProps;
}) {
  return (
    <div className="space-y-4">
      <Section
        title="Governança da expansão"
        description="Patrocínio, gestão e frentes operacionais necessárias para cada praça."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <PersonCard role="Patrocinador executivo" person={context.sponsor} />
          <PersonCard role="Gestor do programa" person={context.manager} />
        </div>
        {context.members.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {context.members.map(member => (
              <article
                key={member.userId}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              >
                <p className="font-semibold text-content-secondary">
                  {member.name || member.email}
                </p>
                <p className="mt-1 text-xs text-content-tertiary">
                  {member.responsibility || member.memberRole}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Equipe ainda não vinculada"
              description="Associe os responsáveis por inteligência, implantação, mídia, comercial, acadêmico e operação."
            />
          </div>
        )}
      </Section>
      <div className="grid gap-4 xl:grid-cols-2">
        <MediaPanel data={data.mediaPlans} common={common} />
        <SalesPanel data={data.salesPlans} common={common} />
      </div>
    </div>
  );
}

export function HistoryView({ data }: { data: NonNullable<Governance>["history"] }) {
  return (
    <Section
      title="Histórico da expansão"
      description="Trilha auditável de mudanças, análises e decisões."
    >
      {data.length ? (
        <div className="relative ml-2 border-l border-white/[0.08] pl-6">
          {data.map(event => (
            <div key={event.id} className="relative pb-6 last:pb-0">
              <span
                className={
                  "absolute -left-[28px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-2)] bg-[var(--brand-violet)]"
                }
              />
              <p className="text-sm text-content-secondary">{event.summary}</p>
              <p className="mt-1 text-[11px] text-content-tertiary">
                {event.entityType} · {event.action} ·{" "}
                {new Date(event.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Sem eventos registrados"
          description="Cadastros, decisões e atualizações aparecerão automaticamente nesta trilha."
        />
      )}
    </Section>
  );
}
