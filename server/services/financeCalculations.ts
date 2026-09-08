export type FinanceKpiInputs = {
  revisedBudget: number | null;
  revisedBudgetYtd: number | null;
  actualYtd: number | null;
  priorYearActualYtd: number | null;
  openCommitments: number | null;
  closingForecast: number | null;
  closedMonths: number;
  totalMonths?: number;
};

const safeRatio = (numerator: number | null, denominator: number | null) =>
  numerator === null || denominator === null || denominator === 0 ? null : numerator / denominator;

export function calculateFinanceKpis(input: FinanceKpiInputs) {
  const totalMonths = input.totalMonths ?? 12;
  const availableBalance =
    input.revisedBudget === null || input.actualYtd === null || input.openCommitments === null
      ? null
      : input.revisedBudget - input.actualYtd - input.openCommitments;
  const actualVariance =
    input.actualYtd === null || input.revisedBudgetYtd === null
      ? null
      : input.actualYtd - input.revisedBudgetYtd;
  const closingVariance =
    input.closingForecast === null || input.revisedBudget === null
      ? null
      : input.closingForecast - input.revisedBudget;
  const runRate =
    input.actualYtd === null || input.closedMonths <= 0
      ? null
      : input.actualYtd / input.closedMonths;
  const runRateProjection =
    runRate === null || input.actualYtd === null
      ? null
      : input.actualYtd + runRate * Math.max(totalMonths - input.closedMonths, 0);

  return {
    ...input,
    availableBalance,
    actualVariance,
    actualVariancePct: safeRatio(actualVariance, input.revisedBudgetYtd),
    closingVariance,
    consumedPct: safeRatio(input.actualYtd, input.revisedBudgetYtd),
    committedPct:
      input.actualYtd === null || input.openCommitments === null
        ? null
        : safeRatio(input.actualYtd + input.openCommitments, input.revisedBudget),
    postForecastBalance:
      input.revisedBudget === null || input.closingForecast === null
        ? null
        : input.revisedBudget - input.closingForecast,
    yoyActual:
      input.actualYtd === null || input.priorYearActualYtd === null
        ? null
        : safeRatio(input.actualYtd, input.priorYearActualYtd) === null
          ? null
          : input.actualYtd / input.priorYearActualYtd - 1,
    runRate,
    runRateProjection,
  };
}

export type FinanceAlert = {
  code: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  action: string;
};

export function buildFinanceAlerts(input: {
  kpis: ReturnType<typeof calculateFinanceKpis>;
  dataQuality: { errors: number };
  hasBudgetVersion: boolean;
  hasForecastVersion: boolean;
}) {
  const alerts: FinanceAlert[] = [];
  if (!input.hasBudgetVersion)
    alerts.push({
      code: "VERSION_BUDGET_MISSING",
      severity: "warning",
      title: "Orçamento sem versão aprovada",
      message: "O cockpit ainda não possui uma referência orçamentária vigente.",
      action: "Criar e aprovar uma versão de orçamento.",
    });
  if (!input.hasForecastVersion)
    alerts.push({
      code: "VERSION_FORECAST_MISSING",
      severity: "info",
      title: "Forecast não disponível",
      message: "A projeção de fechamento ainda não foi aprovada para o ciclo.",
      action: "Criar e aprovar a versão de forecast.",
    });
  if (input.dataQuality.errors > 0)
    alerts.push({
      code: "DATA_QUALITY_ERRORS",
      severity: "critical",
      title: "Pendências na qualidade da base",
      message: `${input.dataQuality.errors} erro(s) permanecem registrados nos lotes financeiros.`,
      action: "Revisar os lotes na Central de Dados.",
    });
  const committed = input.kpis.committedPct;
  if (committed !== null && committed >= 0.9)
    alerts.push({
      code: "COMMITMENT_PRESSURE",
      severity: "critical",
      title: "Pressão de comprometimento",
      message: `${Math.round(committed * 100)}% do orçamento já está realizado ou comprometido.`,
      action: "Revisar obrigações abertas e saldo remanescente.",
    });
  else if (committed !== null && committed >= 0.8)
    alerts.push({
      code: "COMMITMENT_PRESSURE",
      severity: "warning",
      title: "Comprometimento elevado",
      message: `${Math.round(committed * 100)}% do orçamento já está realizado ou comprometido.`,
      action: "Monitorar compromissos e novas solicitações.",
    });
  const variance = input.kpis.actualVariancePct;
  if (variance !== null && variance > 0.1)
    alerts.push({
      code: "ACTUAL_OVER_BUDGET",
      severity: "critical",
      title: "Realizado acima do orçamento YTD",
      message: `O desvio desfavorável atingiu ${Math.round(variance * 100)}% no acumulado.`,
      action: "Abrir análise por dimensão e definir contramedidas.",
    });
  else if (variance !== null && variance > 0.05)
    alerts.push({
      code: "ACTUAL_OVER_BUDGET",
      severity: "warning",
      title: "Desvio desfavorável no realizado",
      message: `O realizado está ${Math.round(variance * 100)}% acima do orçamento YTD.`,
      action: "Validar concentração e tendência do desvio.",
    });
  if (input.kpis.postForecastBalance !== null && input.kpis.postForecastBalance < 0)
    alerts.push({
      code: "FORECAST_DEFICIT",
      severity: "critical",
      title: "Forecast excede o orçamento",
      message: "A projeção de fechamento indica saldo pós-forecast negativo.",
      action: "Deliberar revisão, contingência ou realocação.",
    });
  return alerts;
}

export function buildFinanceComposition(
  rows: Array<{ id: number; label: string; amount: number }>
) {
  const total = rows.reduce((sum, item) => sum + item.amount, 0);
  return rows
    .map(item => ({ ...item, share: total === 0 ? null : item.amount / total }))
    .sort((a, b) => b.amount - a.amount);
}

export function calculateAllocationReconciliation(
  sourceAmount: number,
  entries: Array<{ percent: number; amount: number }>
) {
  const allocatedAmount = entries.reduce((sum, item) => sum + item.amount, 0);
  const percentTotal = entries.reduce((sum, item) => sum + item.percent, 0);
  return {
    sourceAmount,
    allocatedAmount,
    differenceAmount: sourceAmount - allocatedAmount,
    percentTotal,
    isBalanced:
      Math.abs(sourceAmount - allocatedAmount) < 0.01 && Math.abs(percentTotal - 1) < 0.000001,
  };
}
