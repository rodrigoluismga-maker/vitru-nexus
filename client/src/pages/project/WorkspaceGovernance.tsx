import { EmptyState } from "@/components/nexus/EmptyState";
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
import { Archive, CalendarClock, Flag, Plus, Scale, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Section } from "./WorkspaceIndicators";
import { DocumentCenter } from "@/components/nexus/DocumentCenter";
type GovernanceData = {
  risks: Array<{
    id: number;
    title: string;
    description: string | null;
    probability: number;
    impact: number;
    status: string;
  }>;
  milestones: Array<{
    id: number;
    title: string;
    dueDate: Date | null;
    status: string;
  }>;
  deliveries: Array<{
    id: number;
    title: string;
    dueDate: Date | null;
    status: string;
  }>;
  decisions: Array<{
    id: number;
    title: string;
    context: string | null;
    dueDate: Date | null;
    status: string;
  }>;
  history: Array<{
    id: number;
    summary: string;
    action: string;
    entityType: string;
    createdAt: Date;
    actorUserId: number | null;
  }>;
};
type Person = {
  value: string;
  label: string;
};
export function RiskSection({ projectId, data }: { projectId: number; data?: GovernanceData }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    probability: 1,
    impact: 1,
    mitigation: "",
  });
  const create = trpc.governance.createRisk.useMutation();
  const update = trpc.governance.updateLifecycle.useMutation();
  const archive = trpc.governance.archiveLifecycle.useMutation();
  const utils = trpc.useUtils();
  const updateStatus = async (
    id: number,
    status: "open" | "mitigating" | "accepted" | "closed"
  ) => {
    await update.mutateAsync({ entity: "risk", id, projectId, data: { status } });
    await utils.governance.overview.invalidate({ projectId });
    toast.success("Status do risco atualizado.");
  };
  const archiveRisk = async (id: number) => {
    await archive.mutateAsync({ entity: "risk", id, projectId });
    await utils.governance.overview.invalidate({ projectId });
    toast.success("Risco arquivado.");
  };
  const save = async () => {
    try {
      await create.mutateAsync({
        projectId,
        ...form,
        description: form.description || null,
        mitigation: form.mitigation || null,
        status: "open",
      });
      await utils.governance.overview.invalidate({ projectId });
      setOpen(false);
      toast.success("Risco registrado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  return (
    <Section
      title="Riscos do projeto"
      description="Probabilidade, impacto e plano de mitigação."
      action={
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          className="border-white/10 bg-white/[0.03]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Registrar risco
        </Button>
      }
    >
      {data?.risks.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.risks.map(risk => (
            <article
              key={risk.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between">
                <ShieldAlert
                  className={`h-5 w-5 ${risk.impact >= 4 ? "text-red-300" : "text-[var(--brand-accent)]"}`}
                />
                <StatusBadge status={risk.status} />
              </div>
              <h3 className="mt-4 font-semibold text-content-primary">{risk.title}</h3>
              <p className="mt-2 text-xs leading-5 text-content-tertiary">
                {risk.description || "Sem descrição."}
              </p>
              <div
                className={
                  "mt-4 flex gap-4 border-t border-white/[0.05] " +
                  "pt-3 text-[11px] text-content-tertiary"
                }
              >
                <span>Probabilidade: {risk.probability}/5</span>
                <span>Impacto: {risk.impact}/5</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Select
                  value={risk.status}
                  onValueChange={value => void updateStatus(risk.id, value as any)}
                >
                  <SelectTrigger className="h-8 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="mitigating">Em mitigação</SelectItem>
                    <SelectItem value="accepted">Aceito</SelectItem>
                    <SelectItem value="closed">Fechado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void archiveRisk(risk.id)}
                  aria-label="Arquivar risco"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum risco registrado"
          description={
            "A aus\u00EAncia de registros n\u00E3o significa aus\u00EAncia " +
            "de risco. Fa\u00E7a a primeira avalia\u00E7\u00E3o do projeto."
          }
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Novo risco</DialogTitle>
            <DialogDescription>Registre causa, consequência e resposta prevista.</DialogDescription>
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
            <Field label="Probabilidade">
              <Input
                type="number"
                min={1}
                max={5}
                value={form.probability}
                onChange={event => setForm({ ...form, probability: Number(event.target.value) })}
              />
            </Field>
            <Field label="Impacto">
              <Input
                type="number"
                min={1}
                max={5}
                value={form.impact}
                onChange={event => setForm({ ...form, impact: Number(event.target.value) })}
              />
            </Field>
            <Field label="Mitigação" wide>
              <Textarea
                value={form.mitigation}
                onChange={event => setForm({ ...form, mitigation: event.target.value })}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={!form.title}
              className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)]"
            >
              Salvar risco
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
export function ScheduleSection({
  projectId,
  data,
  people,
}: {
  projectId: number;
  data?: GovernanceData;
  people: Person[];
}) {
  const [kind, setKind] = useState<"milestone" | "delivery" | null>(null);
  const [form, setForm] = useState({ title: "", description: "", dueDate: "", ownerId: "none" });
  const milestone = trpc.governance.createMilestone.useMutation();
  const delivery = trpc.governance.createDelivery.useMutation();
  const update = trpc.governance.updateLifecycle.useMutation();
  const archive = trpc.governance.archiveLifecycle.useMutation();
  const utils = trpc.useUtils();
  const changeScheduleStatus = async (item: { id: number; kind: string }, status: string) => {
    await update.mutateAsync({
      entity: item.kind === "Marco" ? "milestone" : "delivery",
      id: item.id,
      projectId,
      data: { status },
    } as any);
    await utils.governance.overview.invalidate({ projectId });
    toast.success("Status atualizado.");
  };
  const archiveScheduleItem = async (item: { id: number; kind: string }) => {
    await archive.mutateAsync({
      entity: item.kind === "Marco" ? "milestone" : "delivery",
      id: item.id,
      projectId,
    });
    await utils.governance.overview.invalidate({ projectId });
    toast.success("Item arquivado.");
  };
  const save = async () => {
    if (!kind) return;
    const common = {
      projectId,
      title: form.title,
      description: form.description || null,
      dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00.000Z`) : null,
      ownerId: form.ownerId === "none" ? null : Number(form.ownerId),
    };
    try {
      if (kind === "milestone") await milestone.mutateAsync({ ...common, status: "planned" });
      else await delivery.mutateAsync({ ...common, status: "planned" });
      await utils.governance.overview.invalidate({ projectId });
      setKind(null);
      toast.success(kind === "milestone" ? "Marco criado." : "Entrega criada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  const rows = [
    ...(data?.milestones.map(item => ({ ...item, kind: "Marco" })) ?? []),
    ...(data?.deliveries.map(item => ({ ...item, kind: "Entrega" })) ?? []),
  ].sort((a, b) => (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity));
  return (
    <Section
      title="Cronograma"
      description="Marcos e entregas organizados por prazo."
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setKind("milestone")}>
            <Flag className="mr-2 h-4 w-4" />
            Novo marco
          </Button>
          <Button
            onClick={() => setKind("delivery")}
            className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova entrega
          </Button>
        </div>
      }
    >
      {rows.length ? (
        <div className="relative ml-2 border-l border-white/[0.08] pl-6">
          {rows.map(item => (
            <div key={`${item.kind}-${item.id}`} className="relative pb-6 last:pb-0">
              <span
                className={
                  "absolute -left-[28px] top-1 h-2.5 w-2.5 rounded-full " +
                  "border-2 border-[var(--surface-2)] bg-[var(--brand-violet)]"
                }
              />
              <div
                className={
                  "flex flex-col gap-2 rounded-2xl border border-white/[0.06] " +
                  "bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
                }
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[.13em] text-content-tertiary">
                    {item.kind}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-content-secondary">{item.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-content-tertiary">
                    {item.dueDate
                      ? new Date(item.dueDate).toLocaleDateString("pt-BR")
                      : "Sem prazo"}
                  </span>
                  <StatusBadge status={item.status} />
                  <Select
                    value={item.status}
                    onValueChange={value => void changeScheduleStatus(item, value)}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planejado</SelectItem>
                      <SelectItem value="in_progress">Em andamento</SelectItem>
                      <SelectItem value="delayed">Atrasado</SelectItem>
                      <SelectItem value={item.kind === "Marco" ? "done" : "delivered"}>
                        {item.kind === "Marco" ? "Concluído" : "Entregue"}
                      </SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => void archiveScheduleItem(item)}
                    aria-label={`Arquivar ${item.kind.toLowerCase()}`}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Cronograma vazio"
          description="Cadastre marcos e entregas quando as datas oficiais forem definidas."
        />
      )}
      <Dialog open={kind !== null} onOpenChange={value => !value && setKind(null)}>
        <DialogContent className="border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>{kind === "milestone" ? "Novo marco" : "Nova entrega"}</DialogTitle>
            <DialogDescription>Use datas confirmadas e responsáveis claros.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Título">
              <Input
                value={form.title}
                onChange={event => setForm({ ...form, title: event.target.value })}
              />
            </Field>
            <Field label="Descrição">
              <Textarea
                value={form.description}
                onChange={event => setForm({ ...form, description: event.target.value })}
              />
            </Field>
            <Field label="Prazo">
              <Input
                type="date"
                value={form.dueDate}
                onChange={event => setForm({ ...form, dueDate: event.target.value })}
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setKind(null)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={!form.title}
              className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)]"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
export function DecisionsSection({
  projectId,
  data,
  people,
}: {
  projectId: number;
  data?: GovernanceData;
  people: Person[];
}) {
  const [open, setOpen] = useState(false);
  const [documentsFor, setDocumentsFor] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [form, setForm] = useState({ title: "", context: "", dueDate: "", deciderId: "none" });
  const create = trpc.governance.createDecision.useMutation();
  const update = trpc.governance.updateLifecycle.useMutation();
  const archive = trpc.governance.archiveLifecycle.useMutation();
  const utils = trpc.useUtils();
  const changeDecisionStatus = async (
    id: number,
    status: "pending" | "approved" | "rejected" | "deferred"
  ) => {
    await update.mutateAsync({ entity: "decision", id, projectId, data: { status } });
    await utils.governance.overview.invalidate({ projectId });
    toast.success("Status da decisão atualizado.");
  };
  const archiveDecision = async (id: number) => {
    await archive.mutateAsync({ entity: "decision", id, projectId });
    await utils.governance.overview.invalidate({ projectId });
    toast.success("Decisão arquivada.");
  };
  const save = async () => {
    try {
      await create.mutateAsync({
        projectId,
        title: form.title,
        context: form.context || null,
        dueDate: form.dueDate ? new Date(`${form.dueDate}T12:00:00.000Z`) : null,
        deciderId: form.deciderId === "none" ? null : Number(form.deciderId),
        status: "pending",
      });
      await utils.governance.overview.invalidate({ projectId });
      setOpen(false);
      toast.success("Decisão registrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  return (
    <Section
      title="Decisões"
      description="Deliberações, responsáveis e prazos executivos."
      action={
        <Button
          onClick={() => setOpen(true)}
          className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova decisão
        </Button>
      }
    >
      {data?.decisions.length ? (
        <div className="space-y-3">
          {data.decisions.map(item => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-[var(--brand-violet)]" />
                    <h3 className="font-semibold text-content-primary">{item.title}</h3>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-content-tertiary">
                    {item.context || "Contexto não informado."}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
                <p className="text-[11px] text-content-tertiary">
                  Prazo:{" "}
                  {item.dueDate
                    ? new Date(item.dueDate).toLocaleDateString("pt-BR")
                    : "não informado"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDocumentsFor({ id: item.id, title: item.title })}
                >
                  Documentos
                </Button>
                <Select
                  value={item.status}
                  onValueChange={value => void changeDecisionStatus(item.id, value as any)}
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovada</SelectItem>
                    <SelectItem value="rejected">Rejeitada</SelectItem>
                    <SelectItem value="deferred">Adiada</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => void archiveDecision(item.id)}
                  aria-label="Arquivar decisão"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma decisão registrada"
          description="Decisões que exigem deliberação executiva aparecerão nesta seção."
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Nova decisão</DialogTitle>
            <DialogDescription>
              Registre a decisão necessária, o contexto e quem deve deliberar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Título">
              <Input
                value={form.title}
                onChange={event => setForm({ ...form, title: event.target.value })}
              />
            </Field>
            <Field label="Contexto">
              <Textarea
                value={form.context}
                onChange={event => setForm({ ...form, context: event.target.value })}
              />
            </Field>
            <Field label="Prazo">
              <Input
                type="date"
                value={form.dueDate}
                onChange={event => setForm({ ...form, dueDate: event.target.value })}
              />
            </Field>
            <Field label="Decisor">
              <Select
                value={form.deciderId}
                onValueChange={value => setForm({ ...form, deciderId: value })}
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={save}
              disabled={!form.title}
              className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)]"
            >
              Salvar decisão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={documentsFor !== null} onOpenChange={value => !value && setDocumentsFor(null)}>
        <DialogContent
          className={
            "max-h-[92vh] overflow-y-auto border-white/10 " +
            "bg-[var(--surface-2)]/96 backdrop-blur-2xl sm:max-w-3xl"
          }
        >
          <DialogHeader>
            <DialogTitle>Documentos da decisão</DialogTitle>
            <DialogDescription>{documentsFor?.title}</DialogDescription>
          </DialogHeader>
          {documentsFor && (
            <DocumentCenter fixedProjectId={projectId} fixedDecisionId={documentsFor.id} />
          )}
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
