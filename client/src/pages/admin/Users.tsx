import DashboardLayout from "@/components/DashboardLayout";
import { DataTableShell } from "@/components/nexus/DataTableShell";
import { FormValidationSummary } from "@/components/nexus/FormValidationSummary";
import { PageHeader } from "@/components/nexus/PageHeader";
import { StatusBadge } from "@/components/nexus/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  AlertTriangle,
  ArrowDownAZ,
  ArrowUpAZ,
  CheckCircle2,
  Clock3,
  History,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type UserItem = {
  id: number;
  name: string | null;
  email: string | null;
  jobTitle: string | null;
  status: "invited" | "active" | "inactive" | "blocked";
  lastSignedIn: Date | null;
  companyId: number | null;
  areaId: number | null;
  roleProfileId: number | null;
  role: "admin" | "user";
};

type InvitationItem = {
  id: number;
  userId: number;
  recipientEmail: string;
  senderEmail: string | null;
  status: "pending" | "accepted" | "failed" | "activated";
  attempt: number;
  requestedAt: Date;
  acceptedAt: Date | null;
  failedAt: Date | null;
  activatedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
};

type UserForm = {
  name: string;
  email: string;
  jobTitle: string;
  phone: string;
  companyId: string;
  areaId: string;
  roleProfileId: string;
  status: UserItem["status"];
};

const initialForm: UserForm = {
  name: "",
  email: "",
  jobTitle: "",
  phone: "",
  companyId: "none",
  areaId: "none",
  roleProfileId: "none",
  status: "invited",
};
const formatDate = (value: Date | string | null) =>
  value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function Users() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [historyUser, setHistoryUser] = useState<UserItem | null>(null);
  const [form, setForm] = useState<UserForm>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const utils = trpc.useUtils();
  const pageSize = 10;

  const users = trpc.admin.users.list.useQuery({ search, page, pageSize });
  const companies = trpc.admin.companies.list.useQuery({
    search: "",
    page: 1,
    pageSize: 100,
    status: "active",
  });
  const areas = trpc.admin.areas.list.useQuery({
    search: "",
    page: 1,
    pageSize: 100,
    status: "active",
  });
  const taxonomies = trpc.admin.taxonomies.all.useQuery();
  const configuration = trpc.admin.users.invitationConfiguration.useQuery();
  const items = useMemo(
    () =>
      [...((users.data?.items ?? []) as UserItem[])].sort((a, b) =>
        sortAsc
          ? (a.name ?? "").localeCompare(b.name ?? "", "pt-BR")
          : (b.name ?? "").localeCompare(a.name ?? "", "pt-BR")
      ),
    [users.data?.items, sortAsc]
  );
  const userIds = useMemo(() => items.map(item => item.id), [items]);
  const invitations = trpc.admin.users.invitationStatus.useQuery({ userIds });
  const history = trpc.admin.users.invitationHistory.useQuery(
    { id: historyUser?.id ?? 1 },
    { enabled: Boolean(historyUser) }
  );
  const invitationByUser = useMemo(
    () => new Map((invitations.data ?? []).map(item => [item.userId, item as InvitationItem])),
    [invitations.data]
  );

  const createUser = trpc.admin.users.create.useMutation();
  const updateUser = trpc.admin.users.update.useMutation();
  const resendInvitation = trpc.admin.users.resendInvitation.useMutation();
  const validationErrors = [
    form.name.trim().length < 2 ? "Informe o nome da pessoa." : null,
    !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? "Informe um e-mail válido." : null,
  ].filter(Boolean) as string[];

  const launch = (item?: UserItem) => {
    setSubmitted(false);
    setEditing(item ?? null);
    setForm(
      item
        ? {
            name: item.name ?? "",
            email: item.email ?? "",
            jobTitle: item.jobTitle ?? "",
            phone: "",
            companyId: item.companyId ? String(item.companyId) : "none",
            areaId: item.areaId ? String(item.areaId) : "none",
            roleProfileId: item.roleProfileId ? String(item.roleProfileId) : "none",
            status: item.status,
          }
        : initialForm
    );
    setOpen(true);
  };

  const nullableId = (value: string) => (value === "none" ? null : Number(value));

  const save = async () => {
    setSubmitted(true);
    if (validationErrors.length) return toast.error("Revise os campos obrigatórios.");
    try {
      const relations = {
        jobTitle: form.jobTitle || null,
        phone: form.phone || null,
        companyId: nullableId(form.companyId),
        areaId: nullableId(form.areaId),
        roleProfileId: nullableId(form.roleProfileId),
      };
      if (editing) {
        await updateUser.mutateAsync({
          id: editing.id,
          data: { ...relations, status: form.status },
        });
        toast.success("Usuário atualizado.");
      } else {
        const result = await createUser.mutateAsync({
          name: form.name,
          email: form.email.trim(),
          ...relations,
        });
        if (result.invitation.status === "accepted")
          toast.success("Usuário incluído e convite enviado pelo Microsoft 365.");
        else
          toast.warning(
            "Usuário incluído. O convite ficou pendente e poderá ser reenviado após a configuração do Microsoft 365."
          );
      }
      await Promise.all([
        utils.admin.users.list.invalidate(),
        utils.admin.users.invitationStatus.invalidate(),
      ]);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  const resend = async (item: UserItem) => {
    try {
      const result = await resendInvitation.mutateAsync({ id: item.id });
      await Promise.all([
        utils.admin.users.invitationStatus.invalidate(),
        utils.admin.users.invitationHistory.invalidate(),
      ]);
      if (result.status === "accepted") toast.success(`Convite reenviado para ${item.email}.`);
      else
        toast.error("O reenvio foi registrado, mas o Microsoft 365 ainda não aceitou a mensagem.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível reenviar o convite.");
    }
  };

  const companyName = (id: number | null) =>
    companies.data?.items.find(item => item.id === id)?.shortName ?? "—";
  const areaName = (id: number | null) =>
    areas.data?.items.find(item => item.id === id)?.name ?? "—";
  const profileName = (id: number | null) =>
    taxonomies.data?.profiles.find(item => item.id === id)?.name ?? "Sem perfil";

  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow="Acessos"
          title="Usuários"
          description="Diretório central de pessoas, vínculos organizacionais e perfis de acesso ao NEXUS."
          icon={UsersRound}
          actions={
            <Button
              onClick={() => launch()}
              className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo usuário
            </Button>
          }
        />

        {configuration.data && !configuration.data.configured && (
          <div
            className={
              "mb-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100/80"
            }
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-accent)]" />
            <div>
              <p className="font-semibold text-amber-50">
                Envio de convites aguardando configuração do Microsoft 365
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-100/55">
                Novos usuários serão preservados como Convidados. Quando as credenciais e a caixa
                remetente estiverem configuradas, utilize Reenviar convite.
              </p>
            </div>
          </div>
        )}

        <DataTableShell
          search={search}
          onSearch={value => {
            setSearch(value);
            setPage(1);
          }}
          count={items.length}
          total={users.data?.total ?? 0}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          loading={users.isLoading}
          error={users.error?.message}
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
            title: "Nenhum usuário encontrado",
            description: "Inclua uma pessoa para conceder acesso à plataforma.",
          }}
        >
          <div className="space-y-3 p-3 md:hidden">
            {items.map(item => {
              const invitation = invitationByUser.get(item.id);
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 border border-white/10">
                      <AvatarFallback className="bg-[var(--brand-violet-deep)] text-xs font-bold text-[var(--brand-accent)]">
                        {item.name?.slice(0, 2).toUpperCase() ?? "US"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-content-primary">
                        {item.name || "Sem nome"}
                      </p>
                      <p className="mt-1 truncate text-[11px] text-content-tertiary">
                        {item.email || "E-mail não informado"}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-content-tertiary">Empresa</p>
                      <p className="mt-1 text-content-secondary">{companyName(item.companyId)}</p>
                    </div>
                    <div>
                      <p className="text-content-tertiary">Área</p>
                      <p className="mt-1 text-content-secondary">{areaName(item.areaId)}</p>
                    </div>
                    <div>
                      <p className="text-content-tertiary">Perfil</p>
                      <p className="mt-1 text-content-secondary">
                        {item.role === "admin" ? "Administrador" : profileName(item.roleProfileId)}
                      </p>
                    </div>
                    <div>
                      <p className="text-content-tertiary">Convite</p>
                      <div className="mt-1">
                        <InvitationStatus
                          invitation={invitation}
                          onHistory={() => setHistoryUser(item)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-3">
                    {item.status === "invited" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resend(item)}
                        disabled={resendInvitation.isPending}
                        className="flex-1"
                      >
                        <RefreshCw
                          className={`mr-2 h-3.5 w-3.5 ${resendInvitation.isPending ? "animate-spin" : ""}`}
                        />{" "}
                        Reenviar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => launch(item)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
          <table className="hidden w-full min-w-[1120px] text-sm md:table">
            <thead>
              <tr className="border-b border-white/[0.055] text-[11px] uppercase tracking-[.13em] text-content-tertiary">
                <th className="sticky left-0 z-10 bg-[var(--surface-2)] px-5 py-4 text-left">
                  Usuário
                </th>
                <th className="px-5 py-4 text-left">Cargo</th>
                <th className="px-5 py-4 text-left">Empresa</th>
                <th className="px-5 py-4 text-left">Área</th>
                <th className="px-5 py-4 text-center">Perfil</th>
                <th className="px-5 py-4 text-center">Convite</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="sticky right-0 z-10 bg-[var(--surface-2)] px-5 py-4 text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const invitation = invitationByUser.get(item.id);
                return (
                  <tr
                    key={item.id}
                    className="border-b border-white/[0.045] hover:bg-white/[0.018]"
                  >
                    <td className="sticky left-0 z-[1] bg-[var(--surface-2)] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-white/10">
                          <AvatarFallback className="bg-[var(--brand-violet-deep)] text-xs font-bold text-[var(--brand-accent)]">
                            {item.name?.slice(0, 2).toUpperCase() ?? "US"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-content-primary">
                            {item.name || "Sem nome"}
                          </p>
                          <p className="mt-1 text-[11px] text-content-tertiary">
                            {item.email || "E-mail não informado"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-content-tertiary">
                      {item.jobTitle || "—"}
                    </td>
                    <td className="px-5 py-4 text-xs text-content-tertiary">
                      {companyName(item.companyId)}
                    </td>
                    <td className="px-5 py-4 text-xs text-content-tertiary">
                      {areaName(item.areaId)}
                    </td>
                    <td className="px-5 py-4 text-center text-xs text-content-tertiary">
                      {item.role === "admin" ? "Administrador" : profileName(item.roleProfileId)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <InvitationStatus
                        invitation={invitation}
                        onHistory={() => setHistoryUser(item)}
                      />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="sticky right-0 z-[1] bg-[var(--surface-2)] px-5 py-4 text-right shadow-[-12px_0_24px_rgba(0,0,0,.2)]">
                      <div className="flex justify-end gap-1">
                        {item.status === "invited" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => resend(item)}
                            disabled={resendInvitation.isPending}
                          >
                            <RefreshCw
                              className={`mr-2 h-3.5 w-3.5 ${resendInvitation.isPending ? "animate-spin" : ""}`}
                            />
                            Reenviar
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => launch(item)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DataTableShell>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar usuário" : "Novo usuário"}</DialogTitle>
              <DialogDescription>
                {editing
                  ? "Atualize os vínculos e o perfil de acesso."
                  : "O usuário receberá um convite institucional e será vinculado no primeiro login com o mesmo e-mail."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  aria-invalid={submitted && form.name.trim().length < 2}
                  disabled={Boolean(editing)}
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  aria-invalid={submitted && !/^\S+@\S+\.\S+$/.test(form.email.trim())}
                  disabled={Boolean(editing)}
                  type="email"
                  value={form.email}
                  onChange={event => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={form.jobTitle}
                  onChange={event => setForm({ ...form, jobTitle: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={event => setForm({ ...form, phone: event.target.value })}
                />
              </div>
              <SelectField
                label="Empresa"
                value={form.companyId}
                onChange={value => setForm({ ...form, companyId: value })}
                options={
                  companies.data?.items.map(item => ({
                    value: String(item.id),
                    label: item.shortName,
                  })) ?? []
                }
              />
              <SelectField
                label="Área"
                value={form.areaId}
                onChange={value => setForm({ ...form, areaId: value })}
                options={
                  areas.data?.items.map(item => ({ value: String(item.id), label: item.name })) ??
                  []
                }
              />
              <SelectField
                label="Perfil"
                value={form.roleProfileId}
                onChange={value => setForm({ ...form, roleProfileId: value })}
                options={
                  taxonomies.data?.profiles.map(item => ({
                    value: String(item.id),
                    label: item.name,
                  })) ?? []
                }
              />
              {editing && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={value =>
                      setForm({ ...form, status: value as UserForm["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                      <SelectItem value="invited">Convidado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                disabled={createUser.isPending || updateUser.isPending}
                className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              >
                {createUser.isPending ? "Enviando convite..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(historyUser)} onOpenChange={value => !value && setHistoryUser(null)}>
          <DialogContent className="border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de convites</DialogTitle>
              <DialogDescription>
                {historyUser?.name} · {historyUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {history.isLoading && (
                <p className="py-6 text-center text-sm text-content-tertiary">
                  Carregando histórico...
                </p>
              )}
              {!history.isLoading && !history.data?.length && (
                <p className="py-6 text-center text-sm text-content-tertiary">
                  Nenhuma tentativa registrada.
                </p>
              )}
              {history.data?.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <InvitationIcon status={item.status} />
                      <span className="text-sm font-semibold text-content-primary">
                        Tentativa {item.attempt}
                      </span>
                    </div>
                    <span className="text-xs text-content-tertiary">
                      {formatDate(item.requestedAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-content-tertiary">
                    {invitationLabel(item.status)}
                    {item.senderEmail ? ` · ${item.senderEmail}` : ""}
                  </p>
                  {item.errorMessage && (
                    <p className="mt-2 rounded-lg bg-red-400/[0.06] px-3 py-2 text-xs text-red-200/70">
                      {item.errorCode}: {item.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function InvitationStatus({
  invitation,
  onHistory,
}: {
  invitation?: InvitationItem;
  onHistory: () => void;
}) {
  if (!invitation) return <span className="text-xs text-content-tertiary">Sem envio</span>;
  const date =
    invitation.activatedAt ??
    invitation.acceptedAt ??
    invitation.failedAt ??
    invitation.requestedAt;
  return (
    <button
      onClick={onHistory}
      className="group inline-flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-white/[0.04]"
      title="Ver histórico de convites"
    >
      <InvitationIcon status={invitation.status} />
      <span>
        <span className="block text-xs font-medium text-content-secondary">
          {invitationLabel(invitation.status)}
        </span>
        <span className="block text-[11px] text-content-tertiary">{formatDate(date)}</span>
      </span>
    </button>
  );
}

function InvitationIcon({ status }: { status: InvitationItem["status"] }) {
  if (status === "accepted") return <Mail className="h-4 w-4 text-sky-300" />;
  if (status === "activated") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === "failed") return <XCircle className="h-4 w-4 text-red-300" />;
  return <Clock3 className="h-4 w-4 text-amber-300" />;
}

function invitationLabel(status: InvitationItem["status"]) {
  return {
    pending: "Processando",
    accepted: "Enviado",
    failed: "Falha no envio",
    activated: "Acesso ativado",
  }[status];
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Não definido</SelectItem>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
