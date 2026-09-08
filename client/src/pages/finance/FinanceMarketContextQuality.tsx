import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleDashed,
  Database,
  FileSearch,
  Layers3,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLocation } from "wouter";
import FinanceLayout, { type MarketFilters, useMarketFinanceFilters } from "./FinanceLayout";
import {
  aggregateTemporal,
  clean,
  dimensionFilterKeys,
  dimensionLabels,
  integer,
  money,
  monthNames,
  percent,
  periodLabel,
  scenarioLabel,
  type VariationSort,
} from "./FinanceMarketUtils";
import {
  ComparisonBridge,
  EmptyState,
  Legend,
  LoadingGrid,
  MetricCard,
  NarrativeCard,
  QueryErrorState,
  RelevanceBeacon,
  RoadmapStep,
  ScenarioBadge,
  SortHeader,
} from "./FinanceMarketComponents";
import { TemporalChart } from "./FinanceMarketCharts";

export function ContextQuality() {
  const { user } = useAuth();
  const { filters, setFilter } = useMarketFinanceFilters();
  const [search, setSearch] = useState("");
  const [scopeUserId, setScopeUserId] = useState("");
  const [scopeValue, setScopeValue] = useState("");
  const canManageScopes = user?.role === "admin";
  const context = trpc.marketFinance.context.useQuery();
  const attention = trpc.marketFinance.attention.useQuery({ filters });
  const quality = trpc.marketFinance.quality.useQuery();
  const loads = trpc.marketFinance.loads.list.useQuery();
  const utils = trpc.useUtils();
  const validateLoad = trpc.marketFinance.loads.validate.useMutation();
  const approveLoad = trpc.marketFinance.loads.approve.useMutation();
  const activateLoad = trpc.marketFinance.loads.activate.useMutation();
  const rollbackLoad = trpc.marketFinance.loads.rollback.useMutation();
  const scopeCatalog = trpc.marketFinance.scopes.catalog.useQuery(undefined, {
    enabled: canManageScopes,
  });
  const scopeAssignments = trpc.marketFinance.scopes.list.useQuery(undefined, {
    enabled: canManageScopes,
  });
  const directory = trpc.admin.users.list.useQuery(
    { search: "", page: 1, pageSize: 100 },
    { enabled: canManageScopes }
  );
  const assignScope = trpc.marketFinance.scopes.upsert.useMutation();
  const removeScope = trpc.marketFinance.scopes.remove.useMutation();
  const refreshLoads = async () => {
    await Promise.all([
      utils.marketFinance.loads.list.invalidate(),
      utils.marketFinance.context.invalidate(),
      utils.marketFinance.quality.invalidate(),
    ]);
  };
  const runLoadAction = async (action: "validate" | "approve" | "activate", id: number) => {
    try {
      if (action === "validate") await validateLoad.mutateAsync({ id });
      if (action === "approve") await approveLoad.mutateAsync({ id });
      if (action === "activate") await activateLoad.mutateAsync({ id });
      await refreshLoads();
      toast.success(
        action === "validate"
          ? "Carga validada."
          : action === "approve"
            ? "Carga aprovada."
            : "Carga ativada."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a carga.");
    }
  };
  const glossary = (context.data?.glossary ?? []).filter(
    item =>
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
  );
  const failedQuery = [context, attention, quality, loads].find(item => item.error);
  if (failedQuery?.error)
    return (
      <QueryErrorState
        onRetry={() => void failedQuery.refetch()}
        occurredAt={failedQuery.errorUpdatedAt}
        message={failedQuery.error.message}
      />
    );
  return (
    <div className="space-y-5">
      <section>
        <p className="nexus-kicker">Método antes da conclusão</p>
        <h2 className="nexus-heading mt-2 text-2xl font-semibold text-white">
          Contexto & Qualidade
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-content-tertiary">
          Glossário e observações da planilha são funcionalidades analíticas. Pontos de Atenção
          representam contexto fornecido pela fonte, não causalidade inferida.
        </p>
      </section>
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          eyebrow="Fatos válidos"
          value={integer(quality.data?.stats.rows ?? 0)}
          detail="Linhas persistidas e rastreáveis"
          icon={Database}
        />
        <MetricCard
          eyebrow="Rejeições explícitas"
          value={String(quality.data?.load.rejectedRows ?? 0)}
          detail="Preservadas no registro de qualidade"
          tone="warning"
          icon={AlertTriangle}
        />
        <MetricCard
          eyebrow="Possíveis duplicidades"
          value={String(quality.data?.stats.duplicate ?? 0)}
          detail="Mantidas; ausência de chave para exclusão"
          tone="warning"
          icon={Boxes}
        />
        <MetricCard
          eyebrow="Pontos de atenção"
          value={String(attention.data?.length ?? 0)}
          detail="Contextuais aos filtros ativos"
          tone="forecast"
          icon={FileSearch}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="nexus-surface rounded-3xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="nexus-kicker">Pontos de atenção da fonte</p>
              <h3 className="mt-2 text-lg font-semibold text-white">
                O que precisa de leitura contextual
              </h3>
            </div>
            <AlertTriangle className="h-5 w-5 text-amber-300" />
          </div>
          <div className="mt-4 space-y-3">
            {attention.data?.map(item => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      "border-[var(--brand-violet)]/20 bg-[var(--brand-violet)]/10 text-[11px] text-[var(--brand-violet-soft)]"
                    }
                  >
                    {clean(item.attentionType)}
                  </Badge>
                  <button
                    className="text-[11px] font-semibold text-[var(--brand-accent)]"
                    onClick={() => setFilter("brands", [item.brand])}
                  >
                    {item.brand}
                  </button>
                  <button
                    className="text-[11px] text-content-tertiary"
                    onClick={() => setFilter("categories", [item.managementCategory])}
                  >
                    {item.managementCategory}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-content-tertiary">
                  {clean(item.observation)}
                </p>
              </article>
            ))}
            {!attention.isLoading && !attention.data?.length && (
              <p className="py-8 text-center text-xs text-content-tertiary">
                Nenhum ponto de atenção no contexto selecionado.
              </p>
            )}
          </div>
        </section>
        <section className="nexus-surface rounded-3xl p-5">
          <div className="relative">
            <BookOpen className="absolute left-3 top-3 h-4 w-4 text-content-tertiary" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar no Glossário"
              className="h-10 border-white/10 bg-black/20 pl-9"
            />
          </div>
          <div className="mt-4 max-h-[640px] space-y-2 overflow-auto pr-1">
            {glossary.map(item => (
              <article
                key={item.id}
                className="rounded-xl border border-white/[0.055] bg-white/[0.02] p-4"
              >
                <button
                  className="text-left text-xs font-semibold text-content-secondary hover:text-[var(--brand-accent)]"
                  onClick={() => setFilter("categories", [item.category])}
                >
                  {item.category}
                </button>
                <p className="mt-2 text-[11px] leading-5 text-content-tertiary">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <section className="nexus-surface rounded-3xl p-5">
        <p className="nexus-kicker">Registro de qualidade</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quality.data?.issues.map(issue => (
            <article
              key={issue.id}
              className="rounded-2xl border border-white/[0.055] bg-black/15 p-4"
            >
              <div className="flex items-center justify-between">
                <Badge
                  className={
                    issue.severity === "warning"
                      ? "border-amber-400/15 bg-amber-400/[0.08] text-amber-300"
                      : "border-white/10 bg-white/[0.04] text-content-tertiary"
                  }
                >
                  {issue.issueCode}
                </Badge>
                <span className="text-[11px] text-content-tertiary">
                  Linha {issue.sourceExcelRow}
                </span>
              </div>
              <p className="mt-3 text-[11px] leading-5 text-content-tertiary">{issue.message}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="nexus-surface rounded-3xl p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="nexus-kicker">Governança da fonte</p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Histórico de cargas de Mercado
            </h3>
            <p className="mt-2 text-xs leading-5 text-content-tertiary">
              Validação, aprovação e ativação são etapas separadas. Nenhuma carga entra em produção
              automaticamente.
            </p>
          </div>
          {loads.data?.some(item => item.status === "superseded") && (
            <Button
              variant="outline"
              disabled={rollbackLoad.isPending}
              onClick={async () => {
                try {
                  await rollbackLoad.mutateAsync();
                  await refreshLoads();
                  toast.success("Carga anterior restaurada.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Rollback indisponível.");
                }
              }}
            >
              Restaurar carga anterior
            </Button>
          )}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-content-tertiary">
                <th className="px-3 py-3">Arquivo</th>
                <th className="px-3 py-3">Hash</th>
                <th className="px-3 py-3">Linhas</th>
                <th className="px-3 py-3">Qualidade</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3 text-right">Próxima etapa</th>
              </tr>
            </thead>
            <tbody>
              {loads.data?.map(load => (
                <tr key={load.id} className="border-b border-white/[0.04]">
                  <td className="px-3 py-3 text-content-secondary">{load.sourceFileName}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-content-tertiary">
                    {load.sourceSha256.slice(0, 12)}…
                  </td>
                  <td className="px-3 py-3 text-content-tertiary">
                    {integer(load.validRows)} válidas · {integer(load.rejectedRows)} rejeitadas
                  </td>
                  <td className="px-3 py-3 text-content-tertiary">
                    {integer(load.duplicateRows)} possíveis duplicidades
                  </td>
                  <td className="px-3 py-3">
                    <Badge className="border-white/10 bg-white/[0.04] text-content-secondary">
                      {load.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {(["processing", "failed"] as string[]).includes(load.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void runLoadAction("validate", load.id)}
                      >
                        Validar
                      </Button>
                    )}
                    {load.status === "validated" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void runLoadAction("approve", load.id)}
                      >
                        Aprovar
                      </Button>
                    )}
                    {load.status === "approved" && (
                      <Button size="sm" onClick={() => void runLoadAction("activate", load.id)}>
                        Ativar
                      </Button>
                    )}
                    {!["processing", "failed", "validated", "approved"].includes(load.status) && (
                      <span className="text-content-tertiary">Etapa concluída</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {canManageScopes && (
        <section className="nexus-surface rounded-3xl p-5">
          <p className="nexus-kicker">Menor privilégio</p>
          <h3 className="mt-2 text-lg font-semibold text-white">Escopos oficiais de Mercado</h3>
          <p className="mt-2 text-xs leading-5 text-content-tertiary">
            Somente valores existentes na carga ativa podem ser atribuídos. Sem escopo global ou
            dimensional, o acesso aos fatos permanece bloqueado.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-[.8fr_1.2fr_auto]">
            <Select value={scopeUserId} onValueChange={setScopeUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar usuário" />
              </SelectTrigger>
              <SelectContent>
                {directory.data?.items.map(item => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {item.name || item.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={scopeValue} onValueChange={setScopeValue}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar dimensão oficial" />
              </SelectTrigger>
              <SelectContent>
                {scopeCatalog.data?.map(item => (
                  <SelectItem
                    key={`${item.dimensionType}:${item.code}`}
                    value={`${item.dimensionType}::${item.code}`}
                  >
                    {item.label} · {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!scopeUserId || !scopeValue || assignScope.isPending}
              onClick={async () => {
                const [dimensionType, code] = scopeValue.split("::");
                try {
                  await assignScope.mutateAsync({
                    userId: Number(scopeUserId),
                    dimensionType: dimensionType as any,
                    code,
                    accessLevel: "view",
                  });
                  await utils.marketFinance.scopes.list.invalidate();
                  toast.success("Escopo oficial atribuído.");
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "Não foi possível atribuir o escopo."
                  );
                }
              }}
            >
              Atribuir escopo
            </Button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {scopeAssignments.data?.map(item => (
              <div
                key={item.scope.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-content-secondary">
                    {item.userName || item.userEmail}
                  </p>
                  <p className="mt-1 truncate text-[11px] text-content-tertiary">
                    {item.dimension?.dimensionType} · {item.dimension?.name}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removeScope.isPending}
                  onClick={async () => {
                    await removeScope.mutateAsync({ id: item.scope.id });
                    await utils.marketFinance.scopes.list.invalidate();
                    toast.success("Escopo removido.");
                  }}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
