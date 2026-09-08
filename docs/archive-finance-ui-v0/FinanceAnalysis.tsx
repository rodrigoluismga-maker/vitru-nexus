import { EmptyState } from "@/components/nexus/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import {
  Boxes,
  FileSearch,
  HandCoins,
  Landmark,
  ReceiptText,
  Scale,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import FinanceLayout, { useFinanceWorkspace } from "./FinanceLayout";

type View =
  | "budget_actual"
  | "commitments"
  | "investments"
  | "responsibility"
  | "vendors"
  | "allocations";
type Dimension =
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
const dimensions: Array<{ value: Dimension; label: string }> = [
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
const config = {
  budget_actual: {
    eyebrow: "Desempenho",
    title: "Orçamento x Realizado",
    description: "Comparação entre orçamento aprovado, execução, compromissos e forecast.",
    icon: Scale,
  },
  commitments: {
    eyebrow: "Obrigações",
    title: "Comprometimentos",
    description: "Contratos, pedidos, provisões e valores ainda abertos.",
    icon: ReceiptText,
  },
  investments: {
    eyebrow: "Alocação",
    title: "Investimentos",
    description: "Leitura por pilar e direcionador estratégico.",
    icon: Landmark,
  },
  responsibility: {
    eyebrow: "Accountability",
    title: "Responsabilidade Financeira",
    description: "Verbas, consumo e saldo organizados por owner.",
    icon: UsersRound,
  },
  vendors: {
    eyebrow: "Ecossistema",
    title: "Fornecedores e Contratos",
    description: "Cadastro governado de fornecedores e contratos.",
    icon: HandCoins,
  },
  allocations: {
    eyebrow: "Casa e Condomínio",
    title: "Rateios",
    description: "Execuções, critérios, valores alocados e reconciliação.",
    icon: Boxes,
  },
} as const;
const money = (value: unknown) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(Number(value));

function AnalysisContent({ view }: { view: View }) {
  const { cycleId } = useFinanceWorkspace();
  const meta = config[view];
  const Icon = meta.icon;
  const [dimension, setDimension] = useState<Dimension>(
    view === "responsibility" ? "owner" : view === "investments" ? "pillar" : "company"
  );
  const comparison = trpc.finance.comparison.useQuery(
    { cycleId, dimension },
    {
      enabled:
        Boolean(cycleId) && ["budget_actual", "investments", "responsibility"].includes(view),
    }
  );
  const facts = trpc.finance.facts.useQuery(
    { cycleId, view },
    {
      enabled:
        Boolean(cycleId) && !["budget_actual", "investments", "responsibility"].includes(view),
    }
  );
  const rows = ["budget_actual", "investments", "responsibility"].includes(view)
    ? (comparison.data?.rows ?? [])
    : (facts.data?.rows ?? []);
  const loading = comparison.isLoading || facts.isLoading;
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="nexus-kicker">{meta.eyebrow}</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#a689f7]/15 bg-[#a689f7]/10">
              <Icon className="h-4 w-4 text-[#b7a2ff]" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{meta.title}</h2>
              <p className="mt-1 text-sm text-white/40">{meta.description}</p>
            </div>
          </div>
        </div>
        {["budget_actual", "investments", "responsibility"].includes(view) && (
          <Select value={dimension} onValueChange={value => setDimension(value as Dimension)}>
            <SelectTrigger className="w-[210px] border-white/10 bg-white/[0.03]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dimensions.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="nexus-surface mt-5 overflow-hidden rounded-3xl">
        {loading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.06]">
                  <TableHead>Dimensão / registro</TableHead>
                  <TableHead className="text-right">Orçamento</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead className="text-right">Comprometido</TableHead>
                  <TableHead className="text-right">Forecast / saldo</TableHead>
                  <TableHead className="text-right">Desvio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((raw: any, index) => {
                  const row = raw.run
                    ? {
                        label: `${raw.ruleCode} · ${raw.run.period}`,
                        budget: raw.run.sourceAmount,
                        actual: raw.run.allocatedAmount,
                        commitments: raw.entryCount,
                        forecast: raw.run.differenceAmount,
                        variance: raw.run.differenceAmount,
                      }
                    : raw.label
                      ? raw
                      : {
                          label:
                            raw.name ??
                            raw.documentNumber ??
                            raw.code ??
                            `Registro ${raw.id ?? index + 1}`,
                          budget: raw.budget ?? raw.originalAmount,
                          actual: raw.actual ?? raw.realizedAmount,
                          commitments: raw.commitments ?? raw.openAmount,
                          forecast: raw.forecast ?? raw.available,
                          variance: raw.variance,
                        };
                  return (
                    <TableRow key={index} className="border-white/[0.05]">
                      <TableCell className="font-medium text-white/80">{row.label}</TableCell>
                      <TableCell className="text-right text-white/55">
                        {money(row.budget)}
                      </TableCell>
                      <TableCell className="text-right text-white/55">
                        {money(row.actual)}
                      </TableCell>
                      <TableCell className="text-right text-white/55">
                        {money(row.commitments)}
                      </TableCell>
                      <TableCell className="text-right text-white/55">
                        {money(row.forecast)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${Number(row.variance ?? 0) > 0 ? "text-[#ff8f8f]" : "text-emerald-300"}`}
                      >
                        {money(row.variance)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Nenhum dado aprovado"
            description="Os resultados aparecerão após o envio, validação e aprovação dos arquivos oficiais na Central de Dados."
            action={
              <Button
                variant="outline"
                className="border-white/10 bg-white/[0.03]"
                onClick={() => window.location.assign("/finance/data")}
              >
                Abrir Central de Dados
              </Button>
            }
          />
        )}
      </div>
    </>
  );
}
export default function FinanceAnalysis({ view }: { view: View }) {
  return (
    <FinanceLayout>
      <AnalysisContent view={view} />
    </FinanceLayout>
  );
}
