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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  CalendarRange,
  CheckCircle2,
  DatabaseZap,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import FinanceLayout, { useFinanceWorkspace } from "./FinanceLayout";

const dimensionLabels = {
  brand: "Marca",
  business_unit: "BU",
  product: "Produto",
  cost_center: "Centro de custo",
  accounting_account: "Conta contábil",
  management_account: "Conta gerencial",
  nature: "Natureza",
  pillar: "Pilar",
  channel: "Canal",
  initiative: "Iniciativa",
  campaign: "Campanha",
  vendor: "Fornecedor",
  contract: "Contrato",
} as const;
const accessLabels = {
  view: "Consulta",
  contribute: "Contribuição",
  approve: "Aprovação",
  admin: "Administração",
} as const;
type DimensionType = keyof typeof dimensionLabels;
type DimensionStatus = "active" | "inactive";

function SettingsContent() {
  const { data, cycleId, capabilities } = useFinanceWorkspace();
  const utils = trpc.useUtils();
  const scopes = trpc.finance.scopes.list.useQuery(undefined, {
    enabled: capabilities.manageDimensions,
  });
  const [dimensionOpen, setDimensionOpen] = useState(false);
  const [editingDimensionId, setEditingDimensionId] = useState<number | null>(null);
  const [dimensionType, setDimensionType] = useState<DimensionType>("brand");
  const [dimensionCode, setDimensionCode] = useState("");
  const [dimensionName, setDimensionName] = useState("");
  const [dimensionStatus, setDimensionStatus] = useState<DimensionStatus>("active");
  const [cycleOpen, setCycleOpen] = useState(false);
  const [year, setYear] = useState(2028);
  const [cycleCode, setCycleCode] = useState("FY2028");
  const [cycleName, setCycleName] = useState("Planejamento Orçamentário 2028");
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionType, setVersionType] = useState<
    "budget_original" | "budget_revision" | "forecast"
  >("budget_original");
  const [versionCode, setVersionCode] = useState("ORC-ORIGINAL");
  const [versionName, setVersionName] = useState("Orçamento Original");
  const [scopeUserId, setScopeUserId] = useState("");
  const [scopeType, setScopeType] = useState<"all" | "company" | "area" | "owner">("all");
  const [scopeId, setScopeId] = useState("");
  const [accessLevel, setAccessLevel] = useState<keyof typeof accessLabels>("view");
  const selectedCycle = data?.cycles.find(item => item.id === cycleId);
  const selectedDimensions =
    data?.dimensions.filter(item => item.dimensionType === dimensionType) ?? [];
  const scopeOptions = useMemo(
    () =>
      scopeType === "company"
        ? (data?.companies.map(item => ({ id: item.id, label: item.name })) ?? [])
        : scopeType === "area"
          ? (data?.areas.map(item => ({ id: item.id, label: item.name })) ?? [])
          : scopeType === "owner"
            ? (data?.users.map(item => ({
                id: item.id,
                label: item.name ?? item.email ?? `Usuário ${item.id}`,
              })) ?? [])
            : [],
    [scopeType, data]
  );
  const invalidate = () => {
    utils.finance.context.invalidate();
    scopes.refetch();
  };
  const dimension = trpc.finance.dimensions.upsert.useMutation({
    onSuccess: () => {
      toast.success("Cadastro financeiro salvo.");
      setDimensionOpen(false);
      setEditingDimensionId(null);
      setDimensionCode("");
      setDimensionName("");
      invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const createCycle = trpc.finance.cycles.create.useMutation({
    onSuccess: () => {
      toast.success("Ciclo financeiro criado.");
      setCycleOpen(false);
      invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const createVersion = trpc.finance.cycles.createVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão criada em rascunho.");
      setVersionOpen(false);
      invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const approveVersion = trpc.finance.cycles.approveVersion.useMutation({
    onSuccess: () => {
      toast.success("Versão aprovada.");
      invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const upsertScope = trpc.finance.scopes.upsert.useMutation({
    onSuccess: () => {
      toast.success("Escopo financeiro atribuído.");
      setScopeUserId("");
      setScopeId("");
      invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const removeScope = trpc.finance.scopes.remove.useMutation({
    onSuccess: () => {
      toast.success("Escopo removido.");
      invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const openNewDimension = () => {
    setEditingDimensionId(null);
    setDimensionCode("");
    setDimensionName("");
    setDimensionStatus("active");
    setDimensionOpen(true);
  };
  const openEditDimension = (item: NonNullable<typeof data>["dimensions"][number]) => {
    setEditingDimensionId(item.id);
    setDimensionType(item.dimensionType as DimensionType);
    setDimensionCode(item.code);
    setDimensionName(item.name);
    setDimensionStatus(item.status);
    setDimensionOpen(true);
  };
  const saveDimension = () =>
    dimension.mutate({
      id: editingDimensionId ?? undefined,
      dimensionType,
      code: dimensionCode,
      name: dimensionName,
      status: dimensionStatus,
    });

  if (!capabilities.manageDimensions)
    return (
      <div className="nexus-surface rounded-3xl p-8 text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-[#ffc20e]" />
        <h2 className="mt-4 text-xl font-bold">Acesso administrativo necessário</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/42">
          Cadastros, ciclos, versões e escopos financeiros são restritos aos perfis autorizados.
        </p>
      </div>
    );

  return (
    <>
      <div>
        <p className="nexus-kicker">Governança estrutural</p>
        <h2 className="mt-2 text-2xl font-bold">Configurações Financeiras</h2>
        <p className="mt-2 max-w-2xl text-sm text-white/42">
          Ciclos, versões, dimensões e alçadas permanecem auditáveis e independentes dos arquivos
          transacionais.
        </p>
      </div>
      <Tabs defaultValue="dimensions" className="mt-5">
        <TabsList className="border border-white/[0.06] bg-white/[0.025]">
          <TabsTrigger value="dimensions">Cadastros</TabsTrigger>
          <TabsTrigger value="cycles">Ciclos e versões</TabsTrigger>
          <TabsTrigger value="scopes">Escopos</TabsTrigger>
        </TabsList>
        <TabsContent value="dimensions" className="mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={dimensionType}
              onValueChange={value => setDimensionType(value as DimensionType)}
            >
              <SelectTrigger className="w-full border-white/10 bg-white/[0.03] sm:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(dimensionLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openNewDimension} className="bg-[#ffc20e] font-bold text-[#21142c]">
              <Plus className="mr-2 h-4 w-4" />
              Novo cadastro
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Object.entries(dimensionLabels).map(([value, label]) => {
              const count =
                data?.dimensions.filter(item => item.dimensionType === value).length ?? 0;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setDimensionType(value as DimensionType)}
                  className={`nexus-surface rounded-2xl p-4 text-left transition ${dimensionType === value ? "border-[#ffc20e]/25" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#a689f7]/10">
                      <DatabaseZap className="h-4 w-4 text-[#b7a2ff]" />
                    </span>
                    <span className="nexus-number text-lg font-bold">{count}</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-[11px] text-white/34">Parametrizado no banco</p>
                </button>
              );
            })}
          </div>
          <div className="nexus-surface mt-4 rounded-3xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="nexus-kicker">{dimensionLabels[dimensionType]}</p>
                <h3 className="mt-2 font-bold">Cadastros parametrizados</h3>
              </div>
              <span className="text-xs text-white/35">{selectedDimensions.length} registro(s)</span>
            </div>
            <div className="mt-4 space-y-2">
              {selectedDimensions.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-white/75">
                      {item.code} · {item.name}
                    </p>
                    <p
                      className={`mt-1 text-[10px] uppercase tracking-wider ${item.status === "active" ? "text-emerald-300" : "text-white/30"}`}
                    >
                      {item.status === "active" ? "Ativo" : "Inativo"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Editar ${item.name}`}
                    onClick={() => openEditDimension(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {!selectedDimensions.length && (
                <p className="rounded-xl border border-dashed border-white/[0.08] p-5 text-center text-xs text-white/35">
                  Nenhum cadastro deste tipo.
                </p>
              )}
            </div>
          </div>
          <Dialog open={dimensionOpen} onOpenChange={setDimensionOpen}>
            <DialogContent className="border-white/10 bg-[#140e1f]">
              <DialogHeader>
                <DialogTitle>
                  {editingDimensionId ? "Editar cadastro financeiro" : "Novo cadastro financeiro"}
                </DialogTitle>
                <DialogDescription>
                  O código será usado nos arquivos e nas regras de mapeamento.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Field label="Tipo">
                  <Select
                    value={dimensionType}
                    onValueChange={value => setDimensionType(value as DimensionType)}
                    disabled={Boolean(editingDimensionId)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dimensionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Código">
                  <Input
                    value={dimensionCode}
                    onChange={event => setDimensionCode(event.target.value)}
                  />
                </Field>
                <Field label="Nome">
                  <Input
                    value={dimensionName}
                    onChange={event => setDimensionName(event.target.value)}
                  />
                </Field>
                <Field label="Status">
                  <Select
                    value={dimensionStatus}
                    onValueChange={value => setDimensionStatus(value as DimensionStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDimensionOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={saveDimension}
                  disabled={!dimensionCode.trim() || !dimensionName.trim() || dimension.isPending}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="cycles" className="mt-4">
          <div className="mb-4 flex flex-wrap justify-end gap-2">
            <Dialog open={cycleOpen} onOpenChange={setCycleOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10">
                  <CalendarRange className="mr-2 h-4 w-4" />
                  Novo ciclo
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#140e1f]">
                <DialogHeader>
                  <DialogTitle>Novo ciclo financeiro</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Exercício">
                    <Input
                      type="number"
                      value={year}
                      onChange={event => setYear(Number(event.target.value))}
                    />
                  </Field>
                  <Field label="Código">
                    <Input value={cycleCode} onChange={event => setCycleCode(event.target.value)} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Nome">
                      <Input
                        value={cycleName}
                        onChange={event => setCycleName(event.target.value)}
                      />
                    </Field>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setCycleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() =>
                      createCycle.mutate({
                        fiscalYear: year,
                        code: cycleCode,
                        name: cycleName,
                        startPeriod: `${year}-01`,
                        endPeriod: `${year}-12`,
                        currency: "BRL",
                        linkedProjectId: data?.linkedProject?.id ?? null,
                      })
                    }
                  >
                    Criar ciclo
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#ffc20e] font-bold text-[#21142c]" disabled={!cycleId}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova versão
                </Button>
              </DialogTrigger>
              <DialogContent className="border-white/10 bg-[#140e1f]">
                <DialogHeader>
                  <DialogTitle>Nova versão · {selectedCycle?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Field label="Tipo">
                    <Select
                      value={versionType}
                      onValueChange={value => setVersionType(value as typeof versionType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="budget_original">Orçamento original</SelectItem>
                        <SelectItem value="budget_revision">Revisão orçamentária</SelectItem>
                        <SelectItem value="forecast">Forecast</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Código">
                    <Input
                      value={versionCode}
                      onChange={event => setVersionCode(event.target.value)}
                    />
                  </Field>
                  <Field label="Nome">
                    <Input
                      value={versionName}
                      onChange={event => setVersionName(event.target.value)}
                    />
                  </Field>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setVersionOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() =>
                      cycleId &&
                      createVersion.mutate({
                        cycleId,
                        code: versionCode,
                        name: versionName,
                        versionType,
                        effectivePeriod: selectedCycle?.startPeriod ?? null,
                      })
                    }
                  >
                    Criar versão
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel icon={CalendarRange} title="Ciclos">
              <div className="space-y-2">
                {data?.cycles.map(cycle => (
                  <div
                    key={cycle.id}
                    className={`rounded-xl border p-4 ${cycle.id === cycleId ? "border-[#ffc20e]/20 bg-[#ffc20e]/[0.05]" : "border-white/[0.05] bg-white/[0.02]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{cycle.name}</p>
                        <p className="mt-1 text-[11px] text-white/35">
                          {cycle.startPeriod} a {cycle.endPeriod}
                        </p>
                      </div>
                      <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] text-white/50">
                        {cycle.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel icon={Settings2} title="Versões">
              <div className="space-y-2">
                {data?.versions
                  .filter(version => !cycleId || version.cycleId === cycleId)
                  .map(version => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold">{version.name}</p>
                        <p className="mt-1 text-[11px] text-white/35">
                          {version.versionType} · v{version.versionNumber} · {version.status}
                        </p>
                      </div>
                      {capabilities.approve && version.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => approveVersion.mutate({ id: version.id })}
                        >
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                          Aprovar
                        </Button>
                      )}
                    </div>
                  ))}
                {!data?.versions.some(version => !cycleId || version.cycleId === cycleId) && (
                  <p className="text-xs text-white/35">Nenhuma versão criada para o ciclo.</p>
                )}
              </div>
            </Panel>
          </div>
        </TabsContent>
        <TabsContent value="scopes" className="mt-4">
          <div className="grid gap-4 xl:grid-cols-[.8fr_1.2fr]">
            <Panel icon={ShieldCheck} title="Atribuir escopo">
              <div className="space-y-4">
                <Field label="Usuário">
                  <Select value={scopeUserId} onValueChange={setScopeUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.users.map(user => (
                        <SelectItem key={user.id} value={String(user.id)}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tipo de escopo">
                  <Select
                    value={scopeType}
                    onValueChange={value => {
                      setScopeType(value as typeof scopeType);
                      setScopeId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os dados</SelectItem>
                      <SelectItem value="company">Empresa</SelectItem>
                      <SelectItem value="area">Área</SelectItem>
                      <SelectItem value="owner">Responsável</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {scopeType !== "all" && (
                  <Field label="Valor">
                    <Select value={scopeId} onValueChange={setScopeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {scopeOptions.map(option => (
                          <SelectItem key={option.id} value={String(option.id)}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
                <Field label="Nível">
                  <Select
                    value={accessLevel}
                    onValueChange={value => setAccessLevel(value as keyof typeof accessLabels)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(accessLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  className="w-full bg-[#ffc20e] font-bold text-[#21142c]"
                  onClick={() =>
                    upsertScope.mutate({
                      userId: Number(scopeUserId),
                      scopeType,
                      scopeId: scopeType === "all" ? null : Number(scopeId),
                      accessLevel,
                    })
                  }
                  disabled={!scopeUserId || (scopeType !== "all" && !scopeId)}
                >
                  Atribuir acesso
                </Button>
              </div>
            </Panel>
            <Panel icon={UsersRound} title="Escopos ativos">
              <div className="space-y-2">
                {scopes.data?.map(({ scope, userName, userEmail }) => (
                  <div
                    key={scope.id}
                    className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{userName || userEmail}</p>
                      <p className="mt-1 text-[11px] text-white/35">
                        {scope.scopeType}
                        {scope.scopeId ? ` #${scope.scopeId}` : ""} ·{" "}
                        {accessLabels[scope.accessLevel]}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-300"
                      aria-label="Remover escopo"
                      onClick={() =>
                        window.confirm("Remover este escopo financeiro?") &&
                        removeScope.mutate({ id: scope.id })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {!scopes.data?.length && (
                  <p className="text-xs leading-5 text-white/35">
                    Nenhum escopo específico. Administradores mantêm acesso integral.
                  </p>
                )}
              </div>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>
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
function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarRange;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="nexus-surface rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[#a689f7]" />
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
export default function FinanceSettings() {
  return (
    <FinanceLayout>
      <SettingsContent />
    </FinanceLayout>
  );
}
