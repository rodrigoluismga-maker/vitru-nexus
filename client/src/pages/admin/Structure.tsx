import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/nexus/PageHeader";
import { ArrowRight, GraduationCap, Landmark, Workflow } from "lucide-react";
import { useLocation } from "wouter";
export default function Structure() {
  const [, navigate] = useLocation();
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Administração"
          title="Estrutura organizacional"
          description={
            "Cadastros que determinam como projetos, " +
            "indicadores e pessoas s\u00E3o classificados na plataforma."
          }
          icon={Landmark}
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <button
            onClick={() => navigate("/admin/modalities")}
            className="nexus-surface nexus-card-hover group rounded-3xl p-7 text-left"
          >
            <span
              className={
                "flex h-12 w-12 items-center justify-center rounded-2xl border " +
                "border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
              }
            >
              <GraduationCap className="h-5 w-5 text-[var(--brand-violet)]" />
            </span>
            <h2 className="mt-7 text-xl font-bold">Modalidades</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-content-tertiary">
              EAD, Presencial, Semipresencial, Medicina, Pós-graduação e demais classificações
              acadêmicas.
            </p>
            <span className="mt-8 flex items-center text-xs font-bold text-[var(--brand-accent)]">
              Administrar modalidades{" "}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
          <button
            onClick={() => navigate("/admin/areas")}
            className="nexus-surface nexus-card-hover group rounded-3xl p-7 text-left"
          >
            <span
              className={
                "flex h-12 w-12 items-center justify-center rounded-2xl border " +
                "border-[var(--brand-accent)]/15 bg-[var(--brand-accent)]/[0.07]"
              }
            >
              <Workflow className="h-5 w-5 text-[var(--brand-accent)]" />
            </span>
            <h2 className="mt-7 text-xl font-bold">Áreas</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-content-tertiary">
              Estrutura de responsabilidade que organiza gestores, usuários, projetos e ações do
              portfólio.
            </p>
            <span className="mt-8 flex items-center text-xs font-bold text-[var(--brand-accent)]">
              Administrar áreas{" "}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
