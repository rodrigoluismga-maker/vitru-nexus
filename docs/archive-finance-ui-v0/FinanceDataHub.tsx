import { EmptyState } from "@/components/nexus/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  CheckCircle2,
  ArrowRightLeft,
  CloudUpload,
  Download,
  Eye,
  FileCheck2,
  Loader2,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import FinanceLayout, { useFinanceWorkspace } from "./FinanceLayout";

const loadLabels = {
  budget: "Orçamento",
  actual: "Realizado",
  commitment: "Comprometido",
  forecast: "Forecast",
  allocation: "Rateios",
  dimension: "Cadastros",
} as const;

const statusLabels: Record<string, string> = {
  uploaded: "Recebido",
  staging: "Staging",
  validation_failed: "Falha de validação",
  mapping_required: "Mapeamento necessário",
  ready_for_review: "Pronto para revisão",
  approval_pending: "Aguardando aprovação",
  approved: "Aprovado",
  committed: "Persistido",
  rejected: "Rejeitado",
  reversed: "Revertido",
};

type LoadType = keyof typeof loadLabels;
type LoadMode = "append" | "replace_scope";
const fieldDimensionType: Record<string, string> = {
  brand_code: "brand",
  business_unit_code: "business_unit",
  product_code: "product",
  cost_center_code: "cost_center",
  accounting_account_code: "accounting_account",
  management_account_code: "management_account",
  nature_code: "nature",
  pillar_code: "pillar",
  channel_code: "channel",
  initiative_code: "initiative",
  campaign_code: "campaign",
  vendor_code: "vendor",
  contract_code: "contract",
  destination_code: "area",
};

const money = (value: string | number | null | undefined) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(Number(value));

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function downloadBase64(fileName: string, mimeType: string, base64: string) {
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

function DataHubContent() {
  const { cycleId, data: context, capabilities } = useFinanceWorkspace();
  const batches = trpc.finance.imports.list.useQuery();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loadType, setLoadType] = useState<LoadType>("budget");
  const [mode, setMode] = useState<LoadMode>("append");
  const [sourceSystem, setSourceSystem] = useState("Arquivo oficial");
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [mappingErrorId, setMappingErrorId] = useState<number | null>(null);
  const [mappingTargetId, setMappingTargetId] = useState<string>("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const detail = trpc.finance.imports.detail.useQuery(
    { batchId: selectedBatchId! },
    { enabled: Boolean(selectedBatchId) }
  );
  const selectedVersion = useMemo(
    () =>
      context?.versions.find(
        item =>
          item.cycleId === cycleId &&
          (loadType === "forecast"
            ? item.versionType === "forecast"
            : item.versionType !== "forecast")
      ),
    [context?.versions, cycleId, loadType]
  );
  const refresh = () =>
    Promise.all([batches.refetch(), selectedBatchId ? detail.refetch() : Promise.resolve()]);
  const upload = trpc.finance.imports.upload.useMutation({
    onSuccess: result => {
      toast.success(`Lote #${result.batchId} recebido com ${result.rows} linhas.`);
      setOpen(false);
      setFile(null);
      setSelectedBatchId(result.batchId);
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const template = trpc.finance.imports.template.useMutation({
    onSuccess: result => downloadBase64(result.fileName, result.mimeType, result.base64),
    onError: error => toast.error(error.message),
  });
  const validate = trpc.finance.imports.validate.useMutation({
    onSuccess: result => {
      toast.success(
        result.rejected
          ? `${result.rejected} linha(s) exigem correção.`
          : "Validação concluída sem bloqueios."
      );
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const submit = trpc.finance.imports.submit.useMutation({
    onSuccess: () => {
      toast.success("Lote submetido para aprovação.");
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const approve = trpc.finance.imports.approve.useMutation({
    onSuccess: () => {
      toast.success("Lote aprovado e persistido.");
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const reverse = trpc.finance.imports.reverse.useMutation({
    onSuccess: () => {
      toast.success("Lote revertido e estado anterior restaurado.");
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const reject = trpc.finance.imports.reject.useMutation({
    onSuccess: () => {
      toast.success("Lote rejeitado com justificativa registrada.");
      setRejectOpen(false);
      setRejectComment("");
      refresh();
    },
    onError: error => toast.error(error.message),
  });
  const mapping = trpc.finance.mappings.upsert.useMutation({
    onSuccess: async () => {
      toast.success("De-para salvo. Revalidando lote...");
      setMappingErrorId(null);
      setMappingTargetId("");
      if (selectedBatchId) await validate.mutateAsync({ batchId: selectedBatchId });
    },
    onError: error => toast.error(error.message),
  });

  const send = async () => {
    if (!file) return toast.error("Selecione um arquivo XLSX ou CSV.");
    if (file.size > 20 * 1024 * 1024) return toast.error("O arquivo excede o limite de 20 MB.");
    if (["budget", "forecast"].includes(loadType) && !selectedVersion) {
      return toast.error(
        "Crie uma versão compatível em Configurações Financeiras antes desta carga."
      );
    }
    const base64 = await fileToBase64(file);
    upload.mutate({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      base64,
      loadType,
      mode,
      sourceSystem,
      cycleId,
      versionId: ["budget", "forecast"].includes(loadType) ? (selectedVersion?.id ?? null) : null,
      notes: null,
    });
  };

  const selected = detail.data?.batch;
  const mappingError = detail.data?.errors.find(error => error.id === mappingErrorId);
  const mappingStagingRow = detail.data?.rows.find(row => row.id === mappingError?.stagingRowId);
  const mappingDimensionType =
    mappingError?.fieldName === "destination_code"
      ? String(
          (mappingStagingRow?.rawData as Record<string, unknown> | undefined)?.destination_type ??
            ""
        )
      : mappingError?.fieldName
        ? fieldDimensionType[mappingError.fieldName]
        : undefined;
  const mappingTargets =
    context?.dimensions.filter(
      item => item.dimensionType === mappingDimensionType && item.status === "active"
    ) ?? [];
  const reconciliation = [
    ["Anterior", selected?.previousAmount],
    ["Removido", selected?.removedAmount],
    ["Adicionado", selected?.addedAmount],
    ["Variação", selected?.variationAmount],
  ] as const;

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="nexus-kicker">Pipeline governado</p>
          <h2 className="mt-2 text-2xl font-bold">Central de Dados</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/42">
            Nenhum arquivo altera indicadores antes de passar por staging, validação, revisão e
            aprovação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={loadType} onValueChange={value => setLoadType(value as LoadType)}>
            <SelectTrigger className="w-[160px] border-white/10 bg-white/[0.03]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(loadLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.03]"
            onClick={() => template.mutate({ loadType, format: "xlsx" })}
          >
            <Download className="mr-2 h-4 w-4" />
            Modelo XLSX
          </Button>
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.03]"
            onClick={() => template.mutate({ loadType, format: "csv" })}
          >
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          {capabilities.importData && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#ffc20e] font-bold text-[#21142c] hover:bg-[#ffd24a]">
                  <CloudUpload className="mr-2 h-4 w-4" />
                  Nova carga
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#140e1f]">
                <DialogHeader>
                  <DialogTitle>Enviar arquivo financeiro</DialogTitle>
                  <DialogDescription>
                    O arquivo será armazenado e validado antes da persistência.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Field label="Tipo de carga">
                    <Select
                      value={loadType}
                      onValueChange={value => setLoadType(value as LoadType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(loadLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Modo">
                    <Select value={mode} onValueChange={value => setMode(value as LoadMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="append">Complemento</SelectItem>
                        <SelectItem value="replace_scope">Substituir escopo</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="mt-2 text-[11px] leading-5 text-white/35">
                      {mode === "append"
                        ? "Adiciona novos registros e preserva os já persistidos."
                        : "Substitui somente períodos e empresas presentes no arquivo; o estado anterior poderá ser restaurado pela reversão do lote."}
                    </p>
                  </Field>
                  <Field label="Sistema de origem">
                    <Input
                      value={sourceSystem}
                      onChange={event => setSourceSystem(event.target.value)}
                    />
                  </Field>
                  <Field label="Arquivo XLSX ou CSV">
                    <Input
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={event => setFile(event.target.files?.[0] ?? null)}
                      className="file:text-white"
                    />
                    <p className="mt-2 text-[11px] text-white/35">
                      Máximo de 20 MB e 100 mil linhas.
                    </p>
                  </Field>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={send}
                    disabled={!file || upload.isPending}
                    className="bg-[#ffc20e] font-bold text-[#21142c]"
                  >
                    {upload.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar
                    para staging
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <div className="nexus-surface overflow-hidden rounded-3xl">
          {batches.data?.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06]">
                    <TableHead>Lote</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Linhas</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.data.map(({ batch, userName }) => (
                    <TableRow key={batch.id} className="border-white/[0.05]">
                      <TableCell>
                        <p className="max-w-52 truncate font-medium text-white/80">
                          #{batch.id} · {batch.fileName}
                        </p>
                        <p className="mt-1 text-[10px] text-white/32">{userName || "Sistema"}</p>
                      </TableCell>
                      <TableCell className="text-white/50">{loadLabels[batch.loadType]}</TableCell>
                      <TableCell className="text-white/45">
                        {batch.mode === "replace_scope" ? "Substituição" : "Complemento"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full border px-2 py-1 text-[10px] ${batch.status === "committed" ? "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300" : ["validation_failed", "mapping_required", "rejected"].includes(batch.status) ? "border-red-400/15 bg-red-400/[0.07] text-red-300" : "border-[#a689f7]/15 bg-[#a689f7]/[0.07] text-[#bca9ff]"}`}
                        >
                          {statusLabels[batch.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-white/50">
                        {batch.acceptedCount}/{batch.rowCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedBatchId(batch.id)}
                        >
                          <Eye className="mr-2 h-3.5 w-3.5" />
                          Abrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="Nenhum lote recebido"
              description="Baixe o modelo oficial e inicie a primeira carga governada."
            />
          )}
        </div>

        <aside className="nexus-surface rounded-3xl p-5">
          {selected ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <p className="nexus-kicker">Lote #{selected.id}</p>
                  <h3 className="mt-2 max-w-72 truncate font-bold">{selected.fileName}</h3>
                  <p className="mt-2 text-xs text-white/38">
                    {statusLabels[selected.status]} ·{" "}
                    {selected.mode === "replace_scope" ? "Substituição de escopo" : "Complemento"}
                  </p>
                </div>
                {selected.status === "committed" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                ) : (
                  <FileCheck2 className="h-5 w-5 text-[#a689f7]" />
                )}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["Aceitas", selected.acceptedCount],
                  ["Rejeitadas", selected.rejectedCount],
                  ["Avisos", selected.warningCount],
                ].map(([label, value]) => (
                  <MiniMetric key={String(label)} label={String(label)} value={String(value)} />
                ))}
              </div>
              {selected.status === "committed" || selected.status === "reversed" ? (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">
                    Reconciliação
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {reconciliation.map(([label, value]) => (
                      <MiniMetric key={label} label={label} value={money(value)} />
                    ))}
                  </div>
                </div>
              ) : null}
              {detail.data?.errors.length ? (
                <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">
                  {detail.data.errors.map(error => (
                    <div
                      key={error.id}
                      className="rounded-xl border border-red-400/10 bg-red-400/[0.04] p-3"
                    >
                      <p className="text-[10px] font-semibold text-red-300">
                        Linha {error.rowNumber} · {error.errorCode}
                      </p>
                      <p className="mt-1 text-[11px] text-white/45">{error.message}</p>
                      {capabilities.mapData &&
                        error.receivedValue &&
                        error.fieldName &&
                        (fieldDimensionType[error.fieldName] ||
                          error.fieldName === "destination_code") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 h-7 px-2 text-[10px] text-[#bca9ff]"
                            onClick={() => setMappingErrorId(error.id)}
                          >
                            <ArrowRightLeft className="mr-1.5 h-3 w-3" />
                            Mapear “{error.receivedValue}”
                          </Button>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3 text-xs text-emerald-300">
                  <ShieldCheck className="h-4 w-4" />
                  Sem erros bloqueantes registrados.
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {capabilities.mapData &&
                  ["validation_failed", "mapping_required", "ready_for_review"].includes(
                    selected.status
                  ) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => validate.mutate({ batchId: selected.id })}
                    >
                      Validar
                    </Button>
                  )}
                {capabilities.submit && selected.status === "ready_for_review" && (
                  <Button size="sm" onClick={() => submit.mutate({ batchId: selected.id })}>
                    Submeter
                  </Button>
                )}
                {capabilities.approve && selected.status === "approval_pending" && (
                  <Button
                    size="sm"
                    className="bg-emerald-500 text-black"
                    onClick={() =>
                      window.confirm("Aprovar e persistir este lote?") &&
                      approve.mutate({ batchId: selected.id })
                    }
                  >
                    Aprovar e persistir
                  </Button>
                )}
                {capabilities.approve && selected.status === "approval_pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-300"
                    onClick={() => setRejectOpen(true)}
                  >
                    Rejeitar
                  </Button>
                )}
                {capabilities.reverseBatch && selected.status === "committed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-300"
                    onClick={() =>
                      window.confirm("Reverter o lote e restaurar o estado anterior do escopo?") &&
                      reverse.mutate({
                        batchId: selected.id,
                        comment: "Reversão solicitada pela administração financeira.",
                      })
                    }
                  >
                    <RotateCcw className="mr-2 h-3.5 w-3.5" />
                    Reverter
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <TriangleAlert className="h-6 w-6 text-[#ffc20e]" />
              <p className="mt-4 text-sm font-semibold">Selecione um lote</p>
              <p className="mt-2 text-xs leading-5 text-white/35">
                Veja erros, reconciliação e decisões registradas.
              </p>
            </div>
          )}
        </aside>
      </div>
      {selected && (
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <section className="nexus-surface overflow-hidden rounded-3xl">
            <div className="border-b border-white/[0.05] p-5">
              <p className="nexus-kicker">Staging</p>
              <h3 className="mt-2 font-bold">Prévia dos registros recebidos</h3>
              <p className="mt-1 text-xs text-white/35">
                Amostra das primeiras linhas; o arquivo original permanece preservado.
              </p>
            </div>
            {detail.data?.rows.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.06]">
                      <TableHead>Linha</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.data.rows.slice(0, 12).map(row => (
                      <TableRow key={row.id} className="border-white/[0.05]">
                        <TableCell className="text-white/45">{row.rowNumber}</TableCell>
                        <TableCell>
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] ${row.status === "accepted" ? "bg-emerald-400/[0.07] text-emerald-300" : "bg-red-400/[0.07] text-red-300"}`}
                          >
                            {row.status === "accepted"
                              ? "Aceita"
                              : row.status === "mapping_required"
                                ? "Mapear"
                                : "Rejeitada"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-64 truncate text-white/58">
                          {row.sourceRecordId || "—"}
                        </TableCell>
                        <TableCell className="text-right text-white/58">
                          {money(row.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                title="Staging sem registros"
                description="O lote não possui linhas disponíveis para prévia."
              />
            )}
          </section>
          <section className="nexus-surface rounded-3xl p-5">
            <p className="nexus-kicker">Governança</p>
            <h3 className="mt-2 font-bold">Histórico de decisões</h3>
            {detail.data?.approvals.length ? (
              <div className="mt-5 space-y-3">
                {detail.data.approvals.map(item => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-white/70">
                        {item.decision === "submitted"
                          ? "Submetido"
                          : item.decision === "approved"
                            ? "Aprovado"
                            : item.decision === "rejected"
                              ? "Rejeitado"
                              : "Revertido"}
                      </span>
                      <span className="text-[10px] text-white/28">
                        {new Date(item.decidedAt).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="mt-2 text-[11px] leading-5 text-white/38">{item.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 text-xs text-white/35">
                Nenhuma decisão registrada para este lote.
              </p>
            )}
          </section>
        </div>
      )}
      <Dialog
        open={Boolean(mappingError)}
        onOpenChange={value => {
          if (!value) {
            setMappingErrorId(null);
            setMappingTargetId("");
          }
        }}
      >
        <DialogContent className="border-white/10 bg-[#140e1f]">
          <DialogHeader>
            <DialogTitle>Criar de-para</DialogTitle>
            <DialogDescription>
              O valor externo será traduzido automaticamente nas próximas validações da mesma
              origem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Valor recebido">
              <Input value={mappingError?.receivedValue ?? ""} readOnly />
            </Field>
            <Field label="Cadastro de destino">
              <Select value={mappingTargetId} onValueChange={setMappingTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cadastro correto" />
                </SelectTrigger>
                <SelectContent>
                  {mappingTargets.map(item => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.code} · {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!mappingTargets.length && (
                <p className="mt-2 text-[11px] text-[#ffc20e]">
                  Crie primeiro um cadastro do tipo correspondente em Configurações Financeiras.
                </p>
              )}
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMappingErrorId(null)}>
              Cancelar
            </Button>
            <Button
              disabled={!mappingTargetId || !selected || !mappingDimensionType || mapping.isPending}
              onClick={() =>
                selected &&
                mappingDimensionType &&
                mappingError?.receivedValue &&
                mapping.mutate({
                  sourceSystem: selected.sourceSystem,
                  dimensionType: mappingDimensionType,
                  sourceValue: mappingError.receivedValue,
                  targetDimensionId: Number(mappingTargetId),
                })
              }
            >
              Salvar e revalidar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="border-white/10 bg-[#140e1f]">
          <DialogHeader>
            <DialogTitle>Rejeitar lote</DialogTitle>
            <DialogDescription>
              A justificativa ficará registrada no histórico de governança.
            </DialogDescription>
          </DialogHeader>
          <Field label="Justificativa">
            <Input
              value={rejectComment}
              onChange={event => setRejectComment(event.target.value)}
              placeholder="Descreva o motivo da rejeição"
            />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!selected || rejectComment.trim().length < 3 || reject.isPending}
              onClick={() =>
                selected && reject.mutate({ batchId: selected.id, comment: rejectComment.trim() })
              }
            >
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
      <p className="text-[9px] uppercase tracking-wider text-white/28">{label}</p>
      <p className="nexus-number mt-2 text-sm font-bold">{value}</p>
    </div>
  );
}
export default function FinanceDataHub() {
  return (
    <FinanceLayout>
      <DataHubContent />
    </FinanceLayout>
  );
}
