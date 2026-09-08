import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
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

function context(): TrpcContext {
  return {
    user: {
      id: 999998,
      openId: "audit-360",
      email: "audit-360@test.local",
      name: "Audit 360",
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

describe("Auditoria 360 — invariâncias financeiras", () => {
  const caller = appRouter.createCaller(context());

  it("prova que o total é a soma das marcas no comparável realizado", async () => {
    const [overview, brands] = await Promise.all([
      caller.marketFinance.overview({ filters: emptyFilters, compositionBy: "brand" }),
      caller.marketFinance.variation({ filters: emptyFilters, by: "brand" }),
    ]);
    expect(brands.reduce((sum, item) => sum + item.real2025, 0)).toBeCloseTo(
      overview!.kpis.realJanJul25,
      2
    );
    expect(brands.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
  });

  it("prova que cada marca reconcilia com suas categorias", async () => {
    const brands = await caller.marketFinance.variation({ filters: emptyFilters, by: "brand" });
    for (const brand of brands) {
      const categories = await caller.marketFinance.variation({
        filters: { ...emptyFilters, brands: [brand.key] },
        by: "category",
      });
      expect(categories.reduce((sum, item) => sum + item.real2025, 0)).toBeCloseTo(
        brand.real2025,
        2
      );
      expect(categories.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(
        brand.real2026,
        2
      );
    }
  });

  it("prova Outlook FY26 = Realizado YTD + Forecast restante", async () => {
    const [actual, forecast, outlook] = await Promise.all([
      caller.marketFinance.overview({
        filters: emptyFilters,
        compositionBy: "brand",
        analysis: { scenarioMode: "actual", months: [1, 2, 3, 4, 5, 6, 7] },
      }),
      caller.marketFinance.overview({
        filters: emptyFilters,
        compositionBy: "brand",
        analysis: { scenarioMode: "forecast", months: [8, 9, 10, 11, 12] },
      }),
      caller.marketFinance.overview({
        filters: emptyFilters,
        compositionBy: "brand",
        analysis: { scenarioMode: "outlook", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      }),
    ]);
    expect(actual!.kpis.realJanJul26 + forecast!.kpis.realJanJul26).toBeCloseTo(
      outlook!.kpis.realJanJul26,
      2
    );
  });

  it("prova delta e delta percentual contra a base comparativa", async () => {
    const result = await caller.marketFinance.overview({
      filters: emptyFilters,
      compositionBy: "brand",
    });
    expect(result!.kpis.deltaYtd).toBeCloseTo(
      result!.kpis.realJanJul26 - result!.kpis.realJanJul25,
      2
    );
    expect(result!.kpis.yoyYtd).toBeCloseTo(result!.kpis.deltaYtd / result!.kpis.realJanJul25, 8);
  });

  it("mantém filtro combinado reconciliado entre KPI e decomposição", async () => {
    const filters = { ...emptyFilters, brands: ["Uniasselvi"], months: [1, 2, 3] };
    const [overview, categories] = await Promise.all([
      caller.marketFinance.overview({
        filters,
        compositionBy: "category",
        analysis: { scenarioMode: "actual", months: [1, 2, 3] },
      }),
      caller.marketFinance.variation({
        filters,
        by: "category",
        analysis: { scenarioMode: "actual", months: [1, 2, 3] },
      }),
    ]);
    expect(categories.reduce((sum, item) => sum + item.real2026, 0)).toBeCloseTo(
      overview!.kpis.realJanJul26,
      2
    );
  });

  it("trata filtro sem resultado sem erro ou valor fabricado", async () => {
    const filters = { ...emptyFilters, brands: ["MARCA_INEXISTENTE"] };
    const [overview, transactions] = await Promise.all([
      caller.marketFinance.overview({ filters, compositionBy: "brand" }),
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
    expect(overview!.kpis.yoyYtd).toBeNull();
    expect(transactions.total).toBe(0);
    expect(transactions.rows).toHaveLength(0);
  });
});
