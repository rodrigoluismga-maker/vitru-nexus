import { describe, expect, it } from "vitest";
import {
  buildFinanceAlerts,
  buildFinanceComposition,
  calculateAllocationReconciliation,
  calculateFinanceKpis,
} from "./services/financeCalculations";
import ExcelJS from "exceljs";
import {
  createFinanceTemplate,
  parseFinanceFile,
  validateFinanceRows,
} from "./services/financeImport";

describe("finance calculations", () => {
  it("calculates the approved executive formulas", () => {
    const result = calculateFinanceKpis({
      revisedBudget: 1_000,
      revisedBudgetYtd: 500,
      actualYtd: 450,
      priorYearActualYtd: 400,
      openCommitments: 100,
      closingForecast: 1_050,
      closedMonths: 6,
    });

    expect(result.availableBalance).toBe(450);
    expect(result.actualVariance).toBe(-50);
    expect(result.actualVariancePct).toBe(-0.1);
    expect(result.closingVariance).toBe(50);
    expect(result.consumedPct).toBe(0.9);
    expect(result.committedPct).toBe(0.55);
    expect(result.postForecastBalance).toBe(-50);
    expect(result.yoyActual).toBe(0.125);
    expect(result.runRate).toBe(75);
    expect(result.runRateProjection).toBe(900);
  });

  it("returns null ratios when denominators are zero or unavailable", () => {
    const result = calculateFinanceKpis({
      revisedBudget: 0,
      revisedBudgetYtd: 0,
      actualYtd: null,
      priorYearActualYtd: 0,
      openCommitments: null,
      closingForecast: null,
      closedMonths: 0,
    });

    expect(result.actualVariancePct).toBeNull();
    expect(result.consumedPct).toBeNull();
    expect(result.committedPct).toBeNull();
    expect(result.yoyActual).toBeNull();
    expect(result.runRate).toBeNull();
    expect(result.runRateProjection).toBeNull();
  });

  it("reconciles balanced and unbalanced allocations", () => {
    expect(
      calculateAllocationReconciliation(100, [
        { percent: 0.4, amount: 40 },
        { percent: 0.6, amount: 60 },
      ])
    ).toMatchObject({
      allocatedAmount: 100,
      differenceAmount: 0,
      percentTotal: 1,
      isBalanced: true,
    });

    expect(
      calculateAllocationReconciliation(100, [
        { percent: 0.4, amount: 40 },
        { percent: 0.5, amount: 50 },
      ])
    ).toMatchObject({
      allocatedAmount: 90,
      differenceAmount: 10,
      percentTotal: 0.9,
      isBalanced: false,
    });
  });

  it("derives actionable alerts from versions, data quality and financial pressure", () => {
    const kpis = calculateFinanceKpis({
      revisedBudget: 1_000,
      revisedBudgetYtd: 500,
      actualYtd: 570,
      priorYearActualYtd: null,
      openCommitments: 350,
      closingForecast: 1_100,
      closedMonths: 6,
    });
    const alerts = buildFinanceAlerts({
      kpis,
      dataQuality: { errors: 2 },
      hasBudgetVersion: true,
      hasForecastVersion: true,
    });
    expect(alerts.map(item => item.code)).toEqual(
      expect.arrayContaining([
        "DATA_QUALITY_ERRORS",
        "COMMITMENT_PRESSURE",
        "ACTUAL_OVER_BUDGET",
        "FORECAST_DEFICIT",
      ])
    );
    expect(alerts.every(item => item.action.length > 0)).toBe(true);
  });

  it("signals missing versions without fabricating financial values", () => {
    const kpis = calculateFinanceKpis({
      revisedBudget: null,
      revisedBudgetYtd: null,
      actualYtd: null,
      priorYearActualYtd: null,
      openCommitments: null,
      closingForecast: null,
      closedMonths: 0,
    });
    expect(
      buildFinanceAlerts({
        kpis,
        dataQuality: { errors: 0 },
        hasBudgetVersion: false,
        hasForecastVersion: false,
      }).map(item => item.code)
    ).toEqual(["VERSION_BUDGET_MISSING", "VERSION_FORECAST_MISSING"]);
  });

  it("calculates and orders the real composition without fabricating categories", () => {
    expect(
      buildFinanceComposition([
        { id: 1, label: "A", amount: 25 },
        { id: 2, label: "B", amount: 75 },
      ])
    ).toEqual([
      { id: 2, label: "B", amount: 75, share: 0.75 },
      { id: 1, label: "A", amount: 25, share: 0.25 },
    ]);
    expect(buildFinanceComposition([{ id: 1, label: "A", amount: 0 }])[0]?.share).toBeNull();
  });
});

describe("finance imports", () => {
  it("generates empty official templates for every supported load type", async () => {
    const types = [
      "budget",
      "actual",
      "commitment",
      "forecast",
      "allocation",
      "dimension",
    ] as const;
    for (const loadType of types) {
      const csv = await createFinanceTemplate(loadType, "csv");
      const xlsx = await createFinanceTemplate(loadType, "xlsx");
      expect(csv.buffer.byteLength).toBeGreaterThan(10);
      expect(csv.buffer.toString("utf8").trim().split("\n")).toHaveLength(1);
      expect(xlsx.buffer.byteLength).toBeGreaterThan(1_000);
      expect(xlsx.extension).toBe("xlsx");
    }
  });

  it("parses equivalent valid rows from CSV and XLSX", async () => {
    const row = {
      source_record_id: "ROW-1",
      fiscal_year: 2027,
      period: "2027-01",
      currency: "BRL",
      company_code: "VITRU",
      area_code: "FIN",
      cost_center_code: "CC",
      management_account_code: "MG",
      nature_code: "NAT",
      ownership_type: "HOUSE",
      owner_email: "owner@example.com",
      amount: 100,
      source_note: "Teste",
      version_code: "V1",
    };
    const headers = Object.keys(row);
    const csvBuffer = Buffer.from(`${headers.join(",")}\n${Object.values(row).join(",")}`, "utf8");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("ORCAMENTO");
    worksheet.addRow(headers);
    worksheet.addRow(Object.values(row));
    const xlsxBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const parsedCsv = await parseFinanceFile(csvBuffer, "finance.csv", "budget");
    const parsedXlsx = await parseFinanceFile(xlsxBuffer, "finance.xlsx", "budget");
    expect(parsedCsv.rows).toHaveLength(1);
    expect(parsedXlsx.rows).toHaveLength(1);
    expect(validateFinanceRows(parsedCsv.rows, parsedCsv.headers, "budget").issues).toHaveLength(0);
    expect(validateFinanceRows(parsedXlsx.rows, parsedXlsx.headers, "budget").issues).toHaveLength(
      0
    );
  });

  it("blocks invalid financial rows and invalid allocation percentages", () => {
    const budget = validateFinanceRows(
      [
        {
          source_record_id: "A",
          fiscal_year: 2027,
          period: "01/2027",
          currency: "BRL",
          company_code: "VITRU",
          area_code: "FIN",
          cost_center_code: "CC",
          management_account_code: "MG",
          nature_code: "NAT",
          ownership_type: "OTHER",
          owner_email: "owner@example.com",
          amount: "x",
          version_code: "V1",
        },
      ],
      [
        "source_record_id",
        "fiscal_year",
        "period",
        "currency",
        "company_code",
        "area_code",
        "cost_center_code",
        "management_account_code",
        "nature_code",
        "ownership_type",
        "owner_email",
        "amount",
        "source_note",
        "version_code",
      ],
      "budget"
    );
    expect(budget.issues.map(issue => issue.errorCode)).toEqual(
      expect.arrayContaining(["F_INVALID_PERIOD", "F_INVALID_ENUM", "F_INVALID_NUMBER"])
    );

    const allocation = validateFinanceRows(
      [
        {
          rule_code: "R1",
          allocation_type: "house",
          period: "2027-01",
          source_fact_type: "actual",
          source_record_id: "A",
          source_amount: 100,
          destination_type: "area",
          destination_code: "FIN",
          allocation_percent: 1.2,
          allocated_amount: 100,
        },
      ],
      [
        "rule_code",
        "allocation_type",
        "period",
        "source_fact_type",
        "source_record_id",
        "source_amount",
        "destination_type",
        "destination_code",
        "allocation_percent",
        "allocated_amount",
      ],
      "allocation"
    );
    expect(allocation.issues.some(issue => issue.errorCode === "F_INVALID_PERCENT")).toBe(true);
  });
});
