import type { MarketFilters } from "./FinanceLayout";

export type View = "overview" | "variation" | "transactions" | "context" | "future";
export const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
export const dimensionLabels = {
  brand: "Marca",
  businessUnit: "BU",
  modality: "Modalidade",
  product: "Produto",
  category: "Categoria",
  account: "Conta contábil",
  costCenter: "Centro de custo",
  month: "Mês",
  entryType: "Tipo de lançamento",
} as const;
export const dimensionFilterKeys: Record<string, keyof MarketFilters> = {
  brand: "brands",
  businessUnit: "businessUnits",
  modality: "modalities",
  product: "products",
  category: "categories",
  account: "accounts",
  costCenter: "costCenters",
  month: "months",
  entryType: "entryTypes",
};

export const money = (value: number, compact = true) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value);
export const percent = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
export const integer = (value: number) => new Intl.NumberFormat("pt-BR").format(value);
export const clean = (value: unknown) =>
  value === null || value === undefined || value === "" ? "Não informado" : String(value);
export const periodLabel = (months: number[]) => {
  const sorted = [...months].sort((a, b) => a - b);
  const key = sorted.join(",");
  const known: Record<string, string> = {
    "1,2,3": "1º tri",
    "4,5,6": "2º tri",
    "7,8,9": "3º tri",
    "10,11,12": "4º tri",
    "1,2,3,4,5,6": "1º sem",
    "7,8,9,10,11,12": "2º sem",
    "1,2,3,4,5,6,7": "Jan–Jul",
    "1,2,3,4,5,6,7,8,9,10,11,12": "Ano completo",
  };
  return (
    known[key] ??
    (sorted.length === 1
      ? monthNames[sorted[0] - 1]
      : sorted.map(item => monthNames[item - 1]).join(", "))
  );
};
export const scenarioLabel = {
  actual: "Realizado",
  forecast: "Forecast",
  outlook: "Outlook",
} as const;

export type MonthlyPoint = {
  month: string;
  monthNumber: number;
  real25: number | null;
  real26: number | null;
  forecast26: number | null;
};
export type TemporalPoint = {
  label: string;
  months: number[];
  reference: number | null;
  actual: number | null;
  forecast: number | null;
  current: number | null;
  delta: number | null;
  selected: boolean;
  cumulativeReference: number;
  cumulativeCurrent: number;
};

export function aggregateTemporal(
  points: MonthlyPoint[],
  grain: "month" | "quarter" | "semester",
  mode: "actual" | "forecast" | "outlook",
  selectedMonths: number[]
): TemporalPoint[] {
  const groups =
    grain === "month"
      ? points.map(point => ({ label: point.month, months: [point.monthNumber] }))
      : grain === "quarter"
        ? Array.from({ length: 4 }, (_, index) => ({
            label: `${index + 1}º tri`,
            months: [index * 3 + 1, index * 3 + 2, index * 3 + 3],
          }))
        : [
            { label: "1º sem", months: [1, 2, 3, 4, 5, 6] },
            { label: "2º sem", months: [7, 8, 9, 10, 11, 12] },
          ];
  let cumulativeReference = 0;
  let cumulativeCurrent = 0;
  return groups.map(group => {
    const members = points.filter(point => group.months.includes(point.monthNumber));
    const referenceValues = members
      .map(point => point.real25)
      .filter((value): value is number => value !== null);
    const actualValues = members
      .map(point => point.real26)
      .filter((value): value is number => value !== null);
    const forecastValues = members
      .map(point => point.forecast26)
      .filter((value): value is number => value !== null);
    const actual = actualValues.length ? actualValues.reduce((sum, value) => sum + value, 0) : null;
    const forecast = forecastValues.length
      ? forecastValues.reduce((sum, value) => sum + value, 0)
      : null;
    const currentValues = members
      .map(point =>
        mode === "actual"
          ? point.real26
          : mode === "forecast"
            ? point.forecast26
            : (point.real26 ?? point.forecast26)
      )
      .filter((value): value is number => value !== null);
    const reference = referenceValues.length
      ? referenceValues.reduce((sum, value) => sum + value, 0)
      : null;
    const current = currentValues.length
      ? currentValues.reduce((sum, value) => sum + value, 0)
      : null;
    cumulativeReference += reference ?? 0;
    cumulativeCurrent += current ?? 0;
    return {
      label: group.label,
      months: group.months,
      reference,
      actual,
      forecast,
      current,
      delta: reference !== null && current !== null ? current - reference : null,
      selected: group.months.some(month => selectedMonths.includes(month)),
      cumulativeReference,
      cumulativeCurrent,
    };
  });
}

export type VariationSort =
  | "label"
  | "real2025"
  | "real2026"
  | "delta"
  | "yoy"
  | "shareReal2026"
  | "movementShare";
