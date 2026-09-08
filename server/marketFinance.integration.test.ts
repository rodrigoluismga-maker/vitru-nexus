import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { describe, expect, it } from "vitest";

const filters = {
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
      id: 999999,
      openId: "market-finance-test",
      email: "market-finance@test.local",
      name: "Market Finance Test",
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

describe("marketFinance V1 oficial", () => {
  const caller = appRouter.createCaller(context());

  it("reconcilia os quatro totais executivos oficiais sem misturar cenários", async () => {
    const result = await caller.marketFinance.overview({ filters, compositionBy: "brand" });
    expect(result).not.toBeNull();
    expect(result!.kpis.realJanJul25).toBeCloseTo(195_309_704.02, 2);
    expect(result!.kpis.realJanJul26).toBeCloseTo(197_798_500.48, 2);
    expect(result!.kpis.forecastRemaining26).toBeCloseTo(141_369_177.04, 2);
    expect(result!.kpis.outlookFY26).toBeCloseTo(339_167_677.52, 2);
    expect(result!.kpis.deltaYtd).toBeCloseTo(2_488_796.46, 2);
    expect(result!.kpis.realJanJul26Transactions).toBe(11_696);
    expect(result!.movement.increases - result!.movement.reductions).toBeCloseTo(
      result!.kpis.deltaYtd,
      2
    );
  });

  it("mantém Forecast exclusivamente entre agosto e dezembro de 2026", async () => {
    const result = await caller.marketFinance.overview({ filters, compositionBy: "category" });
    const forecast = result!.monthly.filter(item => item.scenario === "forecast");
    expect(forecast).toHaveLength(5);
    expect(forecast.every(item => item.year === 2026 && item.month >= 8 && item.month <= 12)).toBe(
      true
    );
    expect(
      result!.monthly
        .filter(item => item.scenario === "actual" && item.year === 2026)
        .every(item => item.month <= 7)
    ).toBe(true);
  });

  it("reconcilia a soma dos drivers por marca com o delta macro", async () => {
    const [overview, variation] = await Promise.all([
      caller.marketFinance.overview({ filters, compositionBy: "brand" }),
      caller.marketFinance.variation({ filters, by: "brand" }),
    ]);
    expect(variation.reduce((sum, item) => sum + item.delta, 0)).toBeCloseTo(
      overview!.kpis.deltaYtd,
      2
    );
    expect(variation.reduce((sum, item) => sum + (item.movementShare ?? 0), 0)).toBeCloseTo(1, 8);
    expect(variation.reduce((sum, item) => sum + (item.shareReal2026 ?? 0), 0)).toBeCloseTo(1, 8);
  });

  it("permite janelas equivalentes por semestre e bloqueia YoY realizado incompleto", async () => {
    const firstSemester = await caller.marketFinance.overview({
      filters,
      compositionBy: "brand",
      analysis: { scenarioMode: "actual", months: [1, 2, 3, 4, 5, 6] },
    });
    const fullYearActual = await caller.marketFinance.overview({
      filters,
      compositionBy: "brand",
      analysis: { scenarioMode: "actual", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    });
    expect(firstSemester!.analysis.comparisonValid).toBe(true);
    expect(firstSemester!.kpis.yoyYtd).not.toBeNull();
    expect(fullYearActual!.analysis.comparisonValid).toBe(false);
    expect(fullYearActual!.kpis.yoyYtd).toBeNull();
  });

  it("isola Forecast e reconcilia Outlook anual contra Real FY25", async () => {
    const forecast = await caller.marketFinance.overview({
      filters,
      compositionBy: "brand",
      analysis: { scenarioMode: "forecast", months: [8, 9, 10, 11, 12] },
    });
    const outlook = await caller.marketFinance.overview({
      filters,
      compositionBy: "brand",
      analysis: { scenarioMode: "outlook", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    });
    expect(forecast!.analysis.comparisonValid).toBe(false);
    expect(forecast!.kpis.realJanJul26).toBeCloseTo(141_369_177.04, 2);
    expect(forecast!.kpis.realJanJul26Transactions).toBe(375);
    expect(forecast!.kpis.yoyYtd).toBeNull();
    expect(outlook!.analysis.comparisonValid).toBe(true);
    expect(outlook!.kpis.realJanJul25).toBeCloseTo(314_834_184.2, 2);
    expect(outlook!.kpis.realJanJul26).toBeCloseTo(339_167_677.52, 2);
    expect(outlook!.kpis.deltaYtd).toBeCloseTo(24_333_493.32, 2);
  });

  it("expõe somente lançamentos Forecast quando o cenário é selecionado", async () => {
    const result = await caller.marketFinance.transactions({
      filters,
      scenario: "forecast",
      year: 2026,
      search: "",
      page: 1,
      pageSize: 100,
    });
    expect(result.total).toBe(375);
    expect(
      result.rows.every(item => item.scenario === "forecast" && item.period >= "2026-08")
    ).toBe(true);
    expect(result.rows.every(item => item.sourceExcelRow > 1)).toBe(true);
  });

  it("preserva rejeições e possíveis duplicidades como qualidade visível", async () => {
    const result = await caller.marketFinance.quality();
    expect(result!.load.rejectedRows).toBe(7);
    expect(result!.stats.duplicate).toBe(9);
    expect(result!.issues).toHaveLength(16);
  });
});
