import { EmptyState } from "@/components/nexus/EmptyState";
import { StatusBadge } from "@/components/nexus/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  ArrowRight,
  CheckSquare2,
  GitBranch,
  History,
  MessageSquareText,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Section } from "./WorkspaceIndicators";
import { DocumentCenter } from "@/components/nexus/DocumentCenter";
type Person = {
  value: string;
  label: string;
};
type ActionStatus = "todo" | "in_progress" | "blocked" | "done" | "cancelled";
export function WorkspaceActions({ projectId, people }: { projectId: number; people: Person[] }) {
  const query = trpc.actions.listByProject.useQuery({ projectId });
  const utils = trpc.useUtils();
  const create = trpc.actions.create.useMutation();
  const addChecklist = trpc.actions.addChecklistItem.useMutation();
  const toggleChecklist = trpc.actions.toggleChecklistItem.useMutation();
  const addComment = trpc.actions.addComment.useMutation();
  const addDependency = trpc.actions.addDependency.useMutation();
  const removeDependency = trpc.actions.removeDependency.useMutation();
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [checklistText, setChecklistText] = useState("");
  const [comment, setComment] = useState("");
  const [dependencyId, setDependencyId] = useState("none");
  const [form, setForm] = useState({
    title: "",
    description: "",
    ownerId: "none",
    dueDate: "",
    status: "todo" as ActionStatus,
    progress: 0,
  });
  const detail = trpc.actions.byId.useQuery({ id: detailId ?? 1 }, { enabled: detailId !== null });
  const refresh = async () => {
    await utils.actions.listByProject.invalidate({ projectId });
    if (detailId) await utils.actions.byId.invalidate({ id: detailId });
  };
  const save = async () => {
    try {
      await create.mutateAsync({
        projectId,
        title: form.title,
        description: form.description || null,
        ownerId: form.ownerId === "none" ? null : Number(form.ownerId),
        dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00.000Z`) : null,
        status: form.status,
        progress: form.progress,
      });
      await refresh();
      setOpen(false);
      setForm({
        title: "",
        description: "",
        ownerId: "none",
        dueDate: "",
        status: "todo",
        progress: 0,
      });
      toast.success("Ação criada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  const createChecklist = async () => {
    if (!detailId || !checklistText.trim()) return;
    await addChecklist.mutateAsync({ actionId: detailId, label: checklistText });
    setChecklistText("");
    await refresh();
  };
  const sendComment = async () => {
    if (!detailId || !comment.trim()) return;
    await addComment.mutateAsync({ actionId: detailId, projectId, content: comment });
    setComment("");
    await refresh();
  };
  const linkDependency = async () => {
    if (!detailId || dependencyId === "none") return;
    try {
      await addDependency.mutateAsync({
        actionId: detailId,
        dependsOnActionId: Number(dependencyId),
      });
      setDependencyId("none");
      await refresh();
      toast.success("Dependência adicionada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível adicionar a dependência."
      );
    }
  };
  const unlinkDependency = async (dependsOnActionId: number) => {
    if (!detailId) return;
    await removeDependency.mutateAsync({ actionId: detailId, dependsOnActionId });
    await refresh();
    toast.success("Dependência removida.");
  };
  return (
    <Section
      title="Planos de ação"
      description="Responsáveis, prazos, progresso e evidências de execução."
      action={
        <Button
          onClick={() => setOpen(true)}
          className={
            "bg-[var(--brand-accent)] font-bold " +
            "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova ação
        </Button>
      }
    >
      {query.data?.length ? (
        <div className="space-y-3">
          {query.data.map(action => (
            <button
              key={action.id}
              onClick={() => setDetailId(action.id)}
              className={
                "group grid w-full grid-cols-[1fr_auto] gap-4 rounded-2xl border " +
                "border-white/[0.06] bg-white/[0.02] p-4 " +
                "text-left sm:grid-cols-[1fr_130px_110px_auto]"
              }
            >
              <div>
                <p className="font-semibold text-content-primary">{action.title}</p>
                <p className="mt-1 text-[11px] text-content-tertiary">
                  {action.ownerName || "Responsável não definido"}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">
                  Prazo
                </p>
                <p className="mt-1 text-xs text-content-tertiary">
                  {action.dueDate
                    ? new Date(action.dueDate).toLocaleDateString("pt-BR")
                    : "Não informado"}
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">
                  Avanço
                </p>
                <p className="nexus-number mt-1 text-xs font-semibold text-content-secondary">
                  {action.progress}%
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={action.status} />
                <ArrowRight className="h-4 w-4 text-content-tertiary group-hover:text-[var(--brand-accent)]" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma ação cadastrada"
          description="Crie ações para transformar decisões e riscos em execução acompanhável."
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Nova ação</DialogTitle>
            <DialogDescription>
              Defina um responsável, prazo e critério claro de conclusão.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Título" wide>
              <Input
                value={form.title}
                onChange={event => setForm({ ...form, title: event.target.value })}
              />
            </Field>
            <Field label="Descrição" wide>
              <Textarea
                value={form.description}
                onChange={event => setForm({ ...form, description: event.target.value })}
              />
            </Field>
            <Field label="Responsável">
              <Select
                value={form.ownerId}
                onValueChange={value => setForm({ ...form, ownerId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não definido</SelectItem>
                  {people.map(person => (
                    <SelectItem key={person.value} value={person.value}>
                      {person.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Prazo">
              <Input
                type="date"
                value={form.dueDate}
                onChange={event => setForm({ ...form, dueDate: event.target.value })}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={value => setForm({ ...form, status: value as ActionStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A fazer</SelectItem>
                  <SelectItem value="in_progress">Em andamento</SelectItem>
                  <SelectItem value="blocked">Bloqueada</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Progresso">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={event => setForm({ ...form, progress: Number(event.target.value) })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={!form.title || create.isPending}
              className={
                "bg-[var(--brand-accent)] font-bold " +
                "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              }
            >
              Salvar ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={detailId !== null} onOpenChange={value => !value && setDetailId(null)}>
        <DialogContent
          className={
            "max-h-[92vh] overflow-y-auto border-white/10 " +
            "bg-[var(--surface-2)]/96 backdrop-blur-2xl sm:max-w-3xl"
          }
        >
          <DialogHeader>
            <DialogTitle>{detail.data?.action.title || "Detalhes da ação"}</DialogTitle>
            <DialogDescription>
              {detail.data?.action.description || "Sem descrição cadastrada."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-2">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <CheckSquare2 className="h-4 w-4 text-[var(--brand-violet)]" />
                <p className="text-xs font-bold uppercase tracking-[.12em] text-content-tertiary">
                  Checklist
                </p>
              </div>
              <div className="space-y-2">
                {detail.data?.checklist.map(item => (
                  <label
                    key={item.id}
                    className={
                      "flex items-center gap-3 rounded-xl border " +
                      "border-white/[0.055] bg-white/[0.02] p-3 text-sm text-content-secondary"
                    }
                  >
                    <Checkbox
                      checked={item.isCompleted}
                      onCheckedChange={value =>
                        toggleChecklist
                          .mutateAsync({ id: item.id, completed: Boolean(value) })
                          .then(refresh)
                      }
                    />
                    <span className={item.isCompleted ? "line-through opacity-50" : ""}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Input
                  value={checklistText}
                  onChange={event => setChecklistText(event.target.value)}
                  placeholder="Novo item de checklist"
                />
                <Button variant="outline" onClick={createChecklist}>
                  Adicionar
                </Button>
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-[var(--brand-violet)]" />
                <p className="text-xs font-bold uppercase tracking-[.12em] text-content-tertiary">
                  Dependências
                </p>
              </div>
              <div className="space-y-2">
                {detail.data?.dependencies.map(item => (
                  <div
                    key={item.dependsOnActionId}
                    className={
                      "flex items-center justify-between rounded-xl " +
                      "border border-white/[0.055] bg-white/[0.02] p-3"
                    }
                  >
                    <div>
                      <p className="text-xs text-content-secondary">{item.title}</p>
                      <div className="mt-1">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => unlinkDependency(item.dependsOnActionId)}
                      aria-label="Remover dependência"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Select value={dependencyId} onValueChange={setDependencyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione outra ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {query.data
                      ?.filter(
                        item =>
                          item.id !== detailId &&
                          !detail.data?.dependencies.some(
                            dependency => dependency.dependsOnActionId === item.id
                          )
                      )
                      .map(item => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={linkDependency}>
                  Vincular
                </Button>
              </div>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <MessageSquareText className="h-4 w-4 text-[var(--brand-violet)]" />
                <p className="text-xs font-bold uppercase tracking-[.12em] text-content-tertiary">
                  Comentários
                </p>
              </div>
              <div className="space-y-2">
                {detail.data?.comments.map(item => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-white/[0.055] bg-white/[0.02] p-3"
                  >
                    <p className="text-xs text-content-secondary">{item.content}</p>
                    <p className="mt-2 text-[11px] text-content-tertiary">
                      {item.authorName || "Usuário"} ·{" "}
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
              <Textarea
                className="mt-3"
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Registrar comentário ou atualização..."
              />
              <Button className="mt-2" variant="outline" onClick={sendComment}>
                Adicionar comentário
              </Button>
            </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <History className="h-4 w-4 text-[var(--brand-violet)]" />
                <p className="text-xs font-bold uppercase tracking-[.12em] text-content-tertiary">
                  Histórico da ação
                </p>
              </div>
              <div className="relative ml-2 border-l border-white/[0.08] pl-5">
                {detail.data?.history.map(event => (
                  <div key={event.id} className="relative pb-4 last:pb-0">
                    <span className="absolute -left-[23px] top-1 h-2 w-2 rounded-full bg-[var(--brand-violet)]" />
                    <p className="text-xs text-content-secondary">{event.summary}</p>
                    <p className="mt-1 text-[11px] text-content-tertiary">
                      {new Date(event.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {detailId && (
              <div className="border-t border-white/[0.06] pt-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-[.12em] text-content-tertiary">
                  Anexos da ação
                </p>
                <DocumentCenter fixedProjectId={projectId} fixedActionId={detailId} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
function Field({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-2 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
