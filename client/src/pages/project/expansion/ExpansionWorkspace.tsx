import { DocumentCenter } from "@/components/nexus/DocumentCenter";
import { EmptyState } from "@/components/nexus/EmptyState";
import { ExecutiveCanvas } from "@/components/nexus/ExecutiveCanvas";
import { MetricCard } from "@/components/nexus/MetricCard";
import { StatusBadge } from "@/components/nexus/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";
import { WorkspaceActions } from "../WorkspaceActions";
import { DecisionsSection, ScheduleSection } from "../WorkspaceGovernance";
import { Section } from "../WorkspaceIndicators";
import { ExpansionCreateDialog, type ExpansionRecordKind } from "./ExpansionCreateDialog";
import { InsightsSection, UnavailableWorkspaceSection } from "../WorkspaceInsights";
import { ExecutiveView, ExpansionDashboard } from "./ExpansionWorkspaceExecutive";
import { IndicatorsView, ReportsView, ResultsView } from "./ExpansionWorkspacePerformance";
import { AnalysesView, HistoryView, OwnersView } from "./ExpansionWorkspaceGovernance";
import { LaunchPhases } from "./ExpansionWorkspacePanels";
import type { Context, Enriched, Governance, Project, SectionKey } from "./ExpansionWorkspaceUtils";

export function ExpansionWorkspace({
  section,
  projectId,
  project,
  enriched,
  context,
  governance,
  people,
}: {
  section: SectionKey;
  projectId: number;
  project: Project;
  enriched: Enriched;
  context: Context;
  governance: Governance;
  people: Array<{ value: string; label: string }>;
}) {
  const overview = trpc.expansion.overview.useQuery({ projectId });
  const options = trpc.expansion.options.useQuery({ projectId });
  if (overview.isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-3xl bg-white/[0.04]" />
        <Skeleton className="h-[440px] rounded-3xl bg-white/[0.04]" />
      </div>
    );
  if (overview.error || !overview.data)
    return (
      <Section
        title="Expansão Presencial"
        description="Não foi possível carregar o módulo especializado."
      >
        <EmptyState
          title="Falha ao carregar os dados"
          description={overview.error?.message ?? "Tente novamente em alguns instantes."}
        />
      </Section>
    );

  const data = overview.data;
  const common = { projectId, cities: data.cities, options: options.data };
  if (section === "executive")
    return (
      <ExecutiveView
        project={project}
        enriched={enriched}
        data={data}
        governance={governance}
        common={common}
      />
    );
  if (section === "dashboard") return <ExpansionDashboard data={data} common={common} />;
  if (section === "indicators") return <IndicatorsView data={data} common={common} />;
  if (section === "results") return <ResultsView data={data} common={common} />;
  if (section === "reports") return <ReportsView data={data} />;
  if (section === "analyses") return <AnalysesView data={data} common={common} />;
  if (section === "documents")
    return (
      <Section
        title="Documentos da expansão"
        description="Estudos, aprovações, contratos, mídia e evidências organizados por praça."
      >
        <DocumentCenter
          fixedProjectId={projectId}
          categoryOptions={[
            "Estudo de praça",
            "Business case",
            "Aprovação executiva",
            "Imóvel e implantação",
            "Portfólio de cursos",
            "Plano de mídia",
            "Plano comercial",
            "Concorrência",
            "Regulatório",
            "Relatório de resultados",
          ]}
        />
      </Section>
    );
  if (section === "timeline")
    return (
      <div className="space-y-4">
        <LaunchPhases />
        <ScheduleSection projectId={projectId} data={governance} people={people} />
      </div>
    );
  if (section === "actions") return <WorkspaceActions projectId={projectId} people={people} />;
  if (section === "decisions")
    return <DecisionsSection projectId={projectId} data={governance} people={people} />;
  if (section === "owners") return <OwnersView context={context} data={data} common={common} />;
  if (section === "history") return <HistoryView data={governance?.history ?? []} />;
  if (section === "insights") {
    const readiness = [
      { label: "Praças cadastradas", ready: data.cities.length > 0 },
      { label: "Cenários estruturados", ready: data.scenarios.length > 0 },
      { label: "Ofertas definidas", ready: data.offers.length > 0 },
      { label: "Concorrência documentada", ready: data.competitors.length > 0 },
      { label: "Mídia planejada", ready: data.mediaPlans.length > 0 },
      { label: "Força comercial mobilizada", ready: data.salesPlans.length > 0 },
      { label: "Indicadores conectados", ready: data.metrics.length > 0 },
    ];
    return <InsightsSection readiness={readiness} />;
  }
  return <UnavailableWorkspaceSection />;
}
