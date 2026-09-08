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
import { trpc } from "@/lib/trpc";
import { Activity, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
type Form = {
  name: string;
  unit: string;
  targetValue: string;
  currentValue: string;
  periodLabel: string;
  source: string;
  direction: "higher" | "lower" | "target";
  status: "on_track" | "attention" | "critical" | "unassessed";
};
const initialForm: Form = {
  name: "",
  unit: "",
  targetValue: "",
  currentValue: "",
  periodLabel: "",
  source: "",
  direction: "target",
  status: "unassessed",
};
export function WorkspaceIndicators({ projectId }: { projectId: number }) {
  const query = trpc.indicators.listByProject.useQuery({ projectId });
  const create = trpc.indicators.create.useMutation();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(initialForm);
  const save = async () => {
    try {
      await create.mutateAsync({
        projectId,
        name: form.name,
        unit: form.unit || null,
        targetValue: form.targetValue || null,
        currentValue: form.currentValue || null,
        periodLabel: form.periodLabel || null,
        source: form.source || null,
        direction: form.direction,
        status: form.status,
        measuredAt: form.currentValue ? new Date() : null,
      });
      await utils.indicators.listByProject.invalidate({ projectId });
      setOpen(false);
      setForm(initialForm);
      toast.success("Indicador adicionado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  return (
    <Section
      title="Indicadores do projeto"
      description="Metas, realizações, fonte e período de referência."
      action={
        <Button
          onClick={() => setOpen(true)}
          className={
            "bg-[var(--brand-accent)] font-bold " +
            "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo indicador
        </Button>
      }
    >
      {query.data?.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map(item => (
            <article
              key={item.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={
                    "flex h-9 w-9 items-center justify-center rounded-xl border " +
                    "border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
                  }
                >
                  <Activity className="h-4 w-4 text-[var(--brand-violet)]" />
                </span>
                <StatusBadge status={item.status} />
              </div>
              <h3 className="mt-5 font-semibold text-content-primary">{item.name}</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Value
                  label="Atual"
                  value={
                    item.currentValue
                      ? `${item.currentValue}${item.unit ? ` ${item.unit}` : ""}`
                      : "Não informado"
                  }
                />
                <Value
                  label="Meta"
                  value={
                    item.targetValue
                      ? `${item.targetValue}${item.unit ? ` ${item.unit}` : ""}`
                      : "Não informada"
                  }
                />
              </div>
              <div className="mt-4 border-t border-white/[0.05] pt-3 text-[11px] text-content-tertiary">
                {item.periodLabel || "Período não informado"} ·{" "}
                {item.source || "Fonte não informada"}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum indicador cadastrado"
          description={
            "Adicione somente indicadores com fonte, " +
            "per\u00EDodo e crit\u00E9rio de c\u00E1lculo definidos."
          }
        />
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle>Novo indicador</DialogTitle>
            <DialogDescription>
              Não preencha valores sem uma fonte oficial e um período definido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Nome" wide>
              <Input
                value={form.name}
                onChange={event => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Valor atual">
              <Input
                value={form.currentValue}
                onChange={event => setForm({ ...form, currentValue: event.target.value })}
                placeholder="Opcional"
              />
            </Field>
            <Field label="Meta">
              <Input
                value={form.targetValue}
                onChange={event => setForm({ ...form, targetValue: event.target.value })}
                placeholder="Opcional"
              />
            </Field>
            <Field label="Unidade">
              <Input
                value={form.unit}
                onChange={event => setForm({ ...form, unit: event.target.value })}
                placeholder="%, R$, alunos..."
              />
            </Field>
            <Field label="Período">
              <Input
                value={form.periodLabel}
                onChange={event => setForm({ ...form, periodLabel: event.target.value })}
                placeholder="Ex.: Agosto/2026"
              />
            </Field>
            <Field label="Fonte" wide>
              <Input
                value={form.source}
                onChange={event => setForm({ ...form, source: event.target.value })}
                placeholder="Sistema ou documento de origem"
              />
            </Field>
            <Field label="Direção">
              <Select
                value={form.direction}
                onValueChange={value => setForm({ ...form, direction: value as Form["direction"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="higher">Maior é melhor</SelectItem>
                  <SelectItem value="lower">Menor é melhor</SelectItem>
                  <SelectItem value="target">Alvo específico</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select
                value={form.status}
                onValueChange={value => setForm({ ...form, status: value as Form["status"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassessed">Não avaliado</SelectItem>
                  <SelectItem value="on_track">No caminho</SelectItem>
                  <SelectItem value="attention">Atenção</SelectItem>
                  <SelectItem value="critical">Crítico</SelectItem>
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
              disabled={!form.name || create.isPending}
              className={
                "bg-[var(--brand-accent)] font-bold " +
                "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              }
            >
              Salvar indicador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/10 p-3">
      <p className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">{label}</p>
      <p className="nexus-number mt-1 truncate text-sm font-bold text-content-secondary">{value}</p>
    </div>
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
export function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="nexus-surface rounded-3xl p-5 sm:p-6">
      <div
        className={
          "flex flex-col gap-4 border-b border-white/[0.055] " +
          "pb-5 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-1 text-xs text-content-tertiary">{description}</p>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
