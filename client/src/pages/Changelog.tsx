import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState } from "@/components/nexus/EmptyState";
import { PageHeader } from "@/components/nexus/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { History, RefreshCw, TriangleAlert } from "lucide-react";

const AREA_LABEL: Record<string, string> = {
  governanca: "Governança",
  seguranca: "Segurança",
  financeiro: "Financeiro",
  produto: "Produto",
  infraestrutura: "Infraestrutura",
};

const AREA_COLOR: Record<string, string> = {
  governanca: "var(--status-info)",
  seguranca: "var(--status-warning)",
  financeiro: "var(--status-positive)",
  produto: "var(--brand-violet)",
  infraestrutura: "var(--brand-accent)",
};

export default function Changelog() {
  const query = trpc.changelog.list.useQuery();

  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Versão"
          title="Novidades e histórico"
          description="O que mudou no Vitru Nexus, quando e por quê — para saber se você está vendo a versão mais recente sem precisar perguntar."
          icon={History}
        />

        {query.isLoading ? (
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : query.isError ? (
          <div className="mt-8 rounded-3xl border border-red-300/20 bg-red-300/[0.055] p-8 text-center">
            <TriangleAlert className="mx-auto h-7 w-7 text-red-200" />
            <h2 className="mt-4 text-lg font-semibold text-white">Falha ao carregar o histórico</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-content-secondary">
              Não foi possível consultar as novidades neste momento.
            </p>
            <Button
              onClick={() => query.refetch()}
              className="mt-5 gap-2 bg-white text-black hover:bg-white/90"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : !query.data?.entries.length ? (
          <div className="mt-8">
            <EmptyState
              title="Nenhuma entrega registrada ainda"
              description="Assim que uma entrega for concluída e mesclada, ela aparece aqui automaticamente."
            />
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {query.data.entries.map(entry => (
                <article key={entry.id} className="nexus-surface rounded-2xl p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[.08em]"
                      style={{
                        borderColor: `${AREA_COLOR[entry.area]}33`,
                        color: AREA_COLOR[entry.area],
                        backgroundColor: `${AREA_COLOR[entry.area]}14`,
                      }}
                    >
                      {AREA_LABEL[entry.area] ?? entry.area}
                    </span>
                    <span className="text-xs text-content-tertiary">
                      {new Date(`${entry.date}T00:00:00`).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {entry.reference && (
                      <span className="text-xs text-content-tertiary">· {entry.reference}</span>
                    )}
                  </div>
                  <h2 className="mt-3 text-base font-bold text-white">{entry.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-content-tertiary">{entry.summary}</p>
                  {entry.highlights.length > 0 && (
                    <ul className="mt-4 space-y-1.5">
                      {entry.highlights.map(highlight => (
                        <li
                          key={highlight}
                          className="flex gap-2 text-xs leading-5 text-content-secondary"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--brand-accent)]" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>

            {!!query.data.legacyCheckpoints.length && (
              <section className="mt-8">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-content-tertiary">
                  Histórico anterior à sincronização GitHub (checkpoints Manus)
                </p>
                <p className="mt-2 text-xs leading-5 text-content-tertiary">
                  Datas exatas não foram registradas nessa fonte — por isso não aparecem aqui.
                </p>
                <div className="nexus-surface mt-4 divide-y divide-white/[0.05] rounded-2xl">
                  {query.data.legacyCheckpoints.map(checkpoint => (
                    <div
                      key={checkpoint.hash}
                      className="flex flex-wrap items-center gap-3 px-5 py-3"
                    >
                      <code className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] text-content-tertiary">
                        {checkpoint.hash}
                      </code>
                      <span className="text-sm text-content-secondary">{checkpoint.summary}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
