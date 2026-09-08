import { describe, expect, it } from "vitest";
import { aggregateTemporal, type MonthlyPoint } from "./FinanceMarketUtils";
import fs from "node:fs";
import path from "node:path";

const months: MonthlyPoint[] = Array.from({ length: 12 }, (_, index) => ({
  month: String(index + 1),
  monthNumber: index + 1,
  real25: 100,
  real26: index < 7 ? 110 : null,
  forecast26: index >= 7 ? 120 : null,
}));

describe("Finance Market UI", () => {
  it("mantém Realizado e Forecast separados no Outlook mensal", () => {
    const points = aggregateTemporal(months, "month", "outlook", [1, 12]);
    expect(points).toHaveLength(12);
    expect(points[0]).toMatchObject({ actual: 110, forecast: null, current: 110 });
    expect(points[11]).toMatchObject({ actual: null, forecast: 120, current: 120 });
  });

  it("reconcilia a granularidade trimestral sem preencher meses ausentes", () => {
    const points = aggregateTemporal(months, "quarter", "outlook", [1, 2, 3]);
    expect(points[0].current).toBe(330);
    expect(points[3].current).toBe(360);
  });

  it("não leva Forecast para o cenário Realizado", () => {
    const points = aggregateTemporal(months, "month", "actual", [1, 2, 3, 4, 5, 6, 7]);
    expect(points[6].current).toBe(110);
    expect(points[7].current).toBeNull();
    expect(points[7].forecast).toBe(120);
  });

  it("abre a Visão Executiva em Outlook e mantém tabela mensal auditável", () => {
    const root = process.cwd();
    const layout = fs.readFileSync(
      path.join(root, "client/src/pages/finance/FinanceLayout.tsx"),
      "utf8"
    );
    const table = fs.readFileSync(
      path.join(root, "client/src/pages/finance/FinanceMarketOverviewTables.tsx"),
      "utf8"
    );
    expect(layout).toContain('scenarioMode: "outlook"');
    for (const column of [
      "Real 2025",
      "Realizado 2026",
      "Forecast 2026",
      "Outlook 2026",
      "Delta",
      "YoY",
      "Cenário 2026",
    ]) {
      expect(table).toContain(column);
    }
  });

  it("limita a tabela ao cenário e período e explicita zero resultado", () => {
    const root = process.cwd();
    const overview = fs.readFileSync(
      path.join(root, "client/src/pages/finance/FinanceMarketOverview.tsx"),
      "utf8"
    );
    const table = fs.readFileSync(
      path.join(root, "client/src/pages/finance/FinanceMarketOverviewTables.tsx"),
      "utf8"
    );
    expect(overview).toContain("analysisMonths.includes(row.monthNumber)");
    expect(overview).toContain('analysis.scenarioMode === "forecast" ? null : row.real26');
    expect(overview).toContain('analysis.scenarioMode === "actual" ? null : row.forecast26');
    expect(table).toContain("Nenhum mês possui fatos");
    expect(table).toContain("Nenhum driver encontrado");
  });

  it("mostra na legenda apenas as séries permitidas pelo cenário", () => {
    const overview = fs.readFileSync(
      path.join(process.cwd(), "client/src/pages/finance/FinanceMarketOverview.tsx"),
      "utf8"
    );
    expect(overview).toContain('analysis.scenarioMode === "actual" &&');
    expect(overview).toContain('analysis.scenarioMode === "forecast" &&');
    expect(overview).toContain('analysis.scenarioMode === "outlook" &&');
  });
});
