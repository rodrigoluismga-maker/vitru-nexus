import DashboardLayout from "@/components/DashboardLayout";
import { PageHeader } from "@/components/nexus/PageHeader";
import { FormValidationSummary } from "@/components/nexus/FormValidationSummary";
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
import { KeyRound, Pencil, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
type Profile = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  status: "active" | "inactive";
  isSystem: boolean;
};
type RoleForm = {
  name: string;
  code: string;
  description: string;
  status: "active" | "inactive";
  permissionIds: number[];
};
const initialForm: RoleForm = {
  name: "",
  code: "",
  description: "",
  status: "active",
  permissionIds: [],
};
export default function Roles() {
  const roles = trpc.admin.roles.list.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.admin.roles.create.useMutation();
  const update = trpc.admin.roles.update.useMutation();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<RoleForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const groups = useMemo(() => {
    const map = new Map<
      string,
      Array<{
        id: number;
        code: string;
        name: string;
        module: string;
      }>
    >();
    roles.data?.permissions.forEach(permission =>
      map.set(permission.module, [...(map.get(permission.module) ?? []), permission])
    );
    return Array.from(map.entries());
  }, [roles.data]);
  const assignedFor = (id: number) =>
    roles.data?.assignments
      .filter(item => item.roleProfileId === id)
      .map(item => item.permissionId) ?? [];
  const validationErrors = [
    form.name.trim().length < 2 ? "Informe o nome do perfil." : null,
    !/^[a-z0-9_]{2,60}$/.test(form.code)
      ? "Use um código com letras minúsculas, números ou sublinhado."
      : null,
  ].filter(Boolean) as string[];
  const launch = (profile?: Profile) => {
    setSubmitted(false);
    setEditing(profile ?? null);
    setForm(
      profile
        ? {
            name: profile.name,
            code: profile.code,
            description: profile.description ?? "",
            status: profile.status,
            permissionIds: assignedFor(profile.id),
          }
        : initialForm
    );
    setOpen(true);
  };
  const toggle = (id: number) =>
    setForm(current => ({
      ...current,
      permissionIds: current.permissionIds.includes(id)
        ? current.permissionIds.filter(item => item !== id)
        : [...current.permissionIds, id],
    }));
  const save = async () => {
    setSubmitted(true);
    if (validationErrors.length) return toast.error("Revise os campos obrigatórios.");
    try {
      if (editing)
        await update.mutateAsync({
          id: editing.id,
          name: form.name,
          description: form.description || null,
          status: form.status,
          permissionIds: form.permissionIds,
        });
      else await create.mutateAsync({ ...form, description: form.description || null });
      await utils.admin.roles.list.invalidate();
      setOpen(false);
      toast.success(editing ? "Perfil atualizado." : "Perfil criado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };
  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Acessos"
          title="Perfis e permissões"
          description={
            "Pap\u00E9is claros reduzem risco operacional e " +
            "garantem que cada pessoa acesse somente o necess\u00E1rio."
          }
          icon={ShieldCheck}
          actions={
            <Button
              onClick={() => launch()}
              className={
                "bg-[var(--brand-accent)] font-bold " +
                "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo perfil
            </Button>
          }
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.data?.profiles.map(profile => (
            <article key={profile.id} className="nexus-surface nexus-card-hover rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <span
                  className={
                    "flex h-10 w-10 items-center justify-center rounded-xl border " +
                    "border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
                  }
                >
                  <KeyRound className="h-4 w-4 text-[var(--brand-violet)]" />
                </span>
                <StatusBadge status={profile.status} />
              </div>
              <h2 className="mt-5 text-base font-bold">{profile.name}</h2>
              <p className="mt-2 min-h-10 text-xs leading-5 text-content-tertiary">
                {profile.description || "Sem descrição"}
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.055] pt-4">
                <span className="text-[11px] text-content-tertiary">
                  {assignedFor(profile.id).length} permissões
                </span>
                <Button variant="ghost" size="sm" onClick={() => launch(profile as Profile)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Editar
                </Button>
              </div>
            </article>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className={
              "max-h-[92vh] overflow-y-auto border-white/10 " +
              "bg-[var(--surface-2)]/96 backdrop-blur-2xl sm:max-w-3xl"
            }
          >
            <DialogHeader>
              <DialogTitle>{editing ? "Editar perfil" : "Novo perfil"}</DialogTitle>
              <DialogDescription>
                Configure o papel e selecione as permissões concedidas.
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
              <div className="space-y-2 sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={event => setForm({ ...form, description: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={value => setForm({ ...form, status: value as RoleForm["status"] })}
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
              <div className="sm:col-span-2">
                {submitted && <FormValidationSummary errors={validationErrors} />}
              </div>
            </div>
            <div className="mt-3 border-t border-white/[0.07] pt-5">
              <p className="text-xs font-bold uppercase tracking-[.13em] text-content-tertiary">
                Matriz de permissões
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {groups.map(([module, permissions]) => (
                  <div
                    key={module}
                    className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--brand-violet)]">
                      {module}
                    </p>
                    <div className="mt-3 space-y-3">
                      {permissions?.map(permission => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-3 text-xs text-content-tertiary"
                        >
                          <Checkbox
                            checked={form.permissionIds.includes(permission.id)}
                            onCheckedChange={() => toggle(permission.id)}
                          />
                          <span>
                            <span className="block text-content-secondary">{permission.name}</span>
                            <span className="mt-0.5 block text-[11px] text-content-tertiary">
                              {permission.code}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={save}
                disabled={create.isPending || update.isPending}
                className={
                  "bg-[var(--brand-accent)] font-bold " +
                  "text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
                }
              >
                Salvar perfil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
