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
import { useState } from "react";
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

export function ExecutiveView({
  project,
  enriched,
  data,
  governance,
  common,
}: {
  project: Project;
  enriched: Enriched;
  data: ExpansionData;
  governance: Governance;
  common: CommonProps;
}) {
  const critical = data.cities.filter(city => city.health === "critical").length;
  const decisions = governance?.decisions.filter(item => item.status === "pending").length ?? 0;
  const nextOpenings = data.cities
    .filter(city => city.targetOpeningDate)
    .sort((a, b) => Number(a.targetOpeningDate) - Number(b.targetOpeningDate))
    .slice(0, 4);
  const hasOperationalData = data.cities.length > 0 || data.offers.length > 0;
  return (
    <div className="space-y-4">
      <div
        className={
          "flex items-start gap-3 rounded-2xl border px-4 py-3 " +
          (hasOperationalData
            ? "border-emerald-300/15 bg-emerald-300/[0.045]"
            : "border-amber-300/15 bg-amber-300/[0.045]")
        }
      >
        <Activity
          className={`mt-0.5 h-4 w-4 shrink-0 ${hasOperationalData ? "text-emerald-200" : "text-amber-200"}`}
        />
        <div>
          <p className="text-xs font-semibold text-content-secondary">
            {hasOperationalData
              ? "Dados operacionais conectados"
              : "Estrutura pronta · aguardando dados oficiais"}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-content-tertiary">
            {hasOperationalData
              ? "Os indicadores abaixo refletem registros cadastrados no módulo."
              : "Praças, ofertas, metas e datas permanecem vazias até a primeira carga ou cadastro governado."}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Praças mapeadas"
          value={data.cities.length}
          helper="Pipeline consolidado"
          icon={MapPin}
          tone="violet"
        />
        <MetricCard
          label="Ofertas planejadas"
          value={data.offers.length}
          helper="Cursos por cidade e marca"
          icon={GraduationCap}
          tone="blue"
        />
        <MetricCard
          label="Praças críticas"
          value={critical}
          helper={critical ? "Exigem encaminhamento" : "Nenhuma classificada"}
          icon={ShieldAlert}
          tone={critical ? "red" : "green"}
        />
        <MetricCard
          label="Decisões pendentes"
          value={decisions}
          helper={decisions ? "Aguardando deliberação" : "Sem pendências"}
          icon={Scale}
          tone={decisions ? "yellow" : "green"}
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Section
          title="Pipeline de expansão"
          description="Praças, estágio, saúde e abertura prevista."
          action={<ExpansionCreateDialog kind="city" {...common} compact />}
        >
          {data.cities.length ? (
            <div className="space-y-2">
              {data.cities.slice(0, 6).map(city => (
                <CityRow key={city.id} city={city} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma praça cadastrada"
              description="Comece pelas cidades em prospecção. O NEXUS não estima potencial sem fonte e premissas registradas."
            />
          )}
        </Section>
        <Section title="Próximas aberturas" description="Datas reportadas no pipeline oficial.">
          {nextOpenings.length ? (
            <div className="space-y-3">
              {nextOpenings.map(city => (
                <div
                  key={city.id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-content-secondary">
                        {city.name}/{city.stateCode}
                      </p>
                      <p className="mt-1 text-[11px] text-content-tertiary">
                        {stageLabel(city.stage)}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--brand-accent)]">
                      {formatDate(city.targetOpeningDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sem data de abertura"
              description="A agenda será formada quando as praças receberem uma data-alvo."
            />
          )}
        </Section>
      </div>
      <Section
        title="Direção da expansão"
        description="Enquadramento executivo e critérios para avançar."
      >
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--brand-violet)]">
              Objetivo
            </p>
            <p className="mt-3 text-sm leading-7 text-content-tertiary">
              {project.objective || "Objetivo ainda não cadastrado."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Empresa" value={enriched.company} />
            <Mini label="Área responsável" value={enriched.area} />
            <Mini label="Categoria" value={enriched.category} />
            <Mini label="Prioridade" value={enriched.priority} />
          </div>
        </div>
      </Section>
    </div>
  );
}

export function ExpansionDashboard({ data, common }: { data: ExpansionData; common: CommonProps }) {
  const [cityId, setCityId] = useState("all");
  const [company, setCompany] = useState("all");
  const [course, setCourse] = useState("all");
  const [scenario, setScenario] = useState("all");
  const [period, setPeriod] = useState("all");
  const filteredCities =
    cityId === "all" ? data.cities : data.cities.filter(city => String(city.id) === cityId);
  const filteredOffers = data.offers.filter(
    item =>
      (cityId === "all" || String(item.offer.cityId) === cityId) &&
      (company === "all" || String(item.offer.companyId) === company) &&
      (course === "all" || item.offer.courseName === course)
  );
  const filteredScenarios = data.scenarios.filter(
    item =>
      (cityId === "all" || String(item.scenario.cityId) === cityId) &&
      (scenario === "all" || item.scenario.name === scenario) &&
      (period === "all" || item.scenario.periodLabel === period)
  );
  const courses = unique(data.offers.map(item => item.offer.courseName));
  const periods = unique(data.scenarios.map(item => item.scenario.periodLabel));
  return (
    <div className="space-y-4">
      <FilterBar
        cityId={cityId}
        setCityId={setCityId}
        company={company}
        setCompany={setCompany}
        course={course}
        setCourse={setCourse}
        scenario={scenario}
        setScenario={setScenario}
        period={period}
        setPeriod={setPeriod}
        data={data}
        courses={courses}
        periods={periods}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SimpleMetric
          label="Praças filtradas"
          value={filteredCities.length}
          helper="Cobertura do recorte"
        />
        <SimpleMetric label="Ofertas" value={filteredOffers.length} helper="Cursos planejados" />
        <SimpleMetric
          label="Cenários"
          value={filteredScenarios.length}
          helper="Premissas registradas"
        />
        <SimpleMetric
          label="Concorrentes"
          value={
            data.competitors.filter(
              item => cityId === "all" || String(item.competitor.cityId) === cityId
            ).length
          }
          helper="Evidências locais"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Section
          title="Praças e prontidão"
          description="Status consolidado da jornada de expansão."
          action={<ExpansionCreateDialog kind="city" {...common} compact />}
        >
          {filteredCities.length ? (
            <div className="space-y-2">
              {filteredCities.map(city => (
                <CityRow key={city.id} city={city} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Nenhuma praça no recorte"
              description="Ajuste os filtros ou cadastre uma nova oportunidade."
            />
          )}
        </Section>
        <ScenarioPanel data={filteredScenarios} common={common} />
      </div>
      <OffersPanel data={filteredOffers} common={common} />
      <div className="grid gap-4 xl:grid-cols-2">
        <MediaPanel data={data.mediaPlans} common={common} />
        <SalesPanel data={data.salesPlans} common={common} />
      </div>
    </div>
  );
}
