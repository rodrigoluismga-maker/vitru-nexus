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
export function IndicatorsView({ data, common }: { data: ExpansionData; common: CommonProps }) {
  return (
    <Section
      title="Indicadores da expansão"
      description="Meta, realizado e forecast por praça, oferta, cenário e período."
      action={<ExpansionCreateDialog kind="metric" {...common} compact />}
    >
      {data.metrics.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr
                className={
                  "border-b border-white/[0.07] text-[11px] " +
                  "uppercase tracking-[.13em] text-content-tertiary"
                }
              >
                <th className="px-3 py-3">Indicador</th>
                <th className="px-3 py-3">Praça</th>
                <th className="px-3 py-3 text-center">Período</th>
                <th className="px-3 py-3 text-center">Meta</th>
                <th className="px-3 py-3 text-center">Realizado</th>
                <th className="px-3 py-3 text-center">Forecast</th>
                <th className="px-3 py-3 text-center">Variação</th>
              </tr>
            </thead>
            <tbody>
              {data.metrics.map(item => {
                const target = numberOrNull(item.metric.targetValue);
                const actual = numberOrNull(item.metric.actualValue);
                const variance = target !== null && actual !== null ? actual - target : null;
                return (
                  <tr key={item.metric.id} className="border-b border-white/[0.045] text-xs">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-content-secondary">{item.metric.name}</p>
                      <p className="mt-1 text-[11px] text-content-tertiary">
                        {item.metric.source || "Fonte não informada"}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-content-tertiary">
                      {item.cityName ? `${item.cityName}/${item.stateCode}` : "Consolidado"}
                    </td>
                    <td className="px-3 py-4 text-center text-content-tertiary">
                      {item.metric.periodLabel}
                    </td>
                    <td className="px-3 py-4 text-center">
                      {formatMetric(target, item.metric.unit)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      {formatMetric(actual, item.metric.unit)}
                    </td>
                    <td className="px-3 py-4 text-center">
                      {formatMetric(numberOrNull(item.metric.forecastValue), item.metric.unit)}
                    </td>
                    <td
                      className={
                        "px-3 py-4 text-center font-semibold " +
                        (variance === null
                          ? "text-content-tertiary"
                          : variance >= 0
                            ? "text-emerald-300"
                            : "text-red-300")
                      }
                    >
                      {variance === null ? "—" : formatMetric(variance, item.metric.unit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="Indicadores ainda não alimentados"
          description={
            "Cadastre metas e conecte as fontes oficiais antes de " +
            "avaliar performance. Nenhum n\u00FAmero \u00E9 inferido automaticamente."
          }
        />
      )}
    </Section>
  );
}
export function ResultsView({ data, common }: { data: ExpansionData; common: CommonProps }) {
  const byScenario = (["conservative", "base", "accelerated"] as const).map(name => ({
    name,
    rows: data.scenarios.filter(item => item.scenario.name === name),
  }));
  return (
    <div className="space-y-4">
      <Section
        title="Cenários de resultado"
        description="Comparação entre premissas conservadoras, base e aceleradas."
        action={<ExpansionCreateDialog kind="scenario" {...common} compact />}
      >
        <div className="grid gap-3 lg:grid-cols-3">
          {byScenario.map(group => (
            <ScenarioCard key={group.name} name={group.name} rows={group.rows} />
          ))}
        </div>
      </Section>
      <Section
        title="Realizado versus compromisso"
        description="Indicadores com valores oficiais registrados no módulo."
      >
        {data.metrics.some(item => item.metric.actualValue !== null) ? (
          <ResultsMetrics metrics={data.metrics} />
        ) : (
          <EmptyState
            title="Realizado ainda não disponível"
            description={
              "A compara\u00E7\u00E3o ser\u00E1 exibida quando os " +
              "primeiros resultados oficiais forem carregados."
            }
          />
        )}
      </Section>
    </div>
  );
}
export function ReportsView({ data }: { data: ExpansionData }) {
  return (
    <div className="space-y-4">
      <ExecutiveCanvas
        eyebrow="Expansão Presencial"
        title="Padrão executivo de análise de praça"
        subtitle={
          "Canvas reutiliz\u00E1vel para transformar dados de cidade, " +
          "mercado e implanta\u00E7\u00E3o em uma narrativa pronta para decis\u00E3o."
        }
      >
        <div className="grid h-full grid-cols-12 gap-[clamp(.55rem,1.2vw,1rem)]">
          <CanvasBlock
            className="col-span-12 lg:col-span-5"
            icon={Compass}
            title="Objetivo"
            text="Qual decisão esta análise precisa sustentar?"
          />
          <CanvasBlock
            className="col-span-12 lg:col-span-7"
            icon={BarChart3}
            title="Diagnóstico"
            text={
              data.cities.length
                ? `${data.cities.length} praça(s) disponível(is) para compor a análise.`
                : "Selecione a praça e conecte as fontes oficiais."
            }
          />
          <CanvasBlock
            className="col-span-4"
            icon={Target}
            title="Potencial"
            text="Tamanho, atração, conversão e portfólio."
          />
          <CanvasBlock
            className="col-span-4"
            icon={Landmark}
            title="Concorrência"
            text="Privados, preços, cursos e posicionamento."
          />
          <CanvasBlock
            className="col-span-4"
            icon={Flag}
            title="Recomendação"
            text="Decisão, risco, condição e próximo passo."
          />
        </div>
      </ExecutiveCanvas>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: MapPin,
            title: "Dossiê de cidade",
            text: "Potencial, demanda, oferta e concorrência.",
          },
          {
            icon: CircleDollarSign,
            title: "Business case",
            text: "Cenários, investimento, ticket e receita.",
          },
          {
            icon: CalendarRange,
            title: "Readiness review",
            text: "Implantação, mídia, comercial e operação.",
          },
          {
            icon: FileChartColumn,
            title: "Reporte executivo",
            text: "Avanços, riscos, decisões e entregas.",
          },
        ].map(item => (
          <article key={item.title} className="nexus-surface rounded-2xl p-5">
            <item.icon className="h-5 w-5 text-[var(--brand-violet)]" />
            <h3 className="mt-4 font-semibold">{item.title}</h3>
            <p className="mt-2 text-xs leading-5 text-content-tertiary">{item.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
