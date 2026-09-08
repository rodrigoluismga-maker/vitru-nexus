import { FormValidationSummary } from "@/components/nexus/FormValidationSummary";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type ExpansionRecordKind =
  | "city"
  | "scenario"
  | "offer"
  | "competitor"
  | "media"
  | "sales"
  | "metric";

type CityOption = { id: number; name: string; stateCode: string };
type Options = {
  companies?: Array<{ id: number; name: string; color: string }>;
  modalities?: Array<{ id: number; name: string }>;
  users?: Array<{ id: number; name: string | null; email: string | null }>;
};

const labels: Record<ExpansionRecordKind, { title: string; description: string; button: string }> =
  {
    city: {
      title: "Nova praça",
      description: "Cadastre a cidade e o estágio atual da oportunidade.",
      button: "Adicionar praça",
    },
    scenario: {
      title: "Novo cenário",
      description: "Registre premissas e projeções sem substituir a fonte oficial.",
      button: "Criar cenário",
    },
    offer: {
      title: "Nova oferta",
      description: "Vincule curso, marca, cidade, preço e capacidade planejada.",
      button: "Adicionar oferta",
    },
    competitor: {
      title: "Novo concorrente",
      description: "Registre evidência de mercado e posicionamento local.",
      button: "Mapear concorrente",
    },
    media: {
      title: "Novo plano de mídia",
      description: "Estruture canais, investimento e objetivos de captação.",
      button: "Adicionar mídia",
    },
    sales: {
      title: "Novo plano comercial",
      description: "Organize capacidade, metas e prontidão da força comercial.",
      button: "Adicionar canal",
    },
    metric: {
      title: "Novo indicador",
      description: "Registre meta, realizado e forecast com fonte e período.",
      button: "Adicionar indicador",
    },
  };

const empty = {
  cityId: "none",
  name: "",
  stateCode: "",
  region: "",
  population: "",
  populationYear: "",
  source: "",
  stage: "prospecting",
  health: "unassessed",
  score: "",
  openingDate: "",
  notes: "",
  scenario: "base",
  period: "2027",
  enrollments: "",
  leads: "",
  conversion: "",
  ticket: "",
  revenue: "",
  investment: "",
  digitalShare: "",
  assumptions: "",
  companyId: "none",
  modalityId: "none",
  course: "",
  courseCode: "",
  degreeType: "",
  shift: "",
  entryPeriod: "2027.1",
  grossPrice: "",
  discount: "",
  netPrice: "",
  capacity: "",
  status: "study",
  institution: "",
  isPrivate: true,
  evidenceDate: "",
  modality: "",
  campaign: "",
  channel: "",
  channelType: "digital",
  objective: "",
  targetLeads: "",
  targetEnrollments: "",
  startDate: "",
  endDate: "",
  ownerId: "none",
  plannedHeadcount: "",
  currentHeadcount: "",
  actualEnrollments: "",
  readiness: "not_started",
  metricCode: "",
  metricName: "",
  unit: "",
  target: "",
  actual: "",
  forecast: "",
  measuredAt: "",
};

export function ExpansionCreateDialog({
  kind,
  projectId,
  cities,
  options,
  compact = false,
}: {
  kind: ExpansionRecordKind;
  projectId: number;
  cities: CityOption[];
  options?: Options;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [submitted, setSubmitted] = useState(false);
  const utils = trpc.useUtils();
  const createCity = trpc.expansion.cities.create.useMutation();
  const createScenario = trpc.expansion.scenarios.create.useMutation();
  const createOffer = trpc.expansion.offers.create.useMutation();
  const createCompetitor = trpc.expansion.competitors.create.useMutation();
  const createMedia = trpc.expansion.media.create.useMutation();
  const createSales = trpc.expansion.sales.create.useMutation();
  const createMetric = trpc.expansion.metrics.create.useMutation();
  const busy = [
    createCity,
    createScenario,
    createOffer,
    createCompetitor,
    createMedia,
    createSales,
    createMetric,
  ].some(item => item.isPending);

  const errors = validate(kind, form);
  const number = (value: string) => (value.trim() === "" ? null : Number(value));
  const id = (value: string) => (value === "none" ? null : Number(value));
  const date = (value: string) => (value ? new Date(`${value}T12:00:00`) : null);
  const update = (key: keyof typeof form, value: string | boolean) =>
    setForm(current => ({ ...current, [key]: value }));

  const save = async () => {
    setSubmitted(true);
    if (errors.length) return toast.error("Revise os campos obrigatórios.");
    try {
      if (kind === "city")
        await createCity.mutateAsync({
          projectId,
          name: form.name,
          stateCode: form.stateCode,
          region: form.region || null,
          population: number(form.population),
          populationReferenceYear: number(form.populationYear),
          populationSource: form.source || null,
          stage: form.stage as "prospecting",
          health: form.health as "unassessed",
          overallScore: number(form.score),
          targetOpeningDate: date(form.openingDate),
          notes: form.notes || null,
        });
      if (kind === "scenario")
        await createScenario.mutateAsync({
          projectId,
          cityId: id(form.cityId),
          name: form.scenario as "base",
          periodLabel: form.period,
          targetEnrollments: number(form.enrollments),
          targetLeads: number(form.leads),
          conversionRate: percentage(form.conversion),
          averageTicket: number(form.ticket),
          grossRevenue: number(form.revenue),
          totalInvestment: number(form.investment),
          digitalShare: percentage(form.digitalShare),
          assumptions: form.assumptions || null,
        });
      if (kind === "offer")
        await createOffer.mutateAsync({
          projectId,
          cityId: Number(form.cityId),
          companyId: Number(form.companyId),
          modalityId: id(form.modalityId),
          courseName: form.course,
          courseCode: form.courseCode || null,
          degreeType: form.degreeType || null,
          shift: form.shift || null,
          entryPeriod: form.entryPeriod || null,
          grossPrice: number(form.grossPrice),
          launchDiscount: percentage(form.discount),
          targetNetPrice: number(form.netPrice),
          capacity: number(form.capacity),
          status: form.status as "study",
          notes: form.notes || null,
        });
      if (kind === "competitor")
        await createCompetitor.mutateAsync({
          projectId,
          cityId: Number(form.cityId),
          institutionName: form.institution,
          isPrivate: form.isPrivate,
          courseName: form.course || null,
          modality: form.modality || null,
          grossPrice: number(form.grossPrice),
          netPrice: number(form.netPrice),
          evidenceSource: form.source || null,
          evidenceDate: date(form.evidenceDate),
          notes: form.notes || null,
        });
      if (kind === "media")
        await createMedia.mutateAsync({
          projectId,
          cityId: Number(form.cityId),
          campaignName: form.campaign,
          channelName: form.channel,
          channelType: form.channelType as "digital",
          objective: form.objective || null,
          investment: number(form.investment),
          targetLeads: number(form.targetLeads),
          targetEnrollments: number(form.targetEnrollments),
          startDate: date(form.startDate),
          endDate: date(form.endDate),
          ownerId: id(form.ownerId),
          status: form.status === "study" ? "planned" : (form.status as "planned"),
        });
      if (kind === "sales")
        await createSales.mutateAsync({
          projectId,
          cityId: Number(form.cityId),
          channelName: form.channel,
          ownerId: id(form.ownerId),
          plannedHeadcount: number(form.plannedHeadcount),
          currentHeadcount: number(form.currentHeadcount),
          targetLeads: number(form.targetLeads),
          targetEnrollments: number(form.targetEnrollments),
          actualEnrollments: number(form.actualEnrollments),
          readiness: form.readiness as "not_started",
          notes: form.notes || null,
        });
      if (kind === "metric")
        await createMetric.mutateAsync({
          projectId,
          cityId: id(form.cityId),
          metricCode: form.metricCode,
          name: form.metricName,
          unit: form.unit || null,
          periodLabel: form.period,
          targetValue: number(form.target),
          actualValue: number(form.actual),
          forecastValue: number(form.forecast),
          source: form.source || null,
          measuredAt: date(form.measuredAt),
        });
      await utils.expansion.overview.invalidate({ projectId });
      setOpen(false);
      setForm({ ...empty });
      setSubmitted(false);
      toast.success(
        `${labels[kind].title.replace("Novo", "").replace("Nova", "").trim()} salvo(a).`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o registro.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={compact ? "sm" : "default"}
          className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          {labels[kind].button}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[var(--surface-2)]/96 backdrop-blur-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{labels[kind].title}</DialogTitle>
          <DialogDescription>{labels[kind].description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {fieldsFor(kind, form, update, cities, options, submitted)}
        </div>
        {submitted && <FormValidationSummary errors={errors} />}
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={save}
            disabled={busy}
            className="bg-[var(--brand-accent)] font-bold text-[var(--surface-3)] hover:bg-[var(--brand-accent-hover)]"
          >
            {busy ? "Salvando..." : "Salvar registro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  wide = false,
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
function text(
  value: string,
  key: keyof typeof empty,
  update: (key: keyof typeof empty, value: string) => void,
  placeholder?: string,
  invalid?: boolean
) {
  return (
    <Input
      value={value}
      onChange={event => update(key, event.target.value)}
      placeholder={placeholder}
      aria-invalid={invalid}
    />
  );
}
function numeric(
  value: string,
  key: keyof typeof empty,
  update: (key: keyof typeof empty, value: string) => void,
  placeholder?: string
) {
  return (
    <Input
      type="number"
      min="0"
      step="any"
      value={value}
      onChange={event => update(key, event.target.value)}
      placeholder={placeholder}
    />
  );
}
function picker(
  value: string,
  key: keyof typeof empty,
  update: (key: keyof typeof empty, value: string) => void,
  options: Array<{ value: string; label: string }>,
  placeholder = "Selecione"
) {
  return (
    <Select value={value} onValueChange={next => update(key, next)}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function cityPicker(
  form: typeof empty,
  update: (key: keyof typeof empty, value: string) => void,
  cities: CityOption[],
  optional = false
) {
  return picker(
    form.cityId,
    "cityId",
    update,
    [
      ...(optional ? [{ value: "none", label: "Portfólio consolidado" }] : []),
      ...cities.map(city => ({ value: String(city.id), label: `${city.name}/${city.stateCode}` })),
    ],
    "Selecione a praça"
  );
}

function fieldsFor(
  kind: ExpansionRecordKind,
  form: typeof empty,
  update: (key: keyof typeof empty, value: string | boolean) => void,
  cities: CityOption[],
  options: Options | undefined,
  submitted: boolean
) {
  const u = (key: keyof typeof empty, value: string) => update(key, value);
  if (kind === "city")
    return (
      <>
        <Field label="Cidade">
          {text(form.name, "name", u, "Ex.: Maringá", submitted && form.name.trim().length < 2)}
        </Field>
        <Field label="UF">
          {text(
            form.stateCode,
            "stateCode",
            u,
            "PR",
            submitted && form.stateCode.trim().length !== 2
          )}
        </Field>
        <Field label="Região">{text(form.region, "region", u, "Sul")}</Field>
        <Field label="População de referência">{numeric(form.population, "population", u)}</Field>
        <Field label="Ano da população">{numeric(form.populationYear, "populationYear", u)}</Field>
        <Field label="Fonte oficial">{text(form.source, "source", u, "https://...")}</Field>
        <Field label="Estágio">{picker(form.stage, "stage", u, stageOptions)}</Field>
        <Field label="Saúde">{picker(form.health, "health", u, healthOptions)}</Field>
        <Field label="Score geral">{numeric(form.score, "score", u, "0 a 100")}</Field>
        <Field label="Abertura prevista">
          <Input
            type="date"
            value={form.openingDate}
            onChange={event => u("openingDate", event.target.value)}
          />
        </Field>
        <Field label="Observações" wide>
          <Textarea value={form.notes} onChange={event => u("notes", event.target.value)} />
        </Field>
      </>
    );
  if (kind === "scenario")
    return (
      <>
        <Field label="Praça">{cityPicker(form, u, cities, true)}</Field>
        <Field label="Cenário">{picker(form.scenario, "scenario", u, scenarioOptions)}</Field>
        <Field label="Período">{text(form.period, "period", u, "2027")}</Field>
        <Field label="Matrículas">{numeric(form.enrollments, "enrollments", u)}</Field>
        <Field label="Leads">{numeric(form.leads, "leads", u)}</Field>
        <Field label="Conversão %">{numeric(form.conversion, "conversion", u)}</Field>
        <Field label="Ticket médio">{numeric(form.ticket, "ticket", u)}</Field>
        <Field label="Receita bruta">{numeric(form.revenue, "revenue", u)}</Field>
        <Field label="Investimento total">{numeric(form.investment, "investment", u)}</Field>
        <Field label="Participação digital %">
          {numeric(form.digitalShare, "digitalShare", u)}
        </Field>
        <Field label="Premissas" wide>
          <Textarea
            value={form.assumptions}
            onChange={event => u("assumptions", event.target.value)}
          />
        </Field>
      </>
    );
  if (kind === "offer")
    return (
      <>
        <Field label="Praça">{cityPicker(form, u, cities)}</Field>
        <Field label="Marca">
          {picker(
            form.companyId,
            "companyId",
            u,
            options?.companies?.map(item => ({ value: String(item.id), label: item.name })) ?? []
          )}
        </Field>
        <Field label="Curso">
          {text(
            form.course,
            "course",
            u,
            "Nome do curso",
            submitted && form.course.trim().length < 2
          )}
        </Field>
        <Field label="Código">{text(form.courseCode, "courseCode", u)}</Field>
        <Field label="Modalidade">
          {picker(form.modalityId, "modalityId", u, [
            { value: "none", label: "Não definida" },
            ...(options?.modalities?.map(item => ({ value: String(item.id), label: item.name })) ??
              []),
          ])}
        </Field>
        <Field label="Turno">{text(form.shift, "shift", u, "Noturno")}</Field>
        <Field label="Período de entrada">
          {text(form.entryPeriod, "entryPeriod", u, "2027.1")}
        </Field>
        <Field label="Capacidade">{numeric(form.capacity, "capacity", u)}</Field>
        <Field label="Preço bruto">{numeric(form.grossPrice, "grossPrice", u)}</Field>
        <Field label="Desconto de lançamento %">{numeric(form.discount, "discount", u)}</Field>
        <Field label="Preço líquido alvo">{numeric(form.netPrice, "netPrice", u)}</Field>
        <Field label="Status">{picker(form.status, "status", u, offerStatusOptions)}</Field>
      </>
    );
  if (kind === "competitor")
    return (
      <>
        <Field label="Praça">{cityPicker(form, u, cities)}</Field>
        <Field label="Instituição">
          {text(
            form.institution,
            "institution",
            u,
            "Concorrente privado",
            submitted && form.institution.trim().length < 2
          )}
        </Field>
        <Field label="Curso">{text(form.course, "course", u)}</Field>
        <Field label="Modalidade">{text(form.modality, "modality", u)}</Field>
        <Field label="Preço bruto">{numeric(form.grossPrice, "grossPrice", u)}</Field>
        <Field label="Preço líquido">{numeric(form.netPrice, "netPrice", u)}</Field>
        <Field label="Fonte da evidência">{text(form.source, "source", u, "https://...")}</Field>
        <Field label="Data da evidência">
          <Input
            type="date"
            value={form.evidenceDate}
            onChange={event => u("evidenceDate", event.target.value)}
          />
        </Field>
        <Field label="Instituição privada" wide>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isPrivate}
              onCheckedChange={value => update("isPrivate", value)}
            />
            <span className="text-xs text-content-tertiary">
              Considerar no comparativo competitivo principal
            </span>
          </div>
        </Field>
      </>
    );
  if (kind === "media")
    return (
      <>
        <Field label="Praça">{cityPicker(form, u, cities)}</Field>
        <Field label="Campanha">
          {text(
            form.campaign,
            "campaign",
            u,
            "Campanha de lançamento",
            submitted && form.campaign.trim().length < 2
          )}
        </Field>
        <Field label="Canal">
          {text(
            form.channel,
            "channel",
            u,
            "Meta, rádio, OOH...",
            submitted && form.channel.trim().length < 2
          )}
        </Field>
        <Field label="Tipo">{picker(form.channelType, "channelType", u, mediaTypeOptions)}</Field>
        <Field label="Investimento">{numeric(form.investment, "investment", u)}</Field>
        <Field label="Meta de leads">{numeric(form.targetLeads, "targetLeads", u)}</Field>
        <Field label="Meta de matrículas">
          {numeric(form.targetEnrollments, "targetEnrollments", u)}
        </Field>
        <Field label="Responsável">
          {picker(form.ownerId, "ownerId", u, [
            { value: "none", label: "Não definido" },
            ...(options?.users?.map(item => ({
              value: String(item.id),
              label: item.name ?? item.email ?? `Usuário ${item.id}`,
            })) ?? []),
          ])}
        </Field>
        <Field label="Início">
          <Input
            type="date"
            value={form.startDate}
            onChange={event => u("startDate", event.target.value)}
          />
        </Field>
        <Field label="Término">
          <Input
            type="date"
            value={form.endDate}
            onChange={event => u("endDate", event.target.value)}
          />
        </Field>
        <Field label="Objetivo" wide>
          {text(form.objective, "objective", u)}
        </Field>
      </>
    );
  if (kind === "sales")
    return (
      <>
        <Field label="Praça">{cityPicker(form, u, cities)}</Field>
        <Field label="Canal comercial">
          {text(
            form.channel,
            "channel",
            u,
            "Equipe local, parceiros...",
            submitted && form.channel.trim().length < 2
          )}
        </Field>
        <Field label="Responsável">
          {picker(form.ownerId, "ownerId", u, [
            { value: "none", label: "Não definido" },
            ...(options?.users?.map(item => ({
              value: String(item.id),
              label: item.name ?? item.email ?? `Usuário ${item.id}`,
            })) ?? []),
          ])}
        </Field>
        <Field label="Prontidão">{picker(form.readiness, "readiness", u, readinessOptions)}</Field>
        <Field label="HC planejado">{numeric(form.plannedHeadcount, "plannedHeadcount", u)}</Field>
        <Field label="HC atual">{numeric(form.currentHeadcount, "currentHeadcount", u)}</Field>
        <Field label="Meta de leads">{numeric(form.targetLeads, "targetLeads", u)}</Field>
        <Field label="Meta de matrículas">
          {numeric(form.targetEnrollments, "targetEnrollments", u)}
        </Field>
        <Field label="Matrículas realizadas">
          {numeric(form.actualEnrollments, "actualEnrollments", u)}
        </Field>
        <Field label="Observações" wide>
          <Textarea value={form.notes} onChange={event => u("notes", event.target.value)} />
        </Field>
      </>
    );
  return (
    <>
      <Field label="Praça">{cityPicker(form, u, cities, true)}</Field>
      <Field label="Período">{text(form.period, "period", u, "2027")}</Field>
      <Field label="Indicador">
        {text(
          form.metricName,
          "metricName",
          u,
          "Ex.: Matrículas",
          submitted && form.metricName.trim().length < 2
        )}
      </Field>
      <Field label="Código">
        {text(
          form.metricCode,
          "metricCode",
          u,
          "matriculas",
          submitted && !/^[a-z0-9_]{2,80}$/.test(form.metricCode)
        )}
      </Field>
      <Field label="Unidade">{text(form.unit, "unit", u, "#, %, R$")}</Field>
      <Field label="Meta">{numeric(form.target, "target", u)}</Field>
      <Field label="Realizado">{numeric(form.actual, "actual", u)}</Field>
      <Field label="Forecast">{numeric(form.forecast, "forecast", u)}</Field>
      <Field label="Fonte">{text(form.source, "source", u, "Sistema ou relatório oficial")}</Field>
      <Field label="Data de medição">
        <Input
          type="date"
          value={form.measuredAt}
          onChange={event => u("measuredAt", event.target.value)}
        />
      </Field>
    </>
  );
}

function validate(kind: ExpansionRecordKind, form: typeof empty) {
  const errors: string[] = [];
  if (kind === "city" && form.name.trim().length < 2) errors.push("Informe a cidade.");
  if (kind === "city" && form.stateCode.trim().length !== 2)
    errors.push("Informe a UF com duas letras.");
  if (["offer", "competitor", "media", "sales"].includes(kind) && form.cityId === "none")
    errors.push("Selecione a praça.");
  if (kind === "offer" && form.companyId === "none") errors.push("Selecione a marca.");
  if (kind === "offer" && form.course.trim().length < 2) errors.push("Informe o curso.");
  if (kind === "competitor" && form.institution.trim().length < 2)
    errors.push("Informe a instituição concorrente.");
  if (kind === "media" && (form.campaign.trim().length < 2 || form.channel.trim().length < 2))
    errors.push("Informe campanha e canal.");
  if (kind === "sales" && form.channel.trim().length < 2) errors.push("Informe o canal comercial.");
  if (kind === "metric" && form.metricName.trim().length < 2) errors.push("Informe o indicador.");
  if (kind === "metric" && !/^[a-z0-9_]{2,80}$/.test(form.metricCode))
    errors.push("Use um código em minúsculas, números ou sublinhado.");
  return errors;
}

function percentage(value: string) {
  const parsed = value.trim() === "" ? null : Number(value);
  return parsed === null ? null : parsed / 100;
}
const stageOptions = [
  { value: "prospecting", label: "Prospecção" },
  { value: "study", label: "Estudo" },
  { value: "approval", label: "Aprovação" },
  { value: "implementation", label: "Implantação" },
  { value: "operation", label: "Operação" },
  { value: "paused", label: "Pausada" },
  { value: "cancelled", label: "Cancelada" },
];
const healthOptions = [
  { value: "unassessed", label: "Não avaliada" },
  { value: "healthy", label: "Saudável" },
  { value: "attention", label: "Atenção" },
  { value: "critical", label: "Crítica" },
];
const scenarioOptions = [
  { value: "conservative", label: "Conservador" },
  { value: "base", label: "Base" },
  { value: "accelerated", label: "Acelerado" },
];
const offerStatusOptions = [
  { value: "study", label: "Estudo" },
  { value: "approved", label: "Aprovada" },
  { value: "implementation", label: "Implantação" },
  { value: "active", label: "Ativa" },
  { value: "paused", label: "Pausada" },
  { value: "cancelled", label: "Cancelada" },
];
const mediaTypeOptions = [
  { value: "digital", label: "Digital" },
  { value: "offline", label: "Offline" },
  { value: "partnership", label: "Parceria" },
  { value: "event", label: "Evento" },
  { value: "other", label: "Outro" },
];
const readinessOptions = [
  { value: "not_started", label: "Não iniciada" },
  { value: "mobilizing", label: "Mobilização" },
  { value: "ready", label: "Pronta" },
  { value: "operating", label: "Operando" },
  { value: "blocked", label: "Bloqueada" },
];
