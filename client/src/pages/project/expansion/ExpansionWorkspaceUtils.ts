import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../../server/routers";

export type SectionKey =
  | "executive"
  | "dashboard"
  | "indicators"
  | "results"
  | "reports"
  | "analyses"
  | "documents"
  | "timeline"
  | "actions"
  | "decisions"
  | "owners"
  | "history"
  | "insights";
export type Person = {
  id: number;
  name: string | null;
  email: string | null;
  jobTitle: string | null;
  photoUrl: string | null;
};
export type Member = {
  userId: number;
  name: string | null;
  email: string | null;
  jobTitle: string | null;
  photoUrl: string | null;
  memberRole: string;
  responsibility: string | null;
  isPrimary: boolean;
};
export type Context = { manager: Person | null; sponsor: Person | null; members: Member[] };
export type Governance = RouterOutputs["governance"]["overview"] | undefined;
export type Project = {
  id: number;
  name: string;
  code: string;
  progress: number;
  objective: string | null;
  description: string | null;
};
export type Enriched = { company: string; area: string; category: string; priority: string };

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type ExpansionData = RouterOutputs["expansion"]["overview"];
export type ExpansionOptions = RouterOutputs["expansion"]["options"];
export type CommonProps = {
  projectId: number;
  cities: ExpansionData["cities"];
  options?: ExpansionOptions;
};
export function unique(values: string[]) {
  return Array.from(new Set(values));
}
export function uniqueObjects(values: Array<{ value: string; label: string }>) {
  return Array.from(new Map(values.map(item => [item.value, item])).values());
}
export function numberOrNull(value: string | number | null) {
  return value === null ? null : Number(value);
}
export function sumNullable(values: Array<string | number | null>) {
  const present = values.filter(value => value !== null).map(Number);
  return present.length ? present.reduce((sum, value) => sum + value, 0) : null;
}
export function money(value: string | number | null) {
  return value === null || value === undefined
    ? "—"
    : Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      });
}
export function formatMetric(value: number | null, unit: string | null) {
  if (value === null) return "—";
  if (unit === "R$")
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    });
  if (unit === "%") return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
}
export function formatDate(value: Date | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}
export function stageLabel(value: string) {
  return (
    (
      {
        prospecting: "Prospecção",
        study: "Estudo",
        approval: "Aprovação",
        implementation: "Implantação",
        operation: "Operação",
        paused: "Pausada",
        cancelled: "Cancelada",
      } as Record<string, string>
    )[value] ?? value
  );
}
export function scenarioLabel(value: string) {
  return (
    (
      { conservative: "Conservador", base: "Base", accelerated: "Acelerado" } as Record<
        string,
        string
      >
    )[value] ?? value
  );
}
export function offerStatusLabel(value: string) {
  return (
    (
      {
        study: "Estudo",
        approved: "Aprovada",
        implementation: "Implantação",
        active: "Ativa",
        paused: "Pausada",
        cancelled: "Cancelada",
      } as Record<string, string>
    )[value] ?? value
  );
}
export function readinessLabel(value: string) {
  return (
    (
      {
        not_started: "Não iniciada",
        mobilizing: "Mobilização",
        ready: "Pronta",
        operating: "Operando",
        blocked: "Bloqueada",
      } as Record<string, string>
    )[value] ?? value
  );
}
