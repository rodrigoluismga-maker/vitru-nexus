import { EmptyState } from "@/components/nexus/EmptyState";
import { MetricCard } from "@/components/nexus/MetricCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  CircleDollarSign,
  Gauge,
  Scale,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import FinanceLayout, { useFinanceWorkspace } from "./FinanceLayout";

type CompositionDimension =
  | "company"
  | "brand"
  | "business_unit"
  | "modality"
  | "product"
  | "area"
  | "pillar"
  | "channel"
  | "project"
  | "initiative"
  | "owner"
  | "vendor";
const compositionDimensions: Array<{ value: CompositionDimension; label: string }> = [
  { value: "company", label: "Empresa" },
  { value: "brand", label: "Marca" },
  { value: "business_unit", label: "BU" },
  { value: "modality", label: "Modalidade" },
  { value: "product", label: "Produto" },
  { value: "area", label: "Área" },
  { value: "pillar", label: "Pilar" },
  { value: "channel", label: "Canal" },
  { value: "project", label: "Projeto" },
  { value: "initiative", label: "Iniciativa" },
  { value: "owner", label: "Responsável" },
  { value: "vendor", label: "Fornecedor" },
];

const money = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value);
const pct = (value: number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value * 100)}%`;

function CockpitContent() {
  const { cycleId } = useFinanceWorkspace();
  const [compositionDimension, setCompositionDimension] = useState<CompositionDimension>("company");
  const query = trpc.finance.cockpit.useQuery(
    { cycleId, compositionDimension },
    { enabled: Boolean(cycleId) }
  );
  const data = query.data;
  const cutoffPeriod =
    data?.context && "cutoffPeriod" in data.context ? data.context.cutoffPeriod : null;
  if (query.isLoading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-36 rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    );
  if (!cycleId)
    return (
      <EmptyState
        title="Ciclo financeiro não configurado"
        description="Crie um ciclo em Configurações Financeiras para iniciar a governança."
      />
    );
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="nexus-kicker">Painel Executivo</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">
            Leitura financeira consolidada
          </h2>
          <p className="mt-2 text-sm text-white/40">
            Dados aprovados até {cutoffPeriod ?? "competência não definida"}.
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-[.15em] text-white/28">
          {data?.dataQuality.committedBatches ?? 0} lotes persistidos
        </span>
      </div>
      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Orçamento revisado"
          value={money(data?.kpis.revisedBudget)}
          helper="Versão aprovada"
          icon={Banknote}
          tone="violet"
        />
        <MetricCard
          label="Realizado YTD"
          value={money(data?.kpis.actualYtd)}
          helper={`Consumo ${pct(data?.kpis.consumedPct)}`}
          icon={CircleDollarSign}
          tone="blue"
          delay={40}
        />
        <MetricCard
          label="Comprometido"
          value={money(data?.kpis.openCommitments)}
          helper={`Orçamento comprometido ${pct(data?.kpis.committedPct)}`}
          icon={ShieldAlert}
          tone="yellow"
          delay={80}
        />
        <MetricCard
          label="Forecast fechamento"
          value={money(data?.kpis.closingForecast)}
          helper={`Desvio ${money(data?.kpis.closingVariance)}`}
          icon={TrendingUp}
          tone="green"
          delay={120}
        />
        <MetricCard
          label="Saldo disponível"
          value={money(data?.kpis.availableBalance)}
          helper={`Pós-forecast ${money(data?.kpis.postForecastBalance)}`}
          icon={Gauge}
          tone={Number(data?.kpis.availableBalance ?? 0) < 0 ? "red" : "green"}
          delay={160}
        />
      </section>
      <section className="mt-4 grid gap-4 xl:grid-cols-[1.55fr_.75fr]">
        <div className="nexus-surface rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="nexus-kicker">Evolução mensal</p>
              <h3 className="mt-2 text-lg font-bold">Orçamento, realizado e projeção</h3>
            </div>
            <Activity className="h-5 w-5 text-[#a689f7]" />
          </div>
          {data?.hasData ? (
            <div className="mt-6 h-[330px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly}>
                  <defs>
                    <linearGradient id="financeActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffc20e" stopOpacity={0.42} />
                      <stop offset="100%" stopColor="#ffc20e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                  <XAxis
                    dataKey="period"
                    tick={{ fill: "rgba(255,255,255,.35)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgba(255,255,255,.32)", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={value => `${Math.round(Number(value) / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#160f21",
                      border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: 14,
                    }}
                    formatter={value => money(Number(value))}
                  />
                  <Area
                    type="monotone"
                    dataKey="budget"
                    name="Orçamento"
                    stroke="#a689f7"
                    fillOpacity={0}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    name="Realizado"
                    stroke="#ffc20e"
                    fill="url(#financeActual)"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    name="Forecast"
                    stroke="#56e8a9"
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Aguardando dados aprovados"
                description="Baixe o template na Central de Dados, carregue os arquivos oficiais e conclua a aprovação para ativar a série financeira."
              />
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div className="nexus-surface rounded-3xl p-5">
            <p className="nexus-kicker">Qualidade da base</p>
            <div className="mt-5 space-y-4">
              <Quality label="Lotes recebidos" value={data?.dataQuality.batches ?? 0} />
              <Quality label="Lotes persistidos" value={data?.dataQuality.committedBatches ?? 0} />
              <Quality
                label="Erros registrados"
                value={data?.dataQuality.errors ?? 0}
                alert={Boolean(data?.dataQuality.errors)}
              />
            </div>
          </div>
          <div className="nexus-surface rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <p className="nexus-kicker">Radar financeiro</p>
              <AlertTriangle className="h-4 w-4 text-[#ffc20e]" />
            </div>
            {data?.alerts?.length ? (
              <div className="mt-4 space-y-2">
                {(data.alerts ?? []).slice(0, 4).map(item => (
                  <div
                    key={item.code}
                    className={`rounded-xl border p-3 ${item.severity === "critical" ? "border-red-400/10 bg-red-400/[0.05]" : item.severity === "warning" ? "border-[#ffc20e]/10 bg-[#ffc20e]/[0.04]" : "border-[#a689f7]/10 bg-[#a689f7]/[0.04]"}`}
                  >
                    <p className="text-xs font-semibold text-white/75">{item.title}</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/38">{item.message}</p>
                    <p className="mt-2 text-[10px] font-semibold text-[#bca9ff]">{item.action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs leading-5 text-white/38">
                Nenhuma exceção financeira calculada no cenário atual.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="nexus-surface rounded-3xl p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="nexus-kicker">Composição</p>
              <h3 className="mt-2 text-lg font-bold">
                Mix do realizado por{" "}
                {compositionDimensions
                  .find(item => item.value === compositionDimension)
                  ?.label.toLowerCase()}
              </h3>
            </div>
            <Select
              value={compositionDimension}
              onValueChange={value => setCompositionDimension(value as CompositionDimension)}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/[0.03] sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {compositionDimensions.map(item => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {data?.composition?.length ? (
            <div className="mt-5 space-y-4">
              {(data.composition ?? []).slice(0, 6).map(item => (
                <div key={item.dimensionId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/58">{item.label}</span>
                    <span className="nexus-number font-semibold">
                      {money(item.amount)} · {pct(item.share)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#6824d3] to-[#ffc20e]"
                      style={{ width: `${Math.max(2, (item.share ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Composição ainda indisponível"
                description="O mix será calculado somente com realizado aprovado e classificado na dimensão selecionada."
              />
            </div>
          )}
        </div>
        <div className="nexus-surface rounded-3xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="nexus-kicker">Deliberação</p>
              <h3 className="mt-2 text-lg font-bold">Decisões pendentes do projeto</h3>
            </div>
            <Scale className="h-5 w-5 text-[#ffc20e]" />
          </div>
          {data?.decisions?.length ? (
            <div className="mt-5 space-y-2">
              {(data.decisions ?? []).map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white/75">{item.title}</p>
                      <p className="mt-1 text-[11px] text-white/35">
                        {item.ownerName || "Responsável não definido"}
                        {item.dueDate
                          ? ` · até ${new Date(item.dueDate).toLocaleDateString("pt-BR")}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#ffc20e]/10 px-2 py-1 text-[9px] font-bold uppercase text-[#ffc20e]">
                      Pendente
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 text-xs leading-5 text-white/38">
              Nenhuma decisão pendente registrada no Planejamento Orçamentário 2027.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
function Quality({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/45">{label}</span>
        <span className={`nexus-number font-bold ${alert ? "text-[#ff7b7b]" : "text-white"}`}>
          {value}
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${alert ? "bg-[#ff7b7b]" : "bg-[#a689f7]"}`}
          style={{ width: `${Math.min(100, value ? 100 : 0)}%` }}
        />
      </div>
    </div>
  );
}
export default function FinanceCockpit() {
  return (
    <FinanceLayout>
      <CockpitContent />
    </FinanceLayout>
  );
}
