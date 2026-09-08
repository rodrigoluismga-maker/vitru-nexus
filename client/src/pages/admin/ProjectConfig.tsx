import DashboardLayout from "@/components/DashboardLayout";
import { EmptyState } from "@/components/nexus/EmptyState";
import { ArchiveButton } from "@/components/nexus/ArchiveButton";
import { FormValidationSummary } from "@/components/nexus/FormValidationSummary";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CircleDot, Layers3, Pencil, Plus, Signal, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
type ConfigKind = "category" | "status" | "priority";
type ConfigItem = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  color: string;
  icon?: string;
  status: "active" | "inactive";
  weight?: number;
  sortOrder?: number;
  isTerminal?: boolean;
};
type ConfigForm = {
  name: string;
  code: string;
  description: string;
  color: string;
  icon: string;
  status: "active" | "inactive";
  weight: number;
  sortOrder: number;
  isTerminal: boolean;
};
const initialForm: ConfigForm = {
  name: "",
  code: "",
  description: "",
  color: "var(--brand-violet-deep)",
  icon: "CircleDot",
  status: "active",
  weight: 1,
  sortOrder: 0,
  isTerminal: false,
};
const labels = { category: "categoria", status: "status", priority: "prioridade" };
export default function ProjectConfig() {
  const query = trpc.admin.taxonomies.all.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ConfigKind>("category");
  const [editing, setEditing] = useState<ConfigItem | null>(null);
  const [form, setForm] = useState<ConfigForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const createCategory = trpc.admin.taxonomies.createCategory.useMutation();
  const updateCategory = trpc.admin.taxonomies.updateCategory.useMutation();
  const createStatus = trpc.admin.taxonomies.createStatus.useMutation();
  const updateStatus = trpc.admin.taxonomies.updateStatus.useMutation();
  const createPriority = trpc.admin.taxonomies.createPriority.useMutation();
  const updatePriority = trpc.admin.taxonomies.updatePriority.useMutation();
  const validationErrors = [
    form.name.trim().length < 2 ? "Informe um nome com pelo menos 2 caracteres." : null,
    !/^[a-z0-9_]{2,60}$/.test(form.code)
      ? "Use um código com letras minúsculas, números ou sublinhado."
      : null,
    kind === "priority" && (form.weight < 1 || form.weight > 100)
      ? "O peso deve estar entre 1 e 100."
      : null,
    kind === "status" && form.sortOrder < 0 ? "A ordem não pode ser negativa." : null,
  ].filter(Boolean) as string[];
  const launch = (nextKind: ConfigKind, item?: ConfigItem) => {
    setSubmitted(false);
    setKind(nextKind);
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name,
            code: item.code,
            description: item.description ?? "",
            color: item.color,
            icon: item.icon ?? "CircleDot",
            status: item.status,
            weight: item.weight ?? 1,
            sortOrder: item.sortOrder ?? 0,
            isTerminal: item.isTerminal ?? false,
          }
        : {
            ...initialForm,
            icon:
              nextKind === "category"
                ? "Layers3"
                : nextKind === "priority"
                  ? "Signal"
                  : "CircleDot",
          }
    );
    setOpen(true);
  };
  const save = async () => {
    setSubmitted(true);
    if (validationErrors.length) return toast.error("Revise os campos obrigatórios.");
    try {
      if (kind === "category") {
        const payload = {
          name: form.name,
          code: form.code,
          description: form.description || null,
          color: form.color,
          icon: form.icon,
          status: form.status,
        };
        editing
          ? await updateCategory.mutateAsync({ id: editing.id, data: payload })
          : await createCategory.mutateAsync(payload);
      } else if (kind === "status") {
        const payload = {
          name: form.name,
          code: form.code,
          description: form.description || null,
          color: form.color,
          icon: form.icon,
          status: form.status,
          sortOrder: form.sortOrder,
          isTerminal: form.isTerminal,
        };
        editing
          ? await updateStatus.mutateAsync({ id: editing.id, data: payload })
          : await createStatus.mutateAsync(payload);
      } else {
        const payload = {
          name: form.name,
          code: form.code,
          color: form.color,
          status: form.status,
          weight: form.weight,
        };
        editing
          ? await updatePriority.mutateAsync({ id: editing.id, data: payload })
          : await createPriority.mutateAsync(payload);
      }
      await utils.admin.taxonomies.all.invalidate();
      setOpen(false);
      toast.success(editing ? "Configuração atualizada." : "Configuração criada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  const archive = async (targetKind: ConfigKind, item: ConfigItem) => {
    if (targetKind === "category")
      await updateCategory.mutateAsync({ id: item.id, data: { status: "inactive" } });
    else if (targetKind === "status")
      await updateStatus.mutateAsync({ id: item.id, data: { status: "inactive" } });
    else await updatePriority.mutateAsync({ id: item.id, data: { status: "inactive" } });
    await utils.admin.taxonomies.all.invalidate();
    toast.success("Configuração arquivada com histórico preservado.");
  };
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Projetos"
          title="Configuração do modelo"
          description="Categorias, etapas e níveis de prioridade utilizados por todo o portfólio."
          icon={Workflow}
        />
        <Tabs defaultValue="categories" className="mt-8">
          <TabsList className="h-auto rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
            <TabsTrigger value="categories" className="rounded-lg px-4">
              Categorias
            </TabsTrigger>
            <TabsTrigger value="statuses" className="rounded-lg px-4">
              Status
            </TabsTrigger>
            <TabsTrigger value="priorities" className="rounded-lg px-4">
              Prioridades
            </TabsTrigger>
          </TabsList>
          <TabsContent value="categories">
            <ConfigSection
              title="Categorias"
              description="Finalidade ou natureza estratégica do projeto."
              icon={Layers3}
              items={(query.data?.categories ?? []) as ConfigItem[]}
              onAdd={() => launch("category")}
              onEdit={item => launch("category", item)}
              onArchive={item => archive("category", item)}
            />
          </TabsContent>
          <TabsContent value="statuses">
            <ConfigSection
              title="Status"
              description="Etapas que representam o ciclo de vida dos projetos."
              icon={CircleDot}
              items={(query.data?.statuses ?? []) as ConfigItem[]}
              onAdd={() => launch("status")}
              onEdit={item => launch("status", item)}
              onArchive={item => archive("status", item)}
            />
          </TabsContent>
          <TabsContent value="priorities">
            <ConfigSection
              title="Prioridades"
              description="Criticidade e precedência na alocação de atenção e recursos."
              icon={Signal}
              items={(query.data?.priorities ?? []) as ConfigItem[]}
              onAdd={() => launch("priority")}
              onEdit={item => launch("priority", item)}
              onArchive={item => archive("priority", item)}
            />
          </TabsContent>
        </Tabs>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className={
              "max-h-[90vh] overflow-y-auto border-white/10 " +
              "bg-[var(--surface-2)]/96 backdrop-blur-2xl"
            }
          >
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar" : "Nova"} {labels[kind]}
              </DialogTitle>
              <DialogDescription>
                A alteração será refletida em todos os projetos que usam esta configuração.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  aria-invalid={submitted && form.name.trim().length < 2}
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Código</Label>
                <Input
                  aria-invalid={submitted && !/^[a-z0-9_]{2,60}$/.test(form.code)}
                  disabled={Boolean(editing)}
                  value={form.code}
                  onChange={event =>
                    setForm({
                      ...form,
                      code: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                />
              </div>
              {kind !== "priority" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={form.description}
                    onChange={event => setForm({ ...form, description: event.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={event => setForm({ ...form, color: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={value =>
                    setForm({ ...form, status: value as ConfigForm["status"] })
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
              {kind === "priority" && (
                <div className="space-y-2">
                  <Label>Peso</Label>
                  <Input
                    aria-invalid={submitted && (form.weight < 1 || form.weight > 100)}
                    type="number"
                    min={1}
                    max={100}
                    value={form.weight}
                    onChange={event => setForm({ ...form, weight: Number(event.target.value) })}
                  />
                </div>
              )}
              {kind === "status" && (
                <>
                  <div className="space-y-2">
                    <Label>Ordem</Label>
                    <Input
                      aria-invalid={submitted && form.sortOrder < 0}
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={event =>
                        setForm({ ...form, sortOrder: Number(event.target.value) })
                      }
                    />
                  </div>
                  <div
                    className={
                      "flex items-center justify-between rounded-xl border " +
                      "border-white/[0.07] bg-white/[0.025] p-3 sm:col-span-2"
                    }
                  >
                    <div>
                      <p className="text-sm font-medium">Etapa terminal</p>
                      <p className="mt-1 text-[11px] text-content-tertiary">
                        Impede o projeto de ser contado como ativo.
                      </p>
                    </div>
                    <Switch
                      checked={form.isTerminal}
                      onCheckedChange={value => setForm({ ...form, isTerminal: value })}
                    />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                {submitted && <FormValidationSummary errors={validationErrors} />}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={save}
                className={
                  "bg-[var(--brand-accent)] font-bold " +
                  "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
                }
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
function ConfigSection({
  title,
  description,
  icon: Icon,
  items,
  onAdd,
  onEdit,
  onArchive,
}: {
  title: string;
  description: string;
  icon: typeof Layers3;
  items: ConfigItem[];
  onAdd: () => void;
  onEdit: (item: ConfigItem) => void;
  onArchive: (item: ConfigItem) => Promise<void>;
}) {
  return (
    <section className="nexus-surface mt-4 rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={
              "flex h-10 w-10 items-center justify-center rounded-xl border " +
              "border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
            }
          >
            <Icon className="h-4 w-4 text-[var(--brand-violet)]" />
          </span>
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            <p className="mt-1 text-xs text-content-tertiary">{description}</p>
          </div>
        </div>
        <Button onClick={onAdd} variant="outline" className="border-white/10 bg-white/[0.03]">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>
      {items.length ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.022] p-4"
            >
              <div className="flex items-start justify-between">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 18px ${item.color}55` }}
                />
                <StatusBadge status={item.status} />
              </div>
              <h3 className="mt-4 font-semibold text-content-primary">{item.name}</h3>
              <p className="mt-1 text-[11px] uppercase tracking-[.13em] text-content-tertiary">
                {item.code}
              </p>
              <div
                className={
                  "mt-4 flex flex-wrap items-center " +
                  "justify-between gap-2 border-t border-white/[0.05] pt-3"
                }
              >
                <span className="text-[11px] text-content-tertiary">
                  {item.weight
                    ? `Peso ${item.weight}`
                    : item.sortOrder !== undefined
                      ? `Ordem ${item.sortOrder}`
                      : "Classificação"}
                </span>
                <div className="flex">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Editar
                  </Button>
                  {item.status === "active" && (
                    <ArchiveButton name={item.name} onConfirm={() => onArchive(item)} />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title={`Nenhum item em ${title.toLowerCase()}`}
            description="Adicione a primeira configuração para disponibilizá-la nos projetos."
          />
        </div>
      )}
    </section>
  );
}
