import DashboardLayout from "@/components/DashboardLayout";
import { MetricCard } from "@/components/nexus/MetricCard";
import { PageHeader } from "@/components/nexus/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Building2,
  FolderKanban,
  LayoutGrid,
  ListChecks,
  ShieldAlert,
  UsersRound,
  Workflow,
} from "lucide-react";
import { useLocation } from "wouter";

const iconByLabel: Record<string, typeof Building2> = {
  Empresas: Building2,
  Áreas: Workflow,
  Usuários: UsersRound,
  Projetos: FolderKanban,
  "Projetos ativos": FolderKanban,
  "Projetos em atraso": ShieldAlert,
  "Ações abertas": ListChecks,
  "Ações atrasadas": ShieldAlert,
};

export default function AdminOverview() {
  const [, navigate] = useLocation();
  const summary = trpc.dashboard.adminSummary.useQuery();
  const cards =
    (summary.data?.cards as unknown as { label: string; value: number }[] | undefined) ?? [];
  const byCompany =
    (summary.data?.byCompany as unknown as { label: string; value: number }[] | undefined) ?? [];
  const byArea =
    (summary.data?.byArea as unknown as { label: string; value: number }[] | undefined) ?? [];
  const byModality =
    (summary.data?.byModality as unknown as { label: string; value: number }[] | undefined) ?? [];
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Administração"
          title="Centro de controle"
          description="Cadastros, acessos e estruturas que sustentam a governança de todo o portfólio."
          icon={LayoutGrid}
          actions={
            <Button
              className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              onClick={() => navigate("/admin/projects")}
            >
              Gerenciar projetos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          }
        />
        {summary.isLoading ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton className="h-36 rounded-2xl bg-white/[0.04]" key={index} />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card, index) => (
              <MetricCard
                key={card.label}
                label={card.label}
                value={card.value}
                helper={card.label.includes("atras") ? "Ponto de atenção" : "Base atual"}
                icon={iconByLabel[card.label] ?? LayoutGrid}
                tone={card.label.includes("atras") ? "red" : index % 3 === 0 ? "yellow" : "violet"}
                delay={index * 35}
              />
            ))}
          </div>
        )}
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Estrutura organizacional",
              text: "Empresas, modalidades e áreas que organizam o portfólio.",
              path: "/admin/structure",
              icon: Building2,
            },
            {
              title: "Pessoas e acessos",
              text: "Usuários, papéis e permissões com governança centralizada.",
              path: "/admin/users",
              icon: UsersRound,
            },
            {
              title: "Modelo de projetos",
              text: "Categorias, status e prioridades compartilhados por toda a plataforma.",
              path: "/admin/project-config",
              icon: Workflow,
            },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="nexus-surface nexus-card-hover group rounded-2xl p-5 text-left"
            >
              <item.icon className="h-5 w-5 text-[var(--brand-violet)]" />
              <h2 className="mt-5 text-base font-bold">{item.title}</h2>
              <p className="mt-2 text-xs leading-5 text-content-tertiary">{item.text}</p>
              <span className="mt-5 flex items-center text-xs font-semibold text-[var(--brand-accent)]">
                Abrir módulo{" "}
                <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <Distribution title="Projetos por empresa" rows={byCompany} color="var(--brand-accent)" />
          <Distribution title="Projetos por área" rows={byArea} color="var(--brand-violet)" />
          <Distribution
            title="Projetos por modalidade"
            rows={byModality}
            color="var(--status-info)"
          />
        </section>
      </div>
    </DashboardLayout>
  );
}

function Distribution({
  title,
  rows,
  color,
}: {
  title: string;
  rows: { label: string; value: number }[];
  color: string;
}) {
  const max = Math.max(1, ...rows.map(row => Number(row.value)));
  return (
    <article className="nexus-surface rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-content-tertiary">{title}</p>
      <div className="mt-5 space-y-4">
        {rows.length ? (
          rows.slice(0, 6).map(row => (
            <div key={row.label}>
              <div className="flex justify-between gap-4 text-[11px]">
                <span className="truncate text-content-tertiary">{row.label}</span>
                <span className="nexus-number font-semibold text-content-secondary">
                  {row.value}
                </span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.055]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(Number(row.value) / max) * 100}%`, backgroundColor: color }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-content-tertiary">Sem projetos classificados.</p>
        )}
      </div>
    </article>
  );
}
