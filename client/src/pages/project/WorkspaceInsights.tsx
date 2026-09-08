import { EmptyState } from "@/components/nexus/EmptyState";
import { BrainCircuit, CheckCircle2, FileText } from "lucide-react";
import { Section } from "./WorkspaceIndicators";

type ReadinessItem = {
  label: string;
  ready: boolean;
};

export function InsightsSection({ readiness }: { readiness?: ReadinessItem[] }) {
  return (
    <Section
      title="Insights"
      description="Recomendações futuras baseadas em evidências e contexto do projeto."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/[0.06] p-5">
          <BrainCircuit className="h-5 w-5 text-[var(--brand-violet)]" />
          <h3 className="mt-4 font-semibold">Nexus Intelligence preparada</h3>
          <p className="mt-2 text-xs leading-5 text-content-tertiary">
            A arquitetura está pronta para responder com fontes, permissões e rastreabilidade. A
            geração automática ainda não está habilitada.
          </p>
        </article>
        <article className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          {readiness?.length ? (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--brand-accent)]">
                Checklist de contexto
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {readiness.map(item => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 rounded-xl border border-white/[0.05] px-3 py-2.5"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${item.ready ? "text-emerald-300" : "text-content-tertiary"}`}
                    />
                    <span className="text-xs text-content-tertiary">{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 text-[var(--brand-accent)]" />
              <h3 className="mt-4 font-semibold">Contexto antes da resposta</h3>
              <p className="mt-2 text-xs leading-5 text-content-tertiary">
                Documentos, indicadores, decisões e histórico alimentarão os insights quando a
                integração de IA for ativada.
              </p>
            </>
          )}
        </article>
      </div>
    </Section>
  );
}

export function UnavailableWorkspaceSection() {
  return (
    <Section
      title="Seção não disponível"
      description="A seção solicitada não pertence a este template."
    >
      <EmptyState
        title="Seção não disponível"
        description="Retorne ao menu do projeto e selecione uma seção válida."
      />
    </Section>
  );
}
