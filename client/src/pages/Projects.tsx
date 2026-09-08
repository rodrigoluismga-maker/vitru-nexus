import DashboardLayout from "@/components/DashboardLayout";
import { EntityImageUpload } from "@/components/nexus/EntityImageUpload";
import { EmptyState } from "@/components/nexus/EmptyState";
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
import { ArrowRight, Filter, FolderKanban, Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type ProjectItem = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  objective: string | null;
  progress: number;
  health: "healthy" | "attention" | "critical" | "unassessed";
  color: string;
  coverUrl?: string | null;
  startDate: Date | null;
  endDate: Date | null;
  companyId: number;
  ownerAreaId: number;
  modalityId: number | null;
  managerId: number | null;
  executiveSponsorId: number | null;
  categoryId: number;
  statusId: number;
  priorityId: number;
  area: string;
  status: string;
  priority: string;
};

type FormState = {
  name: string;
  code: string;
  description: string;
  objective: string;
  companyId: string;
  ownerAreaId: string;
  modalityId: string;
  managerId: string;
  executiveSponsorId: string;
  categoryId: string;
  statusId: string;
  priorityId: string;
  startDate: string;
  endDate: string;
  color: string;
  progress: number;
  health: ProjectItem["health"];
};

const initialForm: FormState = {
  name: "",
  code: "",
  description: "",
  objective: "",
  companyId: "",
  ownerAreaId: "",
  modalityId: "none",
  managerId: "none",
  executiveSponsorId: "none",
  categoryId: "",
  statusId: "",
  priorityId: "",
  startDate: "",
  endDate: "",
  color: "var(--brand-violet-deep)",
  progress: 0,
  health: "unassessed",
};

export default function Projects({ admin = false }: { admin?: boolean }) {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [health, setHealth] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const utils = trpc.useUtils();

  const projectsQuery = trpc.projects.list.useQuery();
  const taxonomies = trpc.admin.taxonomies.all.useQuery();
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
  const modalities = trpc.admin.modalities.list.useQuery({
    search: "",
    page: 1,
    pageSize: 100,
    status: "active",
  });
  const users = trpc.admin.users.list.useQuery({ search: "", page: 1, pageSize: 100 });
  const createProject = trpc.projects.create.useMutation();
  const updateProject = trpc.projects.update.useMutation();

  const projects = projectsQuery.data as ProjectItem[] | undefined;
  const filtered = useMemo(
    () =>
      projects?.filter(project => {
        const matchesText = `${project.name} ${project.code} ${project.area}`
          .toLowerCase()
          .includes(search.toLowerCase());
        return matchesText && (health === "all" || project.health === health);
      }) ?? [],
    [projects, search, health]
  );

  const nullableId = (value: string) => (value === "none" || !value ? null : Number(value));
  const parseDate = (value: string) => (value ? new Date(`${value}T12:00:00.000Z`) : null);
  const dateInput = (value: Date | null) =>
    value ? new Date(value).toISOString().slice(0, 10) : "";

  const launch = (project?: ProjectItem) => {
    setEditing(project ?? null);
    setForm(
      project
        ? {
            name: project.name,
            code: project.code,
            description: project.description ?? "",
            objective: project.objective ?? "",
            companyId: String(project.companyId),
            ownerAreaId: String(project.ownerAreaId),
            modalityId: project.modalityId ? String(project.modalityId) : "none",
            managerId: project.managerId ? String(project.managerId) : "none",
            executiveSponsorId: project.executiveSponsorId
              ? String(project.executiveSponsorId)
              : "none",
            categoryId: String(project.categoryId),
            statusId: String(project.statusId),
            priorityId: String(project.priorityId),
            startDate: dateInput(project.startDate),
            endDate: dateInput(project.endDate),
            color: project.color,
            progress: project.progress,
            health: project.health,
          }
        : {
            ...initialForm,
            companyId: companies.data?.items[0] ? String(companies.data.items[0].id) : "",
            ownerAreaId: areas.data?.items[0] ? String(areas.data.items[0].id) : "",
            categoryId: taxonomies.data?.categories[0]
              ? String(taxonomies.data.categories[0].id)
              : "",
            statusId: taxonomies.data?.statuses[0] ? String(taxonomies.data.statuses[0].id) : "",
            priorityId: taxonomies.data?.priorities[0]
              ? String(taxonomies.data.priorities[0].id)
              : "",
          }
    );
    setOpen(true);
  };

  const save = async () => {
    const payload = {
      name: form.name,
      code: form.code,
      description: form.description || null,
      objective: form.objective || null,
      companyId: Number(form.companyId),
      ownerAreaId: Number(form.ownerAreaId),
      modalityId: nullableId(form.modalityId),
      managerId: nullableId(form.managerId),
      executiveSponsorId: nullableId(form.executiveSponsorId),
      categoryId: Number(form.categoryId),
      statusId: Number(form.statusId),
      priorityId: Number(form.priorityId),
      startDate: parseDate(form.startDate),
      endDate: parseDate(form.endDate),
      color: form.color,
      icon: "FolderKanban",
      progress: form.progress,
      health: form.health,
    };
    try {
      if (editing) await updateProject.mutateAsync({ id: editing.id, data: payload });
      else await createProject.mutateAsync(payload);
      await Promise.all([utils.projects.list.invalidate(), utils.dashboard.summary.invalidate()]);
      setOpen(false);
      toast.success(editing ? "Projeto atualizado." : "Projeto criado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  return (
    <DashboardLayout>
      <div className="nexus-page">
        <PageHeader
          eyebrow={admin ? "Administração" : "Portfólio estratégico"}
          title={admin ? "Gestão de projetos" : "Projetos"}
          description={
            admin
              ? "Cadastre e mantenha os projetos que alimentam o portfólio executivo."
              : "Acompanhe status, saúde e avanço dos projetos estratégicos em uma visão única."
          }
          icon={FolderKanban}
          actions={
            admin ? (
              <Button
                onClick={() => launch()}
                className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo projeto
              </Button>
            ) : undefined
          }
        />

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar projeto, código ou área..."
              className="h-10 border-white/[0.08] bg-white/[0.035] pl-9"
            />
          </div>
          <Select value={health} onValueChange={setHealth}>
            <SelectTrigger className="w-full border-white/[0.08] bg-white/[0.035] sm:w-48">
              <Filter className="mr-2 h-4 w-4 text-content-tertiary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as saúdes</SelectItem>
              <SelectItem value="healthy">Saudável</SelectItem>
              <SelectItem value="attention">Atenção</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="unassessed">Não avaliado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                admin={admin}
                onEdit={() => launch(project)}
                onOpen={() => navigate(`/projects/${project.id}/executive`)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="Nenhum projeto encontrado"
              description="Revise a busca ou crie um novo projeto no módulo administrativo."
            />
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar projeto" : "Novo projeto"}</DialogTitle>
              <DialogDescription>
                Defina a identidade, os vínculos e o enquadramento inicial do projeto.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 sm:grid-cols-2">
              <Field label="Nome">
                <Input
                  value={form.name}
                  onChange={event => setForm({ ...form, name: event.target.value })}
                />
              </Field>
              <Field label="Código">
                <Input
                  value={form.code}
                  onChange={event => setForm({ ...form, code: event.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Descrição" wide>
                <Textarea
                  value={form.description}
                  onChange={event => setForm({ ...form, description: event.target.value })}
                />
              </Field>
              <Field label="Objetivo" wide>
                <Textarea
                  value={form.objective}
                  onChange={event => setForm({ ...form, objective: event.target.value })}
                />
              </Field>
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
                label="Área responsável"
                value={form.ownerAreaId}
                onChange={value => setForm({ ...form, ownerAreaId: value })}
                options={
                  areas.data?.items.map(item => ({ value: String(item.id), label: item.name })) ??
                  []
                }
              />
              <SelectField
                label="Modalidade"
                optional
                value={form.modalityId}
                onChange={value => setForm({ ...form, modalityId: value })}
                options={
                  modalities.data?.items.map(item => ({
                    value: String(item.id),
                    label: item.name,
                  })) ?? []
                }
              />
              <SelectField
                label="Categoria"
                value={form.categoryId}
                onChange={value => setForm({ ...form, categoryId: value })}
                options={
                  taxonomies.data?.categories.map(item => ({
                    value: String(item.id),
                    label: item.name,
                  })) ?? []
                }
              />
              <SelectField
                label="Status"
                value={form.statusId}
                onChange={value => setForm({ ...form, statusId: value })}
                options={
                  taxonomies.data?.statuses.map(item => ({
                    value: String(item.id),
                    label: item.name,
                  })) ?? []
                }
              />
              <SelectField
                label="Prioridade"
                value={form.priorityId}
                onChange={value => setForm({ ...form, priorityId: value })}
                options={
                  taxonomies.data?.priorities.map(item => ({
                    value: String(item.id),
                    label: item.name,
                  })) ?? []
                }
              />
              <SelectField
                label="Gestor"
                optional
                value={form.managerId}
                onChange={value => setForm({ ...form, managerId: value })}
                options={
                  users.data?.items.map(item => ({
                    value: String(item.id),
                    label: item.name ?? item.email ?? `Usuário ${item.id}`,
                  })) ?? []
                }
              />
              <SelectField
                label="Patrocinador executivo"
                optional
                value={form.executiveSponsorId}
                onChange={value => setForm({ ...form, executiveSponsorId: value })}
                options={
                  users.data?.items.map(item => ({
                    value: String(item.id),
                    label: item.name ?? item.email ?? `Usuário ${item.id}`,
                  })) ?? []
                }
              />
              <Field label="Início">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={event => setForm({ ...form, startDate: event.target.value })}
                />
              </Field>
              <Field label="Término">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={event => setForm({ ...form, endDate: event.target.value })}
                />
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
              <SelectField
                label="Saúde"
                value={form.health}
                onChange={value => setForm({ ...form, health: value as FormState["health"] })}
                options={[
                  { value: "unassessed", label: "Não avaliado" },
                  { value: "healthy", label: "Saudável" },
                  { value: "attention", label: "Atenção" },
                  { value: "critical", label: "Crítico" },
                ]}
              />
              <div className="sm:col-span-2">
                <EntityImageUpload
                  targetType="project_cover"
                  targetId={editing?.id}
                  currentUrl={editing?.coverUrl}
                  label="Capa do projeto"
                  onDone={() => utils.projects.list.invalidate()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={save}
                disabled={
                  !form.name ||
                  !form.code ||
                  !form.companyId ||
                  !form.ownerAreaId ||
                  !form.categoryId ||
                  !form.statusId ||
                  !form.priorityId ||
                  createProject.isPending ||
                  updateProject.isPending
                }
                className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
              >
                Salvar projeto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function ProjectCard({
  project,
  admin,
  onEdit,
  onOpen,
}: {
  project: ProjectItem;
  admin: boolean;
  onEdit: () => void;
  onOpen: () => void;
}) {
  return (
    <article className="nexus-surface nexus-card-hover group overflow-hidden rounded-3xl">
      {project.coverUrl && (
        <div className="relative h-24 overflow-hidden">
          <img
            src={project.coverUrl}
            alt=""
            className="h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-2)] to-transparent" />
        </div>
      )}
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(90deg, ${project.color}, transparent)` }}
      />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <StatusBadge status={project.health} />
          <span className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">
            {project.code}
          </span>
        </div>
        <h2 className="nexus-heading mt-5 min-h-12 text-xl font-bold text-content-primary">
          {project.name}
        </h2>
        <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-content-tertiary">
          {project.description || "Descrição ainda não cadastrada."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.055] bg-black/10 p-3">
          <div>
            <p className="text-[11px] uppercase tracking-[.13em] text-content-tertiary">Área</p>
            <p className="mt-1 truncate text-xs text-content-secondary">{project.area}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[.13em] text-content-tertiary">Status</p>
            <p className="mt-1 truncate text-xs text-content-secondary">{project.status}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-[11px] text-content-tertiary">
            <span>Progresso reportado</span>
            <span className="nexus-number">{project.progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--brand-violet-deep)] to-[var(--brand-accent)]"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.055] pt-4">
          {admin ? (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar
            </Button>
          ) : (
            <span className="text-[11px] text-content-tertiary">{project.priority}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpen}
            className="text-[var(--brand-accent)] hover:text-[var(--brand-accent-hover)]"
          >
            Abrir workspace{" "}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={`space-y-2 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
  optional,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  optional?: boolean;
}) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {optional && <SelectItem value="none">Não definido</SelectItem>}
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
