import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  BadgeDollarSign,
  BookOpenCheck,
  CalendarRange,
  Check,
  ChevronDown,
  CircleDashed,
  FileSearch2,
  Filter,
  Gauge,
  GitCompareArrows,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation } from "wouter";
export type MarketFilters = {
  brands: string[];
  businessUnits: string[];
  modalities: string[];
  products: string[];
  categories: string[];
  accounts: string[];
  costCenters: string[];
  months: number[];
  entryTypes: string[];
};
export type MarketAnalysis = {
  scenarioMode: "actual" | "forecast" | "outlook";
  grain: "month" | "quarter" | "semester";
};
const emptyFilters: MarketFilters = {
  brands: [],
  businessUnits: [],
  modalities: [],
  products: [],
  categories: [],
  accounts: [],
  costCenters: [],
  months: [],
  entryTypes: [],
};
const defaultAnalysis: MarketAnalysis = { scenarioMode: "outlook", grain: "month" };
const queryKeys: Record<keyof MarketFilters, string> = {
  brands: "marca",
  businessUnits: "bu",
  modalities: "modalidade",
  products: "produto",
  categories: "categoria",
  accounts: "conta",
  costCenters: "cc",
  months: "mes",
  entryTypes: "tipo",
};
const navigation = [
  { path: "/finance", label: "Visão Executiva", icon: Gauge },
  { path: "/finance/variation", label: "Variation Explorer", icon: GitCompareArrows },
  { path: "/finance/transactions", label: "Lançamentos", icon: FileSearch2 },
  { path: "/finance/context", label: "Contexto & Qualidade", icon: BookOpenCheck },
  { path: "/finance/future", label: "Futuro da Alocação", icon: CircleDashed },
] as const;
const monthNames = [
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
const fullYearMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const periodOptions = [
  { value: "jan-jul", label: "Jan–Jul", months: [1, 2, 3, 4, 5, 6, 7] },
  { value: "aug-dec", label: "Ago–Dez", months: [8, 9, 10, 11, 12] },
  { value: "q1", label: "1º trimestre", months: [1, 2, 3] },
  { value: "q2", label: "2º trimestre", months: [4, 5, 6] },
  { value: "q3", label: "3º trimestre", months: [7, 8, 9] },
  { value: "q4", label: "4º trimestre", months: [10, 11, 12] },
  { value: "s1", label: "1º semestre", months: [1, 2, 3, 4, 5, 6] },
  { value: "s2", label: "2º semestre", months: [7, 8, 9, 10, 11, 12] },
  { value: "fy", label: "Ano completo", months: fullYearMonths },
] as const;
type ContextValue = {
  filters: MarketFilters;
  analysis: MarketAnalysis;
  analysisMonths: number[];
  setFilter: <K extends keyof MarketFilters>(key: K, value: MarketFilters[K]) => void;
  setAnalysis: (value: Partial<MarketAnalysis>) => void;
  clearFilters: () => void;
  activeCount: number;
};
const FilterContext = createContext<ContextValue>({
  filters: emptyFilters,
  analysis: defaultAnalysis,
  analysisMonths: periodOptions[0].months.slice(),
  setFilter: () => undefined,
  setAnalysis: () => undefined,
  clearFilters: () => undefined,
  activeCount: 0,
});
export const useMarketFinanceFilters = () => useContext(FilterContext);
function fromUrl() {
  const params = new URLSearchParams(window.location.search);
  const result = { ...emptyFilters };
  (Object.keys(queryKeys) as (keyof MarketFilters)[]).forEach(key => {
    const raw = params.get(queryKeys[key]);
    if (!raw) return;
    (result as any)[key] =
      key === "months" ? raw.split(",").map(Number).filter(Boolean) : raw.split(",");
  });
  return result;
}
function analysisFromUrl(): MarketAnalysis {
  const params = new URLSearchParams(window.location.search);
  const scenario = params.get("cenario");
  const grain = params.get("granularidade");
  return {
    scenarioMode:
      scenario === "actual" || scenario === "forecast" || scenario === "outlook"
        ? scenario
        : "outlook",
    grain: grain === "quarter" || grain === "semester" ? grain : "month",
  };
}
function sameMonths(a: readonly number[], b: readonly number[]) {
  return (
    a.length === b.length &&
    [...a]
      .sort((x, y) => x - y)
      .every((value, index) => value === [...b].sort((x, y) => x - y)[index])
  );
}
export default function FinanceLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const navigationRef = useRef<HTMLElement>(null);
  const context = trpc.marketFinance.context.useQuery();
  const [filters, setFilters] = useState<MarketFilters>(() => fromUrl());
  const [analysis, setAnalysisState] = useState<MarketAnalysis>(() => analysisFromUrl());
  const [advanced, setAdvanced] = useState(false);
  const analysisMonths = filters.months.length
    ? filters.months
    : analysis.scenarioMode === "forecast"
      ? [8, 9, 10, 11, 12]
      : analysis.scenarioMode === "outlook"
        ? fullYearMonths
        : periodOptions[0].months.slice();
  const sync = (nextFilters: MarketFilters, nextAnalysis: MarketAnalysis) => {
    const params = new URLSearchParams();
    (Object.keys(queryKeys) as (keyof MarketFilters)[]).forEach(key => {
      const value = nextFilters[key];
      if (value.length) params.set(queryKeys[key], value.join(","));
    });
    if (nextAnalysis.scenarioMode !== "outlook") params.set("cenario", nextAnalysis.scenarioMode);
    if (nextAnalysis.grain !== "month") params.set("granularidade", nextAnalysis.grain);
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${params.toString() ? `?${params}` : ""}`
    );
  };
  const setFilter = <K extends keyof MarketFilters>(key: K, value: MarketFilters[K]) =>
    setFilters(current => ({ ...current, [key]: value }));
  const setAnalysis = (value: Partial<MarketAnalysis>) =>
    setAnalysisState(current => ({ ...current, ...value }));
  const clearFilters = () => setFilters(emptyFilters);
  const activeCount =
    Object.values(filters).filter(value => value.length).length +
    (analysis.scenarioMode !== "outlook" ? 1 : 0);
  const contextValue = useMemo(
    () => ({
      filters,
      analysis,
      analysisMonths,
      setFilter,
      setAnalysis,
      clearFilters,
      activeCount,
    }),
    [filters, analysis, analysisMonths.join(","), activeCount]
  );
  useEffect(() => {
    sync(filters, analysis);
  }, [filters, analysis]);
  useEffect(() => {
    navigationRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [location]);
  if (context.error?.data?.code === "FORBIDDEN")
    return (
      <DashboardLayout>
        <div className="nexus-page">
          <div className="nexus-surface rounded-3xl p-10 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-[var(--brand-accent)]" />
            <h1 className="mt-4 text-2xl font-bold">Acesso financeiro não autorizado</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-content-tertiary">
              Seu perfil não possui a permissão finance.view.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  const options = context.data?.filters as any;
  const selectedPeriod =
    periodOptions.find(item => sameMonths(item.months, analysisMonths))?.value ?? "custom";
  const changeScenario = (scenarioMode: MarketAnalysis["scenarioMode"]) => {
    setAnalysis({ scenarioMode });
    setFilter("months", []);
  };
  return (
    <DashboardLayout>
      <FilterContext.Provider value={contextValue}>
        <div className="nexus-page">
          <section
            className={
              "relative overflow-hidden rounded-[2rem] " +
              "border border-[var(--brand-violet)]/15 " +
              "bg-[radial-gradient(circle_at_82%_12%,rgba(104,36,211,.25),transparent_36%)," +
              "linear-gradient(135deg,rgba(38,18,76,.84),rgba(11,8,17,.95))] " +
              "p-5 shadow-[0_28px_100px_rgba(0,0,0,.3)] sm:p-7"
            }
          >
            <div
              className={
                "absolute right-[-4%] top-[-88%] h-80 w-80 " +
                "rounded-full border border-[var(--brand-accent)]/10"
              }
            />
            <div className="relative flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      "flex h-8 w-8 items-center justify-center rounded-xl border " +
                      "border-[var(--brand-accent)]/20 bg-[var(--brand-accent)]/10"
                    }
                  >
                    <BadgeDollarSign className="h-4 w-4 text-[var(--brand-accent)]" />
                  </span>
                  <p className="nexus-kicker">Vitru Nexus · Financeiro de Mercado</p>
                </div>
                <h1 className="nexus-heading mt-3 text-3xl font-bold text-white sm:mt-4 sm:text-4xl">
                  Capital de Mercado
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-content-tertiary sm:mt-3">
                  Do consolidado executivo à causa e ao lançamento, com Realizado e Forecast
                  visualmente separados.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
                  <span
                    className={
                      "rounded-full border border-[var(--brand-accent)]/15 " +
                      "bg-[var(--brand-accent)]/[0.07] px-3 py-1 " +
                      "text-[11px] font-semibold text-[var(--brand-accent-soft)]"
                    }
                  >
                    <Activity className="mr-1.5 inline h-3 w-3" />
                    Realizado até Jul/26
                  </span>
                  <span
                    className={
                      "rounded-full border border-[var(--brand-violet)]/15 " +
                      "bg-[var(--brand-violet)]/[0.08] px-3 py-1 " +
                      "text-[11px] font-semibold text-[var(--brand-violet-soft)]"
                    }
                  >
                    <CircleDashed className="mr-1.5 inline h-3 w-3" />
                    Forecast Ago–Dez/26
                  </span>
                  <span
                    className={
                      "rounded-full border border-emerald-400/15 " +
                      "bg-emerald-400/[0.07] px-3 py-1 text-[11px] font-semibold text-emerald-300"
                    }
                  >
                    <ShieldCheck className="mr-1.5 inline h-3 w-3" />
                    {context.data?.load
                      ? `${Number(context.data.load.validRows).toLocaleString("pt-BR")} fatos governados`
                      : "Validando carga"}
                  </span>
                </div>
              </div>
              <div
                className={
                  "hidden rounded-2xl border border-white/[0.07] " +
                  "bg-black/20 px-4 py-3 backdrop-blur sm:block"
                }
              >
                <p className="text-[11px] font-bold uppercase tracking-[.16em] text-content-tertiary">
                  Fonte oficial ativa
                </p>
                <p className="mt-1 max-w-[280px] truncate text-xs font-semibold text-content-secondary">
                  {context.data?.load?.sourceFileName ?? "Nenhuma carga ativa"}
                </p>
                <p className="mt-1 text-[11px] text-content-tertiary">
                  Hash validado · carga somente leitura
                </p>
              </div>
            </div>
          </section>
          <nav
            ref={navigationRef}
            className={
              "mt-4 flex gap-1 overflow-x-auto rounded-2xl " +
              "border border-white/[0.06] bg-white/[0.02] p-1.5"
            }
            aria-label="Navegação do Financeiro de Mercado"
          >
            {navigation.map(item => {
              const active =
                item.path === "/finance" ? location === item.path : location.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  aria-current={active ? "page" : undefined}
                  onClick={() => navigate(`${item.path}${window.location.search}`)}
                  className={
                    "flex shrink-0 items-center gap-2 rounded-xl px-3.5 " +
                    "py-2.5 text-[11px] font-semibold transition-colors " +
                    (active
                      ? "bg-[var(--brand-accent)] text-[var(--ink-strong)]"
                      : "text-content-tertiary hover:bg-white/[0.05] hover:text-white")
                  }
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <section className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.018] p-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                  <span className="text-[11px] font-bold uppercase tracking-[.15em] text-content-tertiary">
                    Contexto analítico
                  </span>
                  {activeCount > 0 && (
                    <span
                      className={
                        "rounded-full bg-[var(--brand-accent)] " +
                        "px-1.5 py-0.5 text-[11px] font-bold text-black"
                      }
                    >
                      {activeCount}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1">
                  {(
                    [
                      { key: "actual", label: "Realizado" },
                      { key: "forecast", label: "Forecast" },
                      { key: "outlook", label: "Outlook" },
                    ] as const
                  ).map(item => (
                    <button
                      key={item.key}
                      onClick={() => changeScenario(item.key)}
                      className={
                        "rounded-lg px-3 py-2 text-[11px] font-semibold transition " +
                        (analysis.scenarioMode === item.key
                          ? item.key === "forecast"
                            ? "bg-[var(--brand-violet)]/20 text-[var(--brand-violet-soft)]"
                            : "bg-[var(--brand-accent)] text-[var(--ink-strong)]"
                          : "text-content-tertiary hover:text-content-secondary")
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                <MultiFilter
                  label="Marca"
                  values={options?.brands}
                  selected={filters.brands}
                  onChange={value => setFilter("brands", value)}
                />
                <MultiFilter
                  label="BU"
                  values={options?.businessUnits}
                  selected={filters.businessUnits}
                  onChange={value => setFilter("businessUnits", value)}
                />
                <MultiFilter
                  label="Modalidade"
                  values={options?.modalities}
                  selected={filters.modalities}
                  onChange={value => setFilter("modalities", value)}
                />
                <MultiFilter
                  label="Produto"
                  values={options?.products}
                  selected={filters.products}
                  onChange={value => setFilter("products", value)}
                />
                <MultiFilter
                  label="Categoria"
                  values={options?.categories}
                  selected={filters.categories}
                  onChange={value => setFilter("categories", value)}
                />
                <button
                  onClick={() => setAdvanced(!advanced)}
                  className={
                    "flex h-9 items-center justify-center gap-2 " +
                    "rounded-md border px-3 text-[11px] font-semibold transition " +
                    (advanced
                      ? "border-[var(--brand-accent)]/20 " +
                        "bg-[var(--brand-accent)]/[0.07] text-[var(--brand-accent-soft)]"
                      : "border-white/[0.07] bg-black/20 text-content-tertiary hover:text-white")
                  }
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Mais filtros
                </button>
              </div>
              {advanced && (
                <div className="grid gap-2 border-t border-white/[0.055] pt-3 md:grid-cols-3">
                  <MultiFilter
                    label="Conta contábil"
                    values={options?.accountOptions ?? options?.accounts}
                    selected={filters.accounts}
                    onChange={value => setFilter("accounts", value)}
                  />
                  <MultiFilter
                    label="Centro de custo"
                    values={options?.costCenterOptions ?? options?.costCenters}
                    selected={filters.costCenters}
                    onChange={value => setFilter("costCenters", value)}
                  />
                  <MultiFilter
                    label="Tipo de lançamento"
                    values={options?.entryTypes}
                    selected={filters.entryTypes}
                    onChange={value => setFilter("entryTypes", value)}
                  />
                </div>
              )}
              <div
                className={
                  "flex flex-col gap-3 border-t border-white/[0.055] " +
                  "pt-3 xl:flex-row xl:items-center"
                }
              >
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-3.5 w-3.5 text-[var(--brand-accent)]" />
                  <span className="text-[11px] font-bold uppercase tracking-[.14em] text-content-tertiary">
                    Período
                  </span>
                </div>
                <Select
                  value={selectedPeriod}
                  onValueChange={value => {
                    const option = periodOptions.find(item => item.value === value);
                    if (option) setFilter("months", option.months.slice() as number[]);
                  }}
                >
                  <SelectTrigger className="h-9 border-white/[0.07] bg-black/20 text-[11px] xl:w-[170px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(item => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                    {selectedPeriod === "custom" && (
                      <SelectItem value="custom">Personalizado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <div className="flex gap-1 overflow-x-auto pb-1 xl:flex-1 xl:pb-0">
                  {monthNames.map((month, index) => {
                    const active = analysisMonths.includes(index + 1);
                    return (
                      <button
                        key={month}
                        onClick={() => {
                          const monthNumber = index + 1;
                          const next = active
                            ? analysisMonths.filter(item => item !== monthNumber)
                            : [...analysisMonths, monthNumber].sort((a, b) => a - b);
                          if (next.length) setFilter("months", next);
                        }}
                        className={
                          "h-8 min-w-10 rounded-lg border px-2 text-[11px] font-semibold transition " +
                          (active
                            ? "border-[var(--brand-accent)]/20 " +
                              "bg-[var(--brand-accent)]/10 text-[var(--brand-accent-soft)]"
                            : "border-white/[0.06] bg-white/[0.02] text-content-tertiary")
                        }
                      >
                        {month}
                      </button>
                    );
                  })}
                </div>
                <Select
                  value={analysis.grain}
                  onValueChange={(value: MarketAnalysis["grain"]) => setAnalysis({ grain: value })}
                >
                  <SelectTrigger className="h-9 border-white/[0.07] bg-black/20 text-[11px] xl:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Por mês</SelectItem>
                    <SelectItem value="quarter">Por trimestre</SelectItem>
                    <SelectItem value="semester">Por semestre</SelectItem>
                  </SelectContent>
                </Select>
                {activeCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-9 shrink-0 text-[11px] text-content-tertiary hover:text-white"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </section>
          <div className="mt-5">{children}</div>
        </div>
      </FilterContext.Provider>
    </DashboardLayout>
  );
}
function MultiFilter({
  label,
  values = [],
  selected,
  onChange,
}: {
  label: string;
  values?: unknown[];
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const normalized = values.map(item =>
    typeof item === "object" && item !== null && "value" in item
      ? {
          value: String((item as any).value),
          label: String((item as any).label ?? (item as any).value),
        }
      : { value: String(item), label: String(item) }
  );
  const visible = normalized
    .filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 120);
  const summary =
    selected.length === 0
      ? `${label}: todos`
      : selected.length === 1
        ? selected[0]
        : `${label}: ${selected.length} selecionados`;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={
            "flex h-9 min-w-0 items-center justify-between gap-2 " +
            "rounded-md border px-3 text-left text-[11px] transition " +
            (selected.length
              ? "border-[var(--brand-accent)]/16 " +
                "bg-[var(--brand-accent)]/[0.055] text-[var(--brand-accent-soft)]"
              : "border-white/[0.07] bg-black/20 text-content-tertiary")
          }
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={
          "w-[300px] border-white/10 bg-[var(--surface-1)]/98 " +
          "p-3 text-white shadow-2xl backdrop-blur-xl"
        }
      >
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-content-tertiary" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={`Buscar ${label.toLowerCase()}`}
            className="h-9 border-white/10 bg-black/20 pl-9 text-xs"
          />
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-content-tertiary">
            {selected.length} selecionado(s)
          </span>
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-[11px] font-semibold text-[var(--brand-accent-soft)]"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="mt-2 max-h-64 space-y-0.5 overflow-auto">
          {visible.map(option => {
            const checked = selected.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() =>
                  onChange(
                    checked
                      ? selected.filter(item => item !== option.value)
                      : [...selected, option.value]
                  )
                }
                className={
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left " +
                  "text-[11px] text-content-tertiary hover:bg-white/[0.05] hover:text-white"
                }
              >
                <Checkbox
                  checked={checked}
                  className={
                    "border-white/20 data-[state=checked]:border-[var(--brand-accent)] " +
                    "data-[state=checked]:bg-[var(--brand-accent)] data-[state=checked]:text-black"
                  }
                />
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {checked && <Check className="h-3 w-3 text-[var(--brand-accent)]" />}
              </button>
            );
          })}
          {!visible.length && (
            <p className="py-6 text-center text-[11px] text-content-tertiary">
              Nenhum valor encontrado.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
