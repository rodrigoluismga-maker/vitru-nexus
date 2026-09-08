import DashboardLayout from "@/components/DashboardLayout";
import { EntityImageUpload } from "@/components/nexus/EntityImageUpload";
import { ArchiveButton } from "@/components/nexus/ArchiveButton";
import { FormValidationSummary } from "@/components/nexus/FormValidationSummary";
import { DataTableShell } from "@/components/nexus/DataTableShell";
import { PageHeader } from "@/components/nexus/PageHeader";
import { StatusBadge } from "@/components/nexus/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  GraduationCap,
  Pencil,
  Plus,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Kind = "companies" | "modalities" | "areas";
type CatalogItem = {
  id: number;
  name: string;
  description?: string | null;
  status: "active" | "inactive";
  color?: string;
  institutionalColor?: string;
  shortName?: string;
  acronym?: string;
  icon?: string;
  managerId?: number | null;
  logoUrl?: string | null;
};
const meta = {
  companies: {
    eyebrow: "Estrutura",
    title: "Empresas",
    description: "Marcas e unidades de negócio habilitadas para projetos e usuários.",
    icon: Building2,
    empty: "Nenhuma empresa encontrada",
  },
  modalities: {
    eyebrow: "Estrutura",
    title: "Modalidades",
    description: "Modalidades acadêmicas utilizadas na classificação do portfólio.",
    icon: GraduationCap,
    empty: "Nenhuma modalidade encontrada",
  },
  areas: {
    eyebrow: "Estrutura",
    title: "Áreas",
    description: "Áreas responsáveis pela execução e governança dos projetos.",
    icon: Workflow,
    empty: "Nenhuma área encontrada",
  },
} as const;

const initialForm = {
  name: "",
  shortName: "",
  acronym: "",
  description: "",
  color: "var(--brand-violet-deep)",
  icon: "Building2",
  status: "active" as "active" | "inactive",
};

export default function CatalogManager({ kind }: { kind: Kind }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const utils = trpc.useUtils();
  const pageSize = 8;
  const queryInput = { search, page, pageSize } as const;
  const companies = trpc.admin.companies.list.useQuery(queryInput, {
    enabled: kind === "companies",
  });
  const modalities = trpc.admin.modalities.list.useQuery(queryInput, {
    enabled: kind === "modalities",
  });
  const areas = trpc.admin.areas.list.useQuery(queryInput, { enabled: kind === "areas" });
  const createCompany = trpc.admin.companies.create.useMutation();
  const updateCompany = trpc.admin.companies.update.useMutation();
  const createModality = trpc.admin.modalities.create.useMutation();
  const updateModality = trpc.admin.modalities.update.useMutation();
  const createArea = trpc.admin.areas.create.useMutation();
  const updateArea = trpc.admin.areas.update.useMutation();
  const data =
    kind === "companies" ? companies.data : kind === "modalities" ? modalities.data : areas.data;
  const items = useMemo(
    () =>
      [...((data?.items ?? []) as CatalogItem[])].sort((a, b) =>
        sortAsc ? a.name.localeCompare(b.name, "pt-BR") : b.name.localeCompare(a.name, "pt-BR")
      ),
    [data?.items, sortAsc]
  );
  const loading =
    kind === "companies"
      ? companies.isLoading
      : kind === "modalities"
        ? modalities.isLoading
        : areas.isLoading;
  const errorMessage =
    kind === "companies"
      ? companies.error?.message
      : kind === "modalities"
        ? modalities.error?.message
        : areas.error?.message;
  const config = meta[kind];
  const busy =
    createCompany.isPending ||
    updateCompany.isPending ||
    createModality.isPending ||
    updateModality.isPending ||
    createArea.isPending ||
    updateArea.isPending;
  const invalidate = async () => {
    if (kind === "companies") await utils.admin.companies.list.invalidate();
    else if (kind === "modalities") await utils.admin.modalities.list.invalidate();
    else await utils.admin.areas.list.invalidate();
  };
  const validationErrors = [
    form.name.trim().length < 2 ? "Informe um nome com pelo menos 2 caracteres." : null,
    kind === "companies" && form.shortName.trim().length < 2
      ? "Informe o nome curto da empresa."
      : null,
    kind === "companies" && form.acronym.trim().length < 2 ? "Informe uma sigla válida." : null,
  ].filter(Boolean) as string[];
  const launch = (item?: CatalogItem) => {
    setSubmitted(false);
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            shortName: item.shortName ?? "",
            acronym: item.acronym ?? "",
            description: item.description ?? "",
            color: item.institutionalColor ?? item.color ?? "var(--brand-violet-deep)",
            icon: item.icon ?? "Building2",
            status: item.status,
          }
        : initialForm
    );
    setOpen(true);
  };
  const save = async () => {
    setSubmitted(true);
    if (validationErrors.length) return toast.error("Revise os campos obrigatórios.");
    try {
      if (kind === "companies") {
        const payload = {
          name: form.name,
          shortName: form.shortName,
          acronym: form.acronym,
          description: form.description || null,
          institutionalColor: form.color,
          status: form.status,
        };
        editing
          ? await updateCompany.mutateAsync({ id: editing.id, data: payload })
          : await createCompany.mutateAsync(payload);
      } else if (kind === "modalities") {
        const payload = {
          name: form.name,
          description: form.description || null,
          color: form.color,
          icon: form.icon || "GraduationCap",
          status: form.status,
        };
        editing
          ? await updateModality.mutateAsync({ id: editing.id, data: payload })
          : await createModality.mutateAsync(payload);
      } else {
        const payload = {
          name: form.name,
          description: form.description || null,
          color: form.color,
          icon: form.icon || "Building2",
          status: form.status,
        };
        editing
          ? await updateArea.mutateAsync({ id: editing.id, data: payload })
          : await createArea.mutateAsync(payload);
      }
      await invalidate();
      setOpen(false);
      toast.success(editing ? "Cadastro atualizado." : "Cadastro criado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  const archive = async (item: CatalogItem) => {
    if (kind === "companies")
      await updateCompany.mutateAsync({ id: item.id, data: { status: "inactive" } });
    else if (kind === "modalities")
      await updateModality.mutateAsync({ id: item.id, data: { status: "inactive" } });
    else await updateArea.mutateAsync({ id: item.id, data: { status: "inactive" } });
    await invalidate();
    toast.success("Cadastro arquivado com histórico preservado.");
  };
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
          icon={config.icon}
          actions={
            <Button
              onClick={() => launch()}
              className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo cadastro
            </Button>
          }
        />
        <DataTableShell
          search={search}
          onSearch={value => {
            setSearch(value);
            setPage(1);
          }}
          count={items.length}
          total={data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          loading={loading}
          error={errorMessage}
          filters={
            <Button variant="outline" size="sm" onClick={() => setSortAsc(value => !value)}>
              {sortAsc ? (
                <ArrowDownAZ className="mr-2 h-4 w-4" />
              ) : (
                <ArrowUpAZ className="mr-2 h-4 w-4" />
              )}
              {sortAsc ? "A–Z" : "Z–A"}
            </Button>
          }
          empty={{
            title: config.empty,
            description: "Revise os filtros ou crie um novo cadastro.",
          }}
        >
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.055] text-[11px] uppercase tracking-[.13em] text-content-tertiary">
                <th className="px-5 py-4 text-left font-semibold">Nome</th>
                {kind === "companies" && (
                  <>
                    <th className="px-5 py-4 text-left font-semibold">Nome curto</th>
                    <th className="px-5 py-4 text-center font-semibold">Sigla</th>
                  </>
                )}
                <th className="px-5 py-4 text-center font-semibold">Identidade</th>
                <th className="px-5 py-4 text-center font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr
                  key={item.id}
                  className="border-b border-white/[0.045] transition-colors hover:bg-white/[0.018]"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-content-primary">{item.name}</p>
                    <p className="mt-1 max-w-md truncate text-[11px] text-content-tertiary">
                      {item.description || "Sem descrição"}
                    </p>
                  </td>
                  {kind === "companies" && (
                    <>
                      <td className="px-5 py-4 text-left text-xs text-content-tertiary">
                        {item.shortName}
                      </td>
                      <td className="px-5 py-4 text-center text-xs font-semibold text-content-tertiary">
                        {item.acronym}
                      </td>
                    </>
                  )}
                  <td className="px-5 py-4">
                    <span
                      className="mx-auto block h-5 w-5 rounded-full border border-white/15"
                      style={{ backgroundColor: item.institutionalColor ?? item.color }}
                    />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => launch(item)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      {item.status === "active" && (
                        <ArchiveButton name={item.name} onConfirm={() => archive(item)} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar" : "Novo"} {config.title.slice(0, -1).toLowerCase()}
              </DialogTitle>
              <DialogDescription>
                Preencha os dados obrigatórios e salve para aplicar em toda a plataforma.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  aria-invalid={submitted && form.name.trim().length < 2}
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                />
              </div>
              {kind === "companies" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nome curto</Label>
                    <Input
                      aria-invalid={submitted && form.shortName.trim().length < 2}
                      value={form.shortName}
                      onChange={event => setForm({ ...form, shortName: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sigla</Label>
                    <Input
                      aria-invalid={submitted && form.acronym.trim().length < 2}
                      value={form.acronym}
                      onChange={event => setForm({ ...form, acronym: event.target.value })}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={event => setForm({ ...form, description: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={form.color}
                    onChange={event => setForm({ ...form, color: event.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={value =>
                      setForm({ ...form, status: value as "active" | "inactive" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {kind === "companies" && (
                <EntityImageUpload
                  targetType="company_logo"
                  targetId={editing?.id}
                  currentUrl={editing?.logoUrl}
                  label="Logo da empresa"
                  onDone={() => utils.admin.companies.list.invalidate()}
                />
              )}
              {submitted && <FormValidationSummary errors={validationErrors} />}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={save}
                disabled={busy}
                className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              >
                {busy ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
