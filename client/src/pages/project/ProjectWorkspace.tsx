import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState } from "@/components/nexus/EmptyState";
import { MetricCard } from "@/components/nexus/MetricCard";
import { StatusBadge } from "@/components/nexus/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { DocumentCenter } from "@/components/nexus/DocumentCenter";
import {
  Activity,
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  CalendarRange,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileChartColumn,
  FileText,
  Gauge,
  History,
  LayoutDashboard,
  Lightbulb,
  Scale,
  ShieldAlert,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { WorkspaceActions } from "./WorkspaceActions";
import { DecisionsSection, RiskSection, ScheduleSection } from "./WorkspaceGovernance";
import { Section, WorkspaceIndicators } from "./WorkspaceIndicators";
import { ExpansionWorkspace } from "./expansion/ExpansionWorkspace";
import { InsightsSection, UnavailableWorkspaceSection } from "./WorkspaceInsights";
const sections = [
  { key: "executive", label: "Visão Executiva", icon: Gauge },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "indicators", label: "Indicadores", icon: Activity },
  { key: "results", label: "Resultados", icon: ChartNoAxesCombined },
  { key: "reports", label: "Relatórios", icon: FileChartColumn },
  { key: "analyses", label: "Análises", icon: BarChart3 },
  { key: "documents", label: "Documentos", icon: FileText },
  { key: "timeline", label: "Cronograma", icon: CalendarRange },
  { key: "actions", label: "Planos de Ação", icon: ClipboardCheck },
  { key: "decisions", label: "Decisões", icon: Scale },
  { key: "owners", label: "Responsáveis", icon: UsersRound },
  { key: "history", label: "Histórico", icon: History },
  { key: "insights", label: "Insights", icon: Lightbulb },
] as const;
type SectionKey = (typeof sections)[number]["key"];
type WorkspaceContextData = {
  manager: {
    id: number;
    name: string | null;
    email: string | null;
    jobTitle: string | null;
    photoUrl: string | null;
  } | null;
  sponsor: {
    id: number;
    name: string | null;
    email: string | null;
    jobTitle: string | null;
    photoUrl: string | null;
  } | null;
  members: Array<{
    userId: number;
    name: string | null;
    email: string | null;
    jobTitle: string | null;
    photoUrl: string | null;
    memberRole: string;
    responsibility: string | null;
    isPrimary: boolean;
  }>;
};
export default function ProjectWorkspace() {
  const params = useParams<{
    id: string;
    section?: string;
  }>();
  const [, navigate] = useLocation();
  const projectId = Number(params.id);
  const activeSection = (params.section ?? "executive") as SectionKey;
  const context = trpc.projects.workspaceContext.useQuery(
    { id: projectId },
    { enabled: Number.isFinite(projectId) }
  );
  const projectList = trpc.projects.list.useQuery(undefined, {
    enabled: Number.isFinite(projectId),
  });
  const governance = trpc.governance.overview.useQuery(
    { projectId },
    { enabled: Number.isFinite(projectId) }
  );
  const actions = trpc.actions.listByProject.useQuery(
    { projectId },
    { enabled: Number.isFinite(projectId) }
  );
  const indicators = trpc.indicators.listByProject.useQuery(
    { projectId },
    { enabled: Number.isFinite(projectId) }
  );
  const enriched = projectList.data?.find(item => item.id === projectId);
  const people = useMemo(() => {
    const list = [
      context.data?.manager,
      context.data?.sponsor,
      ...(context.data?.members ?? []),
    ].filter(Boolean) as Array<{
      id?: number;
      userId?: number;
      name: string | null;
      email: string | null;
    }>;
    const unique = new Map<string, string>();
    list.forEach(person => {
      const id = person.id ?? person.userId;
      if (id) unique.set(String(id), person.name ?? person.email ?? `Usuário ${id}`);
    });
    return Array.from(unique, ([value, label]) => ({ value, label }));
  }, [context.data]);
  if (!Number.isFinite(projectId))
    return (
      <DashboardLayout>
        <div className="nexus-page">
          <EmptyState
            title="Projeto inválido"
            description="O identificador informado não é válido."
          />
        </div>
      </DashboardLayout>
    );
  if (context.isLoading || projectList.isLoading)
    return (
      <DashboardLayout>
        <div className="nexus-page space-y-4">
          <Skeleton className="h-48 rounded-3xl bg-white/[0.04]" />
          <Skeleton className="h-[520px] rounded-3xl bg-white/[0.04]" />
        </div>
      </DashboardLayout>
    );
  if (!context.data || !enriched)
    return (
      <DashboardLayout>
        <div className="nexus-page">
          <EmptyState
            title="Projeto não encontrado"
            description="O projeto pode ter sido removido ou você não possui acesso."
          />
        </div>
      </DashboardLayout>
    );
  const project = context.data.project;
  const isBudgetProject =
    project.code === "PO-2027" || project.name === "Planejamento Orçamentário 2027";
  const openRisks = governance.data?.risks.filter(item => item.status !== "closed").length ?? 0;
  const pendingDecisions =
    governance.data?.decisions.filter(item => item.status === "pending").length ?? 0;
  const openActions =
    actions.data?.filter(item => !["done", "cancelled"].includes(item.status)).length ?? 0;
  const go = (key: SectionKey) => navigate(`/projects/${projectId}/${key}`);
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <button
          onClick={() => navigate("/projects")}
          className={
            "mb-5 flex items-center gap-2 text-xs " +
            "text-content-tertiary transition-colors hover:text-white"
          }
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao portfólio
        </button>
        <header className="nexus-surface nexus-glow relative overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={enriched.health} />
                <span
                  className={
                    "rounded-full border border-white/[0.08] " +
                    "bg-white/[0.03] px-2.5 py-1 text-[11px] text-content-tertiary"
                  }
                >
                  {enriched.status}
                </span>
                <span className="text-[11px] uppercase tracking-[.14em] text-content-tertiary">
                  {project.code}
                </span>
              </div>
              <h1 className="nexus-heading mt-5 max-w-4xl text-3xl font-bold text-white sm:text-4xl">
                {project.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-content-tertiary">
                {project.description || "Descrição executiva ainda não cadastrada."}
              </p>
            </div>
            <div className="min-w-52">
              <div
                className={
                  "flex justify-between text-[11px] " +
                  "uppercase tracking-[.12em] text-content-tertiary"
                }
              >
                <span>Progresso reportado</span>
                <span className="nexus-number text-content-secondary">{project.progress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={
                    "h-full rounded-full bg-gradient-to-r " +
                    "from-[var(--brand-violet-deep)] " +
                    "via-[var(--brand-violet)] to-[var(--brand-accent)]"
                  }
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            {isBudgetProject && (
              <Button
                className={
                  "mt-4 w-full bg-[var(--brand-accent)] font-bold " +
                  "text-[var(--ink-strong)] hover:bg-[var(--brand-accent-hover)]"
                }
                onClick={() => navigate("/finance")}
              >
                <BadgeDollarSign className="mr-2 h-4 w-4" />
                Abrir Gestão Financeira
              </Button>
            )}
          </div>
        </header>

        <nav
          className={
            "mt-4 overflow-x-auto rounded-2xl border " +
            "border-white/[0.06] bg-[var(--surface-1)]/75 p-1.5 backdrop-blur-xl"
          }
        >
          <div className="flex min-w-max gap-1">
            {sections.map(item => {
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => go(item.key)}
                  className={
                    "flex h-10 items-center gap-2 rounded-xl " +
                    "px-3 text-[11px] font-semibold transition-all " +
                    (active
                      ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]"
                      : "text-content-tertiary hover:bg-white/[0.035] hover:text-content-secondary")
                  }
                >
                  <item.icon
                    className={`h-3.5 w-3.5 ${active ? "text-[var(--brand-accent)]" : ""}`}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="mt-4">
          {project.workspaceTemplate === "expansion" ? (
            <ExpansionWorkspace
              section={activeSection}
              projectId={projectId}
              project={project}
              enriched={enriched}
              context={context.data}
              governance={governance.data}
              people={people}
            />
          ) : (
            <>
              {activeSection === "executive" && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label="Progresso"
                      value={`${project.progress}%`}
                      helper="Avanço informado"
                      icon={Gauge}
                      tone="violet"
                    />
                    <MetricCard
                      label="Riscos abertos"
                      value={openRisks}
                      helper={openRisks ? "Com tratamento pendente" : "Sem registros"}
                      icon={ShieldAlert}
                      tone={openRisks ? "red" : "green"}
                    />
                    <MetricCard
                      label="Decisões"
                      value={pendingDecisions}
                      helper={pendingDecisions ? "Aguardando deliberação" : "Sem pendências"}
                      icon={Scale}
                      tone={pendingDecisions ? "yellow" : "green"}
                    />
                    <MetricCard
                      label="Ações abertas"
                      value={openActions}
                      helper="Em execução"
                      icon={ClipboardCheck}
                      tone="blue"
                    />
                  </div>
                  <div className="grid gap-4 xl:grid-cols-[.78fr_1.22fr]">
                    <Section
                      title="Direção estratégica"
                      description="Objetivo e enquadramento do projeto."
                    >
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--brand-violet)]">
                          Objetivo
                        </p>
                        <p className="mt-3 text-sm leading-7 text-content-tertiary">
                          {project.objective || "Objetivo ainda não cadastrado."}
                        </p>
                        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.05] pt-4">
                          <Mini label="Empresa" value={enriched.company} />
                          <Mini label="Área" value={enriched.area} />
                          <Mini label="Categoria" value={enriched.category} />
                          <Mini label="Prioridade" value={enriched.priority} />
                        </div>
                      </div>
                    </Section>
                    <RiskSection projectId={projectId} data={governance.data} />
                  </div>
                </div>
              )}
              {activeSection === "dashboard" && (
                <Section
                  title="Dashboard do projeto"
                  description="Leitura concentrada dos principais objetos de governança."
                >
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Insight
                      label="Indicadores"
                      value={indicators.data?.length ?? 0}
                      helper="Cadastrados"
                    />
                    <Insight label="Ações abertas" value={openActions} helper="Em acompanhamento" />
                    <Insight label="Riscos abertos" value={openRisks} helper="Em tratamento" />
                    <Insight
                      label="Decisões pendentes"
                      value={pendingDecisions}
                      helper="Para deliberação"
                    />
                  </div>
                </Section>
              )}
              {activeSection === "indicators" && <WorkspaceIndicators projectId={projectId} />}
              {activeSection === "results" && (
                <PreparedSection
                  title="Resultados"
                  description="Consolidação dos resultados alcançados, impactos e comparação com metas."
                />
              )}
              {activeSection === "reports" && (
                <PreparedSection
                  title="Relatórios"
                  description="Relatórios executivos e operacionais associados ao projeto."
                />
              )}
              {activeSection === "analyses" && (
                <PreparedSection
                  title="Análises"
                  description="Hipóteses, diagnósticos e leituras aprofundadas com evidências."
                />
              )}
              {activeSection === "documents" && (
                <Section
                  title="Documentos"
                  description="Arquivos, links, versões e metadados vinculados ao projeto."
                >
                  <DocumentCenter fixedProjectId={projectId} />
                </Section>
              )}
              {activeSection === "timeline" && (
                <ScheduleSection projectId={projectId} data={governance.data} people={people} />
              )}
              {activeSection === "actions" && (
                <WorkspaceActions projectId={projectId} people={people} />
              )}
              {activeSection === "decisions" && (
                <DecisionsSection projectId={projectId} data={governance.data} people={people} />
              )}
              {activeSection === "owners" && <OwnersSection context={context.data} />}
              {activeSection === "history" && (
                <HistorySection data={governance.data?.history ?? []} />
              )}
              {activeSection === "insights" && <InsightsSection />}
              {!sections.some(item => item.key === activeSection) && (
                <UnavailableWorkspaceSection />
              )}
            </>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}
function PreparedSection({ title, description }: { title: string; description: string }) {
  return (
    <Section title={title} description={description}>
      <EmptyState
        title="Estrutura pronta para receber dados"
        description={
          "A se\u00E7\u00E3o est\u00E1 dispon\u00EDvel no template universal. Conecte a " +
          "fonte oficial ou registre conte\u00FAdo para iniciar o acompanhamento."
        }
      />
    </Section>
  );
}
function Mini({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">{label}</p>
      <p className="mt-1 truncate text-xs text-content-secondary">{value || "Não definido"}</p>
    </div>
  );
}
function Insight({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">{label}</p>
      <p className="nexus-number mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-[11px] text-content-tertiary">{helper}</p>
    </div>
  );
}
function OwnersSection({ context }: { context: WorkspaceContextData }) {
  const people = [
    { role: "Patrocinador executivo", person: context.sponsor },
    { role: "Gestor do projeto", person: context.manager },
  ];
  return (
    <Section title="Responsáveis" description="Papéis, governança e responsabilidades do projeto.">
      <div className="grid gap-3 md:grid-cols-2">
        {people.map(item => (
          <article
            key={item.role}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <UserRoundCog className="h-5 w-5 text-[var(--brand-violet)]" />
            <p className="mt-4 text-[11px] uppercase tracking-[.13em] text-content-tertiary">
              {item.role}
            </p>
            <p className="mt-2 font-semibold text-content-secondary">
              {item.person?.name || "Não definido"}
            </p>
            <p className="mt-1 text-xs text-content-tertiary">
              {item.person?.jobTitle || item.person?.email || "Sem vínculo cadastrado"}
            </p>
          </article>
        ))}
      </div>
      {context.members.length > 0 && (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {context.members.map(member => (
            <article key={member.userId} className="rounded-2xl border border-white/[0.055] p-4">
              <p className="font-semibold text-content-secondary">{member.name || member.email}</p>
              <p className="mt-1 text-xs text-content-tertiary">
                {member.responsibility || member.memberRole}
              </p>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
function HistorySection({
  data,
}: {
  data: Array<{
    id: number;
    summary: string;
    action: string;
    entityType: string;
    createdAt: Date;
  }>;
}) {
  return (
    <Section
      title="Histórico"
      description="Trilha cronológica de alterações e decisões relevantes."
    >
      {data.length ? (
        <div className="relative ml-2 border-l border-white/[0.08] pl-6">
          {data.map(event => (
            <div key={event.id} className="relative pb-6 last:pb-0">
              <span
                className={
                  "absolute -left-[28px] top-1 h-2.5 w-2.5 rounded-full " +
                  "border-2 border-[var(--surface-2)] bg-[var(--brand-violet)]"
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
          description="Atualizações relevantes serão registradas automaticamente nesta trilha."
        />
      )}
    </Section>
  );
}
