import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState } from "@/components/nexus/EmptyState";
import { MetricCard } from "@/components/nexus/MetricCard";
import { PageHeader } from "@/components/nexus/PageHeader";
import { StatusBadge } from "@/components/nexus/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CalendarClock,
  CircleAlert,
  Clock3,
  FolderKanban,
  Gauge,
  History,
  Scale,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";
export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const summary = trpc.dashboard.summary.useQuery();
  const firstName = user?.name?.split(" ")[0] || "executivo";
  const data = summary.data;
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Painel Executivo"
          title={`Bom dia, ${firstName}.`}
          description={
            "A vis\u00E3o consolidada do portf\u00F3lio prioriza exce\u00E7\u00F5es, " +
            "decis\u00F5es e entregas que exigem aten\u00E7\u00E3o da lideran\u00E7a."
          }
          icon={Gauge}
          actions={
            <>
              <Button
                variant="outline"
                className="border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
                onClick={() => navigate("/projects")}
              >
                Ver portfólio
              </Button>
              <Button
                className={
                  "bg-[var(--brand-accent)] font-bold " +
                  "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
                }
                onClick={() => navigate("/intelligence")}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Nexus Intelligence
              </Button>
            </>
          }
        />

        {summary.isLoading ? (
          <DashboardSkeleton />
        ) : summary.isError ? (
          <div className="nexus-surface mt-8 rounded-2xl border-red-400/20 p-6 text-sm text-red-200">
            Não foi possível carregar o panorama do portfólio. Tente novamente.
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                label="Projetos"
                value={data?.totals.projects ?? 0}
                helper="Portfólio cadastrado"
                icon={FolderKanban}
                tone="violet"
              />
              <MetricCard
                label="Ativos"
                value={data?.totals.activeProjects ?? 0}
                helper="Status cadastral reportado"
                icon={Gauge}
                tone="blue"
                delay={45}
              />
              <MetricCard
                label="Críticos"
                value={data?.totals.criticalProjects ?? 0}
                helper={data?.totals.criticalProjects ? "Exigem decisão" : "Nenhum identificado"}
                icon={ShieldAlert}
                tone="red"
                delay={90}
              />
              <MetricCard
                label="Riscos abertos"
                value={data?.totals.openRisks ?? 0}
                helper={data?.totals.openRisks ? "Com tratamento pendente" : "Sem registros"}
                icon={CircleAlert}
                tone="yellow"
                delay={135}
              />
              <MetricCard
                label="Decisões"
                value={data?.totals.pendingDecisions ?? 0}
                helper={data?.totals.pendingDecisions ? "Aguardando deliberação" : "Sem pendências"}
                icon={Scale}
                tone="violet"
                delay={180}
              />
              <MetricCard
                label="Ações vencidas"
                value={data?.totals.overdueActions ?? 0}
                helper={data?.totals.overdueActions ? "Fora do prazo" : "Nenhuma identificada"}
                icon={Clock3}
                tone="green"
                delay={225}
              />
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.85fr]">
              <div className="nexus-surface nexus-enter nexus-enter-delay-2 rounded-3xl p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="nexus-kicker">Portfólio estratégico</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight">Projetos ativos</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/projects")}
                    className="text-content-tertiary hover:text-white"
                  >
                    Todos <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-6 space-y-3">
                  {data?.projects.length ? (
                    data.projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => navigate(`/projects/${project.id}/executive`)}
                        className={
                          "nexus-card-hover group grid w-full " +
                          "grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl " +
                          "border border-white/[0.065] bg-white/[0.022] " +
                          "p-4 text-left sm:grid-cols-[auto_1fr_130px_auto]"
                        }
                      >
                        <span
                          className="h-11 w-1 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-content-primary">
                              {project.name}
                            </h3>
                            <span className="text-[11px] text-content-tertiary">
                              {project.code}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <StatusBadge status={project.health} />
                            <span className="text-[11px] text-content-tertiary">
                              {project.status}
                            </span>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          <div className="flex items-center justify-between text-[11px] text-content-tertiary">
                            <span>Progresso reportado</span>
                            <span className="nexus-number">{project.progress}%</span>
                          </div>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={
                                "h-full rounded-full bg-gradient-to-r " +
                                "from-[var(--brand-violet-deep)] to-[var(--brand-accent)]"
                              }
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                        <ArrowRight
                          className={
                            "h-4 w-4 text-content-tertiary transition-transform " +
                            "group-hover:translate-x-1 group-hover:text-[var(--brand-accent)]"
                          }
                        />
                      </button>
                    ))
                  ) : (
                    <EmptyState
                      title="Nenhum projeto cadastrado"
                      description="Cadastre o primeiro projeto para iniciar a governança do portfólio."
                    />
                  )}
                </div>
              </div>

              <div className="nexus-surface nexus-enter nexus-enter-delay-3 rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span
                    className={
                      "flex h-9 w-9 items-center justify-center rounded-xl border " +
                      "border-[var(--brand-accent)]/15 bg-[var(--brand-accent)]/[0.07]"
                    }
                  >
                    <CalendarClock className="h-4 w-4 text-[var(--brand-accent)]" />
                  </span>
                  <div>
                    <p className="nexus-kicker">Radar executivo</p>
                    <h2 className="mt-1 text-lg font-bold">Próximas entregas</h2>
                  </div>
                </div>
                <div className="mt-6">
                  {data?.upcoming.length ? (
                    <div className="space-y-3">
                      {data.upcoming.map(item => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-content-primary">{item.title}</p>
                            <StatusBadge status={item.status} />
                          </div>
                          <p className="mt-3 text-[11px] text-content-tertiary">
                            {item.dueDate
                              ? new Date(item.dueDate).toLocaleDateString("pt-BR")
                              : "Prazo não informado"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Nenhuma entrega programada"
                      description={
                        "O cronograma ainda n\u00E3o possui entregas cadastradas. O " +
                        "painel ser\u00E1 atualizado automaticamente quando houver dados."
                      }
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
              <div className="nexus-surface rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <span
                    className={
                      "flex h-9 w-9 items-center justify-center rounded-xl border " +
                      "border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
                    }
                  >
                    <History className="h-4 w-4 text-[var(--brand-violet)]" />
                  </span>
                  <div>
                    <p className="nexus-kicker">Rastreabilidade</p>
                    <h2 className="mt-1 text-lg font-bold">Atividades recentes</h2>
                  </div>
                </div>
                {data?.recentActivities.length ? (
                  <div className="mt-5 divide-y divide-white/[0.055]">
                    {data.recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 py-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-violet)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-content-secondary">{activity.summary}</p>
                          <p className="mt-1 text-[11px] text-content-tertiary">
                            {activity.actorName || "Sistema"} ·{" "}
                            {new Date(activity.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="Sem atividades registradas"
                    description="Alterações relevantes aparecerão aqui com autor, horário e contexto."
                  />
                )}
              </div>
              <div className="nexus-surface nexus-glow overflow-hidden rounded-3xl p-6 sm:p-8">
                <div className="relative">
                  <p className="nexus-kicker">Qualidade da informação</p>
                  <h2 className="nexus-heading mt-3 text-2xl font-bold">
                    A leitura evolui com a governança.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-content-tertiary">
                    Projetos sem indicadores, riscos ou entregas aparecem como não avaliados. O
                    NEXUS não preenche lacunas com estimativas silenciosas.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/admin/projects")}
                    className="mt-6 border-white/10 bg-white/[0.035]"
                  >
                    Administrar portfólio <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
function DashboardSkeleton() {
  return (
    <div className="mt-8 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_.85fr]">
        <Skeleton className="h-[420px] rounded-3xl bg-white/[0.04]" />
        <Skeleton className="h-[420px] rounded-3xl bg-white/[0.04]" />
      </div>
    </div>
  );
}
