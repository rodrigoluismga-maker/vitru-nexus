import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const emptyFilters = {
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

const actualMonths = [1, 2, 3, 4, 5, 6, 7];
const forecastMonths = [8, 9, 10, 11, 12];
const fullYear = [...actualMonths, ...forecastMonths];

function context(): TrpcContext {
  return {
    user: {
      id: 999997,
      openId: "real-filter-matrix",
      email: "real-filter-matrix@test.local",
      name: "Real Filter Matrix",
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function monthlySum(
  monthly: Array<{ year: number; month: number; scenario: "actual" | "forecast"; amount: number }>,
  year: number,
  scenario: "actual" | "forecast",
  months: number[]
) {
  return monthly
    .filter(item => item.year === year && item.scenario === scenario && months.includes(item.month))
    .reduce((sum, item) => sum + item.amount, 0);
}

describe("Financeiro de Mercado — matriz de filtros reais", () => {
  const caller = appRouter.createCaller(context());

  it("reconcilia Uniasselvi no Outlook anual entre KPI, meses e drivers", async () => {
    const filters = { ...emptyFilters, brands: ["Uniasselvi"] };
    const [overview, drivers] = await Promise.all([
      caller.marketFinance.overview({
        filters,
        compositionBy: "category",
        analysis: { scenarioMode: "outlook", months: fullYear },
      }),
      caller.marketFinance.variation({
        filters,
        by: "category",
        analysis: { scenarioMode: "outlook", months: fullYear },
      }),
    ]);
    const currentMonthly =
      monthlySum(overview!.monthly, 2026, "actual", actualMonths) +
      monthlySum(overview!.monthly, 2026, "forecast", forecastMonths);
    expect(overview!.kpis.realJanJul26).toBeCloseTo(currentMonthly, 2);
    expect(drivers.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(currentMonthly, 2);
    expect(overview!.kpis.outlookFY26).toBeCloseTo(currentMonthly, 2);
  });

  it("reconcilia Unicesumar no Realizado Jan–Jul entre KPI, meses e categorias", async () => {
    const filters = { ...emptyFilters, brands: ["Unicesumar"] };
    const [overview, categories] = await Promise.all([
      caller.marketFinance.overview({
        filters,
        compositionBy: "category",
        analysis: { scenarioMode: "actual", months: actualMonths },
      }),
      caller.marketFinance.variation({
        filters,
        by: "category",
        analysis: { scenarioMode: "actual", months: actualMonths },
      }),
    ]);
    expect(overview!.kpis.realJanJul25).toBeCloseTo(83_403_925.11, 2);
    expect(overview!.kpis.realJanJul26).toBeCloseTo(86_902_942.39, 2);
    expect(monthlySum(overview!.monthly, 2026, "actual", actualMonths)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
    expect(categories.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
  });

  it("aplica marca, BU e categoria oficiais como interseção, não como união", async () => {
    const filters = {
      ...emptyFilters,
      brands: ["Uniasselvi"],
      businessUnits: ["EAD Uniasselvi"],
      categories: ["Mídia On"],
    };
    const overview = await caller.marketFinance.overview({
      filters,
      compositionBy: "account",
      analysis: { scenarioMode: "actual", months: actualMonths },
    });
    const accounts = await caller.marketFinance.variation({
      filters,
      by: "account",
      analysis: { scenarioMode: "actual", months: actualMonths },
    });
    expect(overview!.kpis.realJanJul26).toBeGreaterThan(0);
    expect(accounts.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
  });

  it("reconcilia a conta contábil de maior valor com meses e drivers", async () => {
    const filters = { ...emptyFilters, accounts: ["4130301"] };
    const [overview, brands] = await Promise.all([
      caller.marketFinance.overview({
        filters,
        compositionBy: "brand",
        analysis: { scenarioMode: "actual", months: actualMonths },
      }),
      caller.marketFinance.variation({
        filters,
        by: "brand",
        analysis: { scenarioMode: "actual", months: actualMonths },
      }),
    ]);
    expect(overview!.kpis.realJanJul26).toBeCloseTo(116_946_951.76, 2);
    expect(monthlySum(overview!.monthly, 2026, "actual", actualMonths)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
    expect(brands.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
  });

  it("reconcilia o centro de custo de maior valor com meses e drivers", async () => {
    const filters = { ...emptyFilters, costCenters: ["43010303015"] };
    const [overview, categories] = await Promise.all([
      caller.marketFinance.overview({
        filters,
        compositionBy: "category",
        analysis: { scenarioMode: "actual", months: actualMonths },
      }),
      caller.marketFinance.variation({
        filters,
        by: "category",
        analysis: { scenarioMode: "actual", months: actualMonths },
      }),
    ]);
    expect(overview!.kpis.realJanJul26).toBeCloseTo(98_466_337.38, 2);
    expect(monthlySum(overview!.monthly, 2026, "actual", actualMonths)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
    expect(categories.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
  });

  it("isola Forecast Ago–Dez no KPI, meses e lançamentos", async () => {
    const [overview, transactions] = await Promise.all([
      caller.marketFinance.overview({
        filters: emptyFilters,
        compositionBy: "brand",
        analysis: { scenarioMode: "forecast", months: forecastMonths },
      }),
      caller.marketFinance.transactions({
        filters: { ...emptyFilters, months: forecastMonths },
        scenario: "forecast",
        year: 2026,
        search: "",
        page: 1,
        pageSize: 100,
      }),
    ]);
    expect(overview!.kpis.realJanJul26).toBeCloseTo(141_369_177.04, 2);
    expect(monthlySum(overview!.monthly, 2026, "forecast", forecastMonths)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
    expect(transactions.total).toBe(375);
    expect(transactions.rows.every(row => row.scenario === "forecast")).toBe(true);
  });

  it("mantém o primeiro trimestre igual nas leituras mensal e trimestral", async () => {
    const overview = await caller.marketFinance.overview({
      filters: emptyFilters,
      compositionBy: "brand",
      analysis: { scenarioMode: "actual", months: [1, 2, 3] },
    });
    expect(overview!.kpis.realJanJul25).toBeCloseTo(108_894_817.74, 2);
    expect(overview!.kpis.realJanJul26).toBeCloseTo(103_283_678.88, 2);
    expect(monthlySum(overview!.monthly, 2026, "actual", [1, 2, 3])).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
  });

  it("trata Outlook no primeiro semestre como realizado disponível, sem criar Forecast", async () => {
    const overview = await caller.marketFinance.overview({
      filters: emptyFilters,
      compositionBy: "brand",
      analysis: { scenarioMode: "outlook", months: [1, 2, 3, 4, 5, 6] },
    });
    expect(monthlySum(overview!.monthly, 2026, "forecast", [1, 2, 3, 4, 5, 6])).toBe(0);
    expect(overview!.kpis.realJanJul26).toBeCloseTo(
      monthlySum(overview!.monthly, 2026, "actual", [1, 2, 3, 4, 5, 6]),
      2
    );
  });

  it("retorna zero para dimensões oficiais sem interseção e não deixa resíduos", async () => {
    const filters = {
      ...emptyFilters,
      brands: ["Uniasselvi"],
      businessUnits: ["EAD Unicesumar"],
    };
    const [overview, variation, transactions] = await Promise.all([
      caller.marketFinance.overview({ filters, compositionBy: "category" }),
      caller.marketFinance.variation({ filters, by: "category" }),
      caller.marketFinance.transactions({
        filters,
        scenario: "actual",
        year: 2026,
        search: "",
        page: 1,
        pageSize: 20,
      }),
    ]);
    expect(overview!.kpis.realJanJul25).toBe(0);
    expect(overview!.kpis.realJanJul26).toBe(0);
    expect(overview!.monthly).toHaveLength(0);
    expect(variation).toHaveLength(0);
    expect(transactions).toEqual({ rows: [], total: 0 });
  });

  it("trata multisseleção de contas e centros de custo como união dentro da dimensão", async () => {
    const catalog = await caller.marketFinance.context();
    const accounts = catalog.filters.accounts.slice(0, 2);
    const costCenters = catalog.filters.costCenters.slice(0, 2);
    expect(accounts).toHaveLength(2);
    expect(costCenters).toHaveLength(2);

    const accountSingles = await Promise.all(
      accounts.map(account =>
        caller.marketFinance.overview({
          filters: { ...emptyFilters, accounts: [account] },
          compositionBy: "brand",
          analysis: { scenarioMode: "actual", months: actualMonths },
        })
      )
    );
    const accountCombined = await caller.marketFinance.overview({
      filters: { ...emptyFilters, accounts },
      compositionBy: "brand",
      analysis: { scenarioMode: "actual", months: actualMonths },
    });
    expect(accountCombined!.kpis.realJanJul26).toBeCloseTo(
      accountSingles.reduce((sum, item) => sum + item!.kpis.realJanJul26, 0),
      2
    );

    const costCenterSingles = await Promise.all(
      costCenters.map(costCenter =>
        caller.marketFinance.overview({
          filters: { ...emptyFilters, costCenters: [costCenter] },
          compositionBy: "brand",
          analysis: { scenarioMode: "actual", months: actualMonths },
        })
      )
    );
    const costCenterCombined = await caller.marketFinance.overview({
      filters: { ...emptyFilters, costCenters },
      compositionBy: "brand",
      analysis: { scenarioMode: "actual", months: actualMonths },
    });
    expect(costCenterCombined!.kpis.realJanJul26).toBeCloseTo(
      costCenterSingles.reduce((sum, item) => sum + item!.kpis.realJanJul26, 0),
      2
    );
  });

  it("preserva a query string ao navegar para Explorer e Lançamentos", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "client/src/pages/finance/FinanceLayout.tsx"),
      "utf8"
    );
    expect(source).toContain("navigate(`${item.path}${window.location.search}`)");
    for (const key of [
      "marca",
      "bu",
      "modalidade",
      "produto",
      "categoria",
      "conta",
      "cc",
      "mes",
      "tipo",
    ]) {
      expect(source).toContain(`"${key}"`);
    }
  });
});
