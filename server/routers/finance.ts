import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { z } from "zod";
import {
  areas,
  companies,
  decisions,
  financeActualEntries,
  financeAllocationDestinations,
  financeAllocationEntries,
  financeAllocationRules,
  financeAllocationRuns,
  financeBatchApprovals,
  financeBudgetLines,
  financeCommitments,
  financeCycles,
  financeDimensions,
  financeForecastLines,
  financeImportBatches,
  financeImportErrors,
  financeImportStagingRows,
  financeMappingRules,
  financeUserScopes,
  financeVersions,
  modalities,
  projects,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import { storagePut } from "../storage";
import {
  buildFinanceAlerts,
  buildFinanceComposition,
  calculateFinanceKpis,
} from "../services/financeCalculations";
import {
  createFinanceTemplate,
  hashBuffer,
  loadDefinitions,
  MAX_FINANCE_FILE_BYTES,
  parseFinanceFile,
  validateFinanceRows,
  type FinanceLoadType,
  type ParsedRow,
} from "../services/financeImport";

const nullableId = z.number().int().positive().nullable().optional();
const financeContextBase = z.object({
  cycleId: nullableId,
  cutoffPeriod: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .nullable()
    .optional(),
});
const financeContextSchema = financeContextBase.default({});
const loadTypeSchema = z.enum([
  "budget",
  "actual",
  "commitment",
  "forecast",
  "allocation",
  "dimension",
]);
const batchIdSchema = z.object({ batchId: z.number().int().positive() });
const dimensionTypeSchema = z.enum([
  "brand",
  "business_unit",
  "product",
  "cost_center",
  "accounting_account",
  "management_account",
  "nature",
  "pillar",
  "channel",
  "initiative",
  "campaign",
  "vendor",
  "contract",
]);
const comparisonDimensionSchema = z.enum([
  "company",
  "brand",
  "business_unit",
  "modality",
  "product",
  "area",
  "pillar",
  "channel",
  "project",
  "initiative",
  "owner",
  "vendor",
]);
const dimensionSchema = z.object({
  id: nullableId,
  dimensionType: dimensionTypeSchema,
  code: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform(value => value.toUpperCase()),
  name: z.string().trim().min(2).max(200),
  parentId: nullableId,
  companyId: nullableId,
  areaId: nullableId,
  modalityId: nullableId,
  projectId: nullableId,
  ownerUserId: nullableId,
  externalCode: z.string().trim().max(160).nullable().optional(),
  taxId: z.string().trim().max(30).nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

function numberValue(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function assertFinance(
  user: Parameters<typeof assertPermission>[0],
  permission = "finance.view"
) {
  await assertPermission(user, permission);
}

async function getFinanceScope(user: { id: number; role: string }) {
  if (user.role === "admin")
    return {
      unrestricted: true,
      companyIds: [] as number[],
      areaIds: [] as number[],
      ownerOnly: false,
    };
  const db = await requireDb();
  const scopes = await db
    .select()
    .from(financeUserScopes)
    .where(eq(financeUserScopes.userId, user.id));
  const isAdmin = scopes.some(
    item => item.accessLevel === "admin" || (item.scopeType === "all" && item.scopeId === null)
  );
  return {
    unrestricted: isAdmin,
    companyIds: scopes
      .filter(item => item.scopeType === "company" && item.scopeId)
      .map(item => item.scopeId as number),
    areaIds: scopes
      .filter(item => item.scopeType === "area" && item.scopeId)
      .map(item => item.scopeId as number),
    ownerOnly: !isAdmin && !scopes.some(item => ["company", "area"].includes(item.scopeType)),
  };
}

function scopedWhere<T extends { companyId: any; areaId: any; ownerUserId: any }>(
  table: T,
  scope: Awaited<ReturnType<typeof getFinanceScope>>,
  userId: number
) {
  if (scope.unrestricted) return undefined;
  const rules = [];
  if (scope.companyIds.length) rules.push(inArray(table.companyId, scope.companyIds));
  if (scope.areaIds.length) rules.push(inArray(table.areaId, scope.areaIds));
  if (scope.ownerOnly || rules.length === 0) rules.push(eq(table.ownerUserId, userId));
  return or(...rules);
}

async function activeFinanceContext(cycleId?: number | null) {
  const db = await requireDb();
  const [cycle] = cycleId
    ? await db.select().from(financeCycles).where(eq(financeCycles.id, cycleId)).limit(1)
    : await db
        .select()
        .from(financeCycles)
        .orderBy(
          sql`FIELD(${financeCycles.status}, 'open', 'planned', 'closed', 'archived')`,
          desc(financeCycles.fiscalYear)
        )
        .limit(1);
  if (!cycle) return { cycle: null, budgetVersion: null, forecastVersion: null, versions: [] };
  const versions = await db
    .select()
    .from(financeVersions)
    .where(eq(financeVersions.cycleId, cycle.id))
    .orderBy(desc(financeVersions.versionNumber));
  const approved = versions.filter(item => ["approved", "locked"].includes(item.status));
  const budgetVersion =
    approved.find(item => item.versionType === "budget_revision") ??
    approved.find(item => item.versionType === "budget_original") ??
    null;
  const forecastVersion = approved.find(item => item.versionType === "forecast") ?? null;
  return { cycle, budgetVersion, forecastVersion, versions };
}

async function sumAmount(table: any, amountColumn: any, where: any) {
  const db = await requireDb();
  const [result] = await db
    .select({ total: sql<string>`coalesce(sum(${amountColumn}), 0)` })
    .from(table)
    .where(where);
  return numberValue(result?.total) ?? 0;
}

async function cockpit(
  user: { id: number; role: string },
  input: z.infer<typeof financeContextSchema> & {
    compositionDimension?: z.infer<typeof comparisonDimensionSchema>;
  }
) {
  const db = await requireDb();
  const context = await activeFinanceContext(input.cycleId);
  const compositionDimension = input.compositionDimension ?? "company";
  if (!context.cycle) {
    const kpis = calculateFinanceKpis({
      revisedBudget: null,
      revisedBudgetYtd: null,
      actualYtd: null,
      priorYearActualYtd: null,
      openCommitments: null,
      closingForecast: null,
      closedMonths: 0,
    });
    return {
      context,
      hasData: false,
      kpis,
      monthly: [],
      dataQuality: { batches: 0, committedBatches: 0, errors: 0 },
      alerts: buildFinanceAlerts({
        kpis,
        dataQuality: { errors: 0 },
        hasBudgetVersion: false,
        hasForecastVersion: false,
      }),
      compositionDimension,
      composition: [],
      decisions: [],
    };
  }
  const cutoff =
    input.cutoffPeriod ??
    `${context.cycle.fiscalYear}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const scope = await getFinanceScope(user);
  const budgetScope = scopedWhere(financeBudgetLines, scope, user.id);
  const actualScope = scopedWhere(financeActualEntries, scope, user.id);
  const commitmentScope = scopedWhere(financeCommitments, scope, user.id);
  const forecastScope = scopedWhere(financeForecastLines, scope, user.id);
  const budgetBase = context.budgetVersion
    ? and(
        eq(financeBudgetLines.versionId, context.budgetVersion.id),
        eq(financeBudgetLines.isActive, true),
        budgetScope
      )
    : undefined;
  const actualBase = and(
    eq(financeActualEntries.cycleId, context.cycle.id),
    eq(financeActualEntries.isActive, true),
    lte(financeActualEntries.period, cutoff),
    actualScope
  );
  const commitmentBase = and(
    eq(financeCommitments.cycleId, context.cycle.id),
    eq(financeCommitments.isActive, true),
    inArray(financeCommitments.commitmentStatus, ["open", "partially_realized", "overdue"]),
    commitmentScope
  );
  const forecastBase = context.forecastVersion
    ? and(
        eq(financeForecastLines.versionId, context.forecastVersion.id),
        eq(financeForecastLines.isActive, true),
        forecastScope
      )
    : undefined;
  const [budget, budgetYtd, actual, commitments, forecast, batchStats, errorCount] =
    await Promise.all([
      budgetBase
        ? sumAmount(financeBudgetLines, financeBudgetLines.budgetAmount, budgetBase)
        : Promise.resolve(null),
      budgetBase
        ? sumAmount(
            financeBudgetLines,
            financeBudgetLines.budgetAmount,
            and(budgetBase, lte(financeBudgetLines.period, cutoff))
          )
        : Promise.resolve(null),
      sumAmount(financeActualEntries, financeActualEntries.actualAmount, actualBase),
      sumAmount(financeCommitments, financeCommitments.openAmount, commitmentBase),
      forecastBase
        ? sumAmount(financeForecastLines, financeForecastLines.forecastAmount, forecastBase)
        : Promise.resolve(null),
      db
        .select({ status: financeImportBatches.status, count: sql<number>`count(*)` })
        .from(financeImportBatches)
        .where(eq(financeImportBatches.cycleId, context.cycle.id))
        .groupBy(financeImportBatches.status),
      db
        .select({ count: sql<number>`count(*)` })
        .from(financeImportErrors)
        .innerJoin(financeImportBatches, eq(financeImportBatches.id, financeImportErrors.batchId))
        .where(eq(financeImportBatches.cycleId, context.cycle.id)),
    ]);
  const closedMonths = Math.max(0, Math.min(12, Number(cutoff.slice(5, 7))));
  const kpis = calculateFinanceKpis({
    revisedBudget: budget,
    revisedBudgetYtd: budgetYtd,
    actualYtd: actual,
    priorYearActualYtd: null,
    openCommitments: commitments,
    closingForecast: forecast,
    closedMonths,
  });
  const hasData = [budget, actual, commitments, forecast].some(
    value => value !== null && value !== 0
  );
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    period: `${context.cycle!.fiscalYear}-${String(index + 1).padStart(2, "0")}`,
    budget: null as number | null,
    actual: null as number | null,
    commitment: null as number | null,
    forecast: null as number | null,
  }));
  const loadMonthly = async (
    table: any,
    amountColumn: any,
    base: any,
    key: "budget" | "actual" | "commitment" | "forecast"
  ) => {
    if (!base) return;
    const rows = await db
      .select({ period: table.period, total: sql<string>`sum(${amountColumn})` })
      .from(table)
      .where(base)
      .groupBy(table.period)
      .orderBy(asc(table.period));
    rows.forEach((row: any) => {
      const target = monthly.find(item => item.period === row.period);
      if (target) target[key] = numberValue(row.total);
    });
  };
  await Promise.all([
    loadMonthly(financeBudgetLines, financeBudgetLines.budgetAmount, budgetBase, "budget"),
    loadMonthly(
      financeActualEntries,
      financeActualEntries.actualAmount,
      and(
        eq(financeActualEntries.cycleId, context.cycle.id),
        eq(financeActualEntries.isActive, true),
        actualScope
      ),
      "actual"
    ),
    loadMonthly(financeCommitments, financeCommitments.openAmount, commitmentBase, "commitment"),
    loadMonthly(
      financeForecastLines,
      financeForecastLines.forecastAmount,
      forecastBase,
      "forecast"
    ),
  ]);
  const dataQuality = {
    batches: batchStats.reduce((sum, item) => sum + Number(item.count), 0),
    committedBatches: Number(batchStats.find(item => item.status === "committed")?.count ?? 0),
    errors: Number(errorCount[0]?.count ?? 0),
  };
  const compositionField =
    compositionDimension === "company"
      ? financeActualEntries.companyId
      : compositionDimension === "brand"
        ? financeActualEntries.brandId
        : compositionDimension === "business_unit"
          ? financeActualEntries.businessUnitId
          : compositionDimension === "modality"
            ? financeActualEntries.modalityId
            : compositionDimension === "product"
              ? financeActualEntries.productId
              : compositionDimension === "area"
                ? financeActualEntries.areaId
                : compositionDimension === "pillar"
                  ? financeActualEntries.pillarId
                  : compositionDimension === "channel"
                    ? financeActualEntries.channelId
                    : compositionDimension === "project"
                      ? financeActualEntries.projectId
                      : compositionDimension === "initiative"
                        ? financeActualEntries.initiativeId
                        : compositionDimension === "owner"
                          ? financeActualEntries.ownerUserId
                          : financeActualEntries.vendorId;
  const compositionRows = await db
    .select({
      dimensionId: compositionField,
      total: sql<string>`sum(${financeActualEntries.actualAmount})`,
    })
    .from(financeActualEntries)
    .where(actualBase)
    .groupBy(compositionField);
  const compositionIds = compositionRows
    .map(item => item.dimensionId)
    .filter((id): id is number => id !== null);
  const compositionLabels = new Map<number, string>();
  if (compositionIds.length && compositionDimension === "company")
    (
      await db
        .select({ id: companies.id, label: companies.shortName })
        .from(companies)
        .where(inArray(companies.id, compositionIds))
    ).forEach(item => compositionLabels.set(item.id, item.label));
  else if (compositionIds.length && compositionDimension === "area")
    (
      await db
        .select({ id: areas.id, label: areas.name })
        .from(areas)
        .where(inArray(areas.id, compositionIds))
    ).forEach(item => compositionLabels.set(item.id, item.label));
  else if (compositionIds.length && compositionDimension === "modality")
    (
      await db
        .select({ id: modalities.id, label: modalities.name })
        .from(modalities)
        .where(inArray(modalities.id, compositionIds))
    ).forEach(item => compositionLabels.set(item.id, item.label));
  else if (compositionIds.length && compositionDimension === "project")
    (
      await db
        .select({ id: projects.id, label: projects.name })
        .from(projects)
        .where(inArray(projects.id, compositionIds))
    ).forEach(item => compositionLabels.set(item.id, item.label));
  else if (compositionIds.length && compositionDimension === "owner")
    (
      await db
        .select({ id: users.id, label: users.name })
        .from(users)
        .where(inArray(users.id, compositionIds))
    ).forEach(item => compositionLabels.set(item.id, item.label ?? `Usuário ${item.id}`));
  else if (compositionIds.length)
    (
      await db
        .select({ id: financeDimensions.id, label: financeDimensions.name })
        .from(financeDimensions)
        .where(inArray(financeDimensions.id, compositionIds))
    ).forEach(item => compositionLabels.set(item.id, item.label));
  const composition = buildFinanceComposition(
    compositionRows
      .filter(item => item.dimensionId !== null)
      .map(item => ({
        id: item.dimensionId as number,
        label:
          compositionLabels.get(item.dimensionId as number) ??
          `Não classificado ${item.dimensionId}`,
        amount: numberValue(item.total) ?? 0,
      }))
  ).map(item => ({
    dimensionId: item.id,
    label: item.label,
    amount: item.amount,
    share: item.share,
  }));
  const linkedProjectId = context.cycle.linkedProjectId;
  const pendingDecisions = linkedProjectId
    ? await db
        .select({
          id: decisions.id,
          title: decisions.title,
          context: decisions.context,
          dueDate: decisions.dueDate,
          ownerId: decisions.ownerId,
          ownerName: users.name,
          status: decisions.status,
        })
        .from(decisions)
        .leftJoin(users, eq(users.id, decisions.ownerId))
        .where(and(eq(decisions.projectId, linkedProjectId), eq(decisions.status, "pending")))
        .orderBy(asc(decisions.dueDate))
        .limit(6)
    : [];
  const alerts = buildFinanceAlerts({
    kpis,
    dataQuality,
    hasBudgetVersion: Boolean(context.budgetVersion),
    hasForecastVersion: Boolean(context.forecastVersion),
  });
  return {
    context: { ...context, cutoffPeriod: cutoff },
    hasData,
    kpis,
    monthly,
    dataQuality,
    alerts,
    compositionDimension,
    composition,
    decisions: pendingDecisions,
  };
}

async function resolveStagingRows(batchId: number) {
  const db = await requireDb();
  const [batch] = await db
    .select()
    .from(financeImportBatches)
    .where(eq(financeImportBatches.id, batchId))
    .limit(1);
  if (!batch)
    throw new TRPCError({ code: "NOT_FOUND", message: "Lote financeiro não encontrado." });
  await db.delete(financeImportErrors).where(eq(financeImportErrors.batchId, batchId));
  const rows = await db
    .select()
    .from(financeImportStagingRows)
    .where(eq(financeImportStagingRows.batchId, batchId))
    .orderBy(asc(financeImportStagingRows.rowNumber));
  const rawRows = rows.map(row => row.rawData as ParsedRow);
  const headers = Array.from(
    new Set(rawRows.flatMap(row => Object.keys(row).map(field => field.trim().toLowerCase())))
  );
  const structural = validateFinanceRows(rawRows, headers, batch.loadType as FinanceLoadType);
  const structuralBlockingRows = new Set(
    structural.issues
      .filter(issue => issue.severity === "blocking" && issue.rowNumber > 1)
      .map(issue => issue.rowNumber)
  );
  const hasHeaderBlock = structural.issues.some(
    issue => issue.severity === "blocking" && issue.rowNumber === 1
  );
  const [
    companyRows,
    areaRows,
    modalityRows,
    projectRows,
    userRows,
    dimensionRows,
    versionRows,
    mappingRows,
  ] = await Promise.all([
    db.select().from(companies),
    db.select().from(areas),
    db.select().from(modalities),
    db.select().from(projects),
    db.select().from(users),
    db.select().from(financeDimensions),
    db.select().from(financeVersions),
    db
      .select()
      .from(financeMappingRules)
      .where(
        and(
          eq(financeMappingRules.sourceSystem, batch.sourceSystem),
          eq(financeMappingRules.status, "active")
        )
      ),
  ]);
  const key = (value: unknown) =>
    String(value ?? "")
      .trim()
      .toLowerCase();
  const companyMap = new Map(
    companyRows.flatMap(item => [
      [key(item.acronym), item.id],
      [key(item.shortName), item.id],
      [String(item.id), item.id],
    ])
  );
  const areaMap = new Map(
    areaRows.flatMap(item => [
      [key(item.name), item.id],
      [String(item.id), item.id],
    ])
  );
  const modalityMap = new Map(
    modalityRows.flatMap(item => [
      [key(item.name), item.id],
      [String(item.id), item.id],
    ])
  );
  const projectMap = new Map(
    projectRows.flatMap(item => [
      [key(item.code), item.id],
      [String(item.id), item.id],
    ])
  );
  const userMap = new Map(
    userRows.flatMap(item => [
      [key(item.email), item.id],
      [String(item.id), item.id],
    ])
  );
  const dimensionMap = new Map(
    dimensionRows.map(item => [`${item.dimensionType}:${key(item.code)}`, item.id])
  );
  const mappingMap = new Map(
    mappingRows.map(item => [
      `${item.dimensionType}:${key(item.sourceValue)}`,
      item.targetDimensionId,
    ])
  );
  const versionMap = new Map(
    versionRows.map(item => [`${item.cycleId}:${key(item.code)}`, item.id])
  );
  const issues: Array<typeof financeImportErrors.$inferInsert> = structural.issues.map(issue => ({
    batchId,
    ...issue,
    receivedValue: issue.receivedValue ?? null,
    fieldName: issue.fieldName ?? null,
    suggestedAction: issue.suggestedAction ?? null,
  }));
  const acceptedRows: Array<{
    staging: typeof financeImportStagingRows.$inferSelect;
    normalized: Record<string, unknown>;
  }> = [];
  const acceptedIds: number[] = [];
  const mappingIds: number[] = [];
  const rejectedIds: number[] = [];
  const existingSourceIds = new Set<string>();
  if (batch.mode === "append" && !["dimension", "allocation"].includes(batch.loadType)) {
    const sourceIds = Array.from(
      new Set(rawRows.map(row => String(row.source_record_id ?? "")).filter(Boolean))
    );
    for (let index = 0; index < sourceIds.length; index += 500) {
      const chunk = sourceIds.slice(index, index + 500);
      if (batch.loadType === "budget" && batch.versionId)
        (
          await db
            .select({ sourceRecordId: financeBudgetLines.sourceRecordId })
            .from(financeBudgetLines)
            .where(
              and(
                eq(financeBudgetLines.versionId, batch.versionId),
                eq(financeBudgetLines.isActive, true),
                inArray(financeBudgetLines.sourceRecordId, chunk)
              )
            )
        ).forEach(item => existingSourceIds.add(item.sourceRecordId));
      else if (batch.loadType === "actual" && batch.cycleId)
        (
          await db
            .select({ sourceRecordId: financeActualEntries.sourceRecordId })
            .from(financeActualEntries)
            .where(
              and(
                eq(financeActualEntries.cycleId, batch.cycleId),
                eq(financeActualEntries.isActive, true),
                inArray(financeActualEntries.sourceRecordId, chunk)
              )
            )
        ).forEach(item => existingSourceIds.add(item.sourceRecordId));
      else if (batch.loadType === "commitment" && batch.cycleId)
        (
          await db
            .select({ sourceRecordId: financeCommitments.sourceRecordId })
            .from(financeCommitments)
            .where(
              and(
                eq(financeCommitments.cycleId, batch.cycleId),
                eq(financeCommitments.isActive, true),
                inArray(financeCommitments.sourceRecordId, chunk)
              )
            )
        ).forEach(item => existingSourceIds.add(item.sourceRecordId));
      else if (batch.loadType === "forecast" && batch.versionId)
        (
          await db
            .select({ sourceRecordId: financeForecastLines.sourceRecordId })
            .from(financeForecastLines)
            .where(
              and(
                eq(financeForecastLines.versionId, batch.versionId),
                eq(financeForecastLines.isActive, true),
                inArray(financeForecastLines.sourceRecordId, chunk)
              )
            )
        ).forEach(item => existingSourceIds.add(item.sourceRecordId));
    }
  }
  let accepted = 0;
  let rejected = 0;
  let totalAmount = 0;
  for (const row of rows) {
    const raw = row.rawData as ParsedRow;
    const sourceRecordId = String(raw.source_record_id ?? "");
    if (
      hasHeaderBlock ||
      structuralBlockingRows.has(row.rowNumber) ||
      existingSourceIds.has(sourceRecordId)
    ) {
      rejected += 1;
      if (existingSourceIds.has(sourceRecordId))
        issues.push({
          batchId,
          stagingRowId: row.id,
          rowNumber: row.rowNumber,
          fieldName: "source_record_id",
          errorCode: "B_DUPLICATE_PERSISTED",
          severity: "blocking",
          receivedValue: sourceRecordId,
          message: "Identificador já existe em um registro ativo deste ciclo ou versão.",
          suggestedAction: "Use substituição de escopo ou corrija o identificador da origem.",
        });
      rejectedIds.push(row.id);
      continue;
    }
    if (batch.loadType === "dimension") {
      accepted += 1;
      continue;
    }
    if (batch.loadType === "allocation") {
      const destinationDimensionId =
        dimensionMap.get(`${key(raw.destination_type)}:${key(raw.destination_code)}`) ??
        mappingMap.get(`${key(raw.destination_type)}:${key(raw.destination_code)}`);
      if (!destinationDimensionId) {
        rejected += 1;
        issues.push({
          batchId,
          stagingRowId: row.id,
          rowNumber: row.rowNumber,
          fieldName: "destination_code",
          errorCode: "D_DIMENSION_NOT_FOUND",
          severity: "blocking",
          receivedValue: String(raw.destination_code ?? ""),
          message: "Destino de rateio não encontrado no cadastro financeiro.",
          suggestedAction: "Crie o cadastro ou corrija o código de destino.",
        });
        mappingIds.push(row.id);
      } else {
        accepted += 1;
        totalAmount += Number(raw.allocated_amount ?? 0);
        const normalized = { ...raw, destinationDimensionId };
        acceptedRows.push({ staging: row, normalized });
        acceptedIds.push(row.id);
      }
      continue;
    }
    const missing: Array<[string, unknown]> = [];
    const companyId = companyMap.get(key(raw.company_code));
    if (!companyId) missing.push(["company_code", raw.company_code]);
    const areaId = areaMap.get(key(raw.area_code));
    if (!areaId) missing.push(["area_code", raw.area_code]);
    const ownerUserId = userMap.get(key(raw.owner_email));
    if (!ownerUserId) missing.push(["owner_email", raw.owner_email]);
    const dim = (type: string, field: string, required = false) => {
      const value = raw[field];
      if (!value && !required) return null;
      const id =
        dimensionMap.get(`${type}:${key(value)}`) ?? mappingMap.get(`${type}:${key(value)}`);
      if (!id && required) missing.push([field, value]);
      return id ?? null;
    };
    const normalized = {
      ...raw,
      companyId,
      areaId,
      ownerUserId,
      modalityId: raw.modality_code ? (modalityMap.get(key(raw.modality_code)) ?? null) : null,
      projectId: raw.project_code ? (projectMap.get(key(raw.project_code)) ?? null) : null,
      brandId: dim("brand", "brand_code"),
      businessUnitId: dim("business_unit", "business_unit_code"),
      productId: dim("product", "product_code"),
      costCenterId: dim("cost_center", "cost_center_code", true),
      accountingAccountId: dim("accounting_account", "accounting_account_code"),
      managementAccountId: dim("management_account", "management_account_code", true),
      natureId: dim("nature", "nature_code", true),
      pillarId: dim("pillar", "pillar_code"),
      channelId: dim("channel", "channel_code"),
      initiativeId: dim("initiative", "initiative_code"),
      campaignId: dim("campaign", "campaign_code"),
      vendorId: dim("vendor", "vendor_code"),
      contractId: dim("contract", "contract_code"),
      versionId:
        raw.version_code && batch.cycleId
          ? (versionMap.get(`${batch.cycleId}:${key(raw.version_code)}`) ?? null)
          : null,
    };
    if (["budget", "forecast"].includes(batch.loadType) && !normalized.versionId)
      missing.push(["version_code", raw.version_code]);
    if (missing.length) {
      rejected += 1;
      missing.forEach(([field, value]) =>
        issues.push({
          batchId,
          stagingRowId: row.id,
          rowNumber: row.rowNumber,
          fieldName: field,
          errorCode: field === "owner_email" ? "D_OWNER_NOT_FOUND" : "D_DIMENSION_NOT_FOUND",
          severity: "blocking",
          receivedValue: String(value ?? ""),
          message: `Valor não encontrado no cadastro: ${field}.`,
          suggestedAction: "Mapeie o valor ou crie o cadastro antes da aprovação.",
        })
      );
      mappingIds.push(row.id);
    } else {
      accepted += 1;
      totalAmount += Number(raw.amount ?? raw.allocated_amount ?? 0);
      acceptedRows.push({ staging: row, normalized });
      acceptedIds.push(row.id);
    }
  }
  const updateStatus = async (
    ids: number[],
    status: "accepted" | "mapping_required" | "rejected"
  ) => {
    for (let index = 0; index < ids.length; index += 500)
      await db
        .update(financeImportStagingRows)
        .set({ status })
        .where(inArray(financeImportStagingRows.id, ids.slice(index, index + 500)));
  };
  await Promise.all([
    updateStatus(acceptedIds, "accepted"),
    updateStatus(mappingIds, "mapping_required"),
    updateStatus(rejectedIds, "rejected"),
  ]);
  if (issues.length) await db.insert(financeImportErrors).values(issues);
  const hasStructuralErrors = issues.some(
    issue =>
      issue.severity === "blocking" &&
      (String(issue.errorCode).startsWith("F_") || String(issue.errorCode).startsWith("B_"))
  );
  const status =
    rejected > 0 || hasHeaderBlock
      ? hasStructuralErrors
        ? "validation_failed"
        : "mapping_required"
      : "ready_for_review";
  await db
    .update(financeImportBatches)
    .set({
      status,
      acceptedCount: accepted,
      rejectedCount: rejected,
      totalAmount: String(totalAmount),
      addedAmount: String(totalAmount),
      variationAmount: String(totalAmount),
    })
    .where(eq(financeImportBatches.id, batchId));
  return { batch, accepted, rejected, totalAmount, status, acceptedRows };
}

function factBase(row: any, batch: typeof financeImportBatches.$inferSelect) {
  return {
    cycleId: batch.cycleId!,
    batchId: batch.id,
    sourceRecordId: String(row.source_record_id),
    businessKeyHash: createHash("sha256").update(JSON.stringify(row)).digest("hex"),
    fiscalYear: Number(row.fiscal_year),
    period: String(row.period),
    currency: String(row.currency ?? "BRL"),
    companyId: row.companyId,
    areaId: row.areaId,
    modalityId: row.modalityId,
    projectId: row.projectId,
    ownerUserId: row.ownerUserId,
    brandId: row.brandId,
    businessUnitId: row.businessUnitId,
    productId: row.productId,
    costCenterId: row.costCenterId,
    accountingAccountId: row.accountingAccountId,
    managementAccountId: row.managementAccountId,
    natureId: row.natureId,
    pillarId: row.pillarId,
    channelId: row.channelId,
    initiativeId: row.initiativeId,
    campaignId: row.campaignId,
    vendorId: row.vendorId,
    contractId: row.contractId,
    ownershipType: row.ownership_type,
    description: row.description ? String(row.description) : null,
    sourceNote: row.source_note ? String(row.source_note) : null,
  } as const;
}

async function commitBatch(batchId: number, userId: number) {
  const db = await requireDb();
  const [pendingBatch] = await db
    .select({ status: financeImportBatches.status })
    .from(financeImportBatches)
    .where(eq(financeImportBatches.id, batchId))
    .limit(1);
  if (!pendingBatch) throw new TRPCError({ code: "NOT_FOUND", message: "Lote não encontrado." });
  if (pendingBatch.status !== "approval_pending")
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "O lote precisa estar aguardando aprovação.",
    });
  const validation = await resolveStagingRows(batchId);
  if (validation.rejected > 0)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "O lote possui valores sem cadastro ou mapeamento.",
    });
  const [batch] = await db
    .select()
    .from(financeImportBatches)
    .where(eq(financeImportBatches.id, batchId))
    .limit(1);
  if (!batch) throw new TRPCError({ code: "NOT_FOUND", message: "Lote não encontrado." });
  const rows = validation.acceptedRows;
  const normalizedRows = rows.map(row => row.normalized as any);
  const periods = Array.from(
    new Set(
      normalizedRows.map(row => String(row.period)).filter(value => value && value !== "undefined")
    )
  );
  const companyIds = Array.from(
    new Set(
      normalizedRows
        .map(row => Number(row.companyId))
        .filter(value => Number.isFinite(value) && value > 0)
    )
  );
  const addedAmount = normalizedRows.reduce(
    (sum: number, row: any) =>
      sum + Number(row.amount ?? row.open_amount ?? row.allocated_amount ?? 0),
    0
  );
  let previousAmount = 0;
  await db.transaction(async tx => {
    if (
      batch.mode === "replace_scope" &&
      batch.loadType !== "dimension" &&
      batch.loadType !== "allocation" &&
      periods.length &&
      companyIds.length
    ) {
      if (batch.loadType === "budget" && batch.versionId) {
        const [total] = await tx
          .select({ value: sql<string>`sum(${financeBudgetLines.budgetAmount})` })
          .from(financeBudgetLines)
          .where(
            and(
              eq(financeBudgetLines.versionId, batch.versionId),
              eq(financeBudgetLines.isActive, true),
              inArray(financeBudgetLines.period, periods),
              inArray(financeBudgetLines.companyId, companyIds)
            )
          );
        previousAmount = numberValue(total?.value) ?? 0;
        await tx
          .update(financeBudgetLines)
          .set({ isActive: false, deactivatedByBatchId: batch.id })
          .where(
            and(
              eq(financeBudgetLines.versionId, batch.versionId),
              eq(financeBudgetLines.isActive, true),
              inArray(financeBudgetLines.period, periods),
              inArray(financeBudgetLines.companyId, companyIds)
            )
          );
      } else if (batch.loadType === "actual") {
        const [total] = await tx
          .select({ value: sql<string>`sum(${financeActualEntries.actualAmount})` })
          .from(financeActualEntries)
          .where(
            and(
              eq(financeActualEntries.cycleId, batch.cycleId!),
              eq(financeActualEntries.isActive, true),
              inArray(financeActualEntries.period, periods),
              inArray(financeActualEntries.companyId, companyIds)
            )
          );
        previousAmount = numberValue(total?.value) ?? 0;
        await tx
          .update(financeActualEntries)
          .set({ isActive: false, deactivatedByBatchId: batch.id })
          .where(
            and(
              eq(financeActualEntries.cycleId, batch.cycleId!),
              eq(financeActualEntries.isActive, true),
              inArray(financeActualEntries.period, periods),
              inArray(financeActualEntries.companyId, companyIds)
            )
          );
      } else if (batch.loadType === "commitment") {
        const [total] = await tx
          .select({ value: sql<string>`sum(${financeCommitments.openAmount})` })
          .from(financeCommitments)
          .where(
            and(
              eq(financeCommitments.cycleId, batch.cycleId!),
              eq(financeCommitments.isActive, true),
              inArray(financeCommitments.period, periods),
              inArray(financeCommitments.companyId, companyIds)
            )
          );
        previousAmount = numberValue(total?.value) ?? 0;
        await tx
          .update(financeCommitments)
          .set({ isActive: false, deactivatedByBatchId: batch.id })
          .where(
            and(
              eq(financeCommitments.cycleId, batch.cycleId!),
              eq(financeCommitments.isActive, true),
              inArray(financeCommitments.period, periods),
              inArray(financeCommitments.companyId, companyIds)
            )
          );
      } else if (batch.loadType === "forecast" && batch.versionId) {
        const [total] = await tx
          .select({ value: sql<string>`sum(${financeForecastLines.forecastAmount})` })
          .from(financeForecastLines)
          .where(
            and(
              eq(financeForecastLines.versionId, batch.versionId),
              eq(financeForecastLines.isActive, true),
              inArray(financeForecastLines.period, periods),
              inArray(financeForecastLines.companyId, companyIds)
            )
          );
        previousAmount = numberValue(total?.value) ?? 0;
        await tx
          .update(financeForecastLines)
          .set({ isActive: false, deactivatedByBatchId: batch.id })
          .where(
            and(
              eq(financeForecastLines.versionId, batch.versionId),
              eq(financeForecastLines.isActive, true),
              inArray(financeForecastLines.period, periods),
              inArray(financeForecastLines.companyId, companyIds)
            )
          );
      }
    }
    if (batch.loadType === "dimension") {
      for (const staging of rows) {
        const row = staging.normalized as any;
        await tx
          .insert(financeDimensions)
          .values({
            dimensionType: String(row.dimension_type),
            code: String(row.code).toUpperCase(),
            name: String(row.name),
            status: String(row.status).toLowerCase() === "inactive" ? "inactive" : "active",
            externalCode: row.external_code ? String(row.external_code) : null,
            taxId: row.tax_id ? String(row.tax_id) : null,
            createdBy: userId,
          })
          .onDuplicateKeyUpdate({
            set: {
              name: String(row.name),
              status: String(row.status).toLowerCase() === "inactive" ? "inactive" : "active",
              externalCode: row.external_code ? String(row.external_code) : null,
              taxId: row.tax_id ? String(row.tax_id) : null,
            },
          });
      }
    } else if (batch.loadType === "budget") {
      for (let index = 0; index < normalizedRows.length; index += 500)
        await tx.insert(financeBudgetLines).values(
          normalizedRows.slice(index, index + 500).map(row => ({
            ...factBase(row, batch),
            versionId: row.versionId,
            budgetAmount: String(row.amount),
            justification: row.justification ? String(row.justification) : null,
          }))
        );
    } else if (batch.loadType === "actual") {
      for (let index = 0; index < normalizedRows.length; index += 500)
        await tx.insert(financeActualEntries).values(
          normalizedRows.slice(index, index + 500).map(row => ({
            ...factBase(row, batch),
            postingDate: row.posting_date ? new Date(row.posting_date) : null,
            documentNumber: row.document_number ? String(row.document_number) : null,
            lineNumber: row.line_number ? String(row.line_number) : null,
            actualAmount: String(row.amount),
          }))
        );
    } else if (batch.loadType === "commitment") {
      for (let index = 0; index < normalizedRows.length; index += 500)
        await tx.insert(financeCommitments).values(
          normalizedRows.slice(index, index + 500).map(row => ({
            ...factBase(row, batch),
            commitmentType: String(row.commitment_type),
            commitmentDate: row.commitment_date ? new Date(row.commitment_date) : null,
            expectedDate: row.expected_date ? new Date(row.expected_date) : null,
            documentNumber: row.document_number ? String(row.document_number) : null,
            originalAmount: String(row.original_amount ?? row.amount),
            realizedAmount: String(row.realized_amount ?? 0),
            openAmount: String(row.open_amount),
            commitmentStatus: row.commitment_status ?? "open",
          }))
        );
    } else if (batch.loadType === "forecast") {
      for (let index = 0; index < normalizedRows.length; index += 500)
        await tx.insert(financeForecastLines).values(
          normalizedRows.slice(index, index + 500).map(row => ({
            ...factBase(row, batch),
            versionId: row.versionId,
            forecastAmount: String(row.amount),
            assumptionNote: row.assumption_note ? String(row.assumption_note) : null,
          }))
        );
    } else if (batch.loadType === "allocation") {
      if (!batch.cycleId)
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Lotes de rateio exigem um ciclo financeiro.",
        });
      const ruleIds = new Map<string, number>();
      const executionGroups = new Map<string, Array<any>>();
      for (const staging of rows) {
        const row = staging.normalized as any;
        const ruleCode = String(row.rule_code).toUpperCase();
        let ruleId = ruleIds.get(ruleCode);
        if (!ruleId) {
          const [existing] = await tx
            .select({ id: financeAllocationRules.id })
            .from(financeAllocationRules)
            .where(
              and(
                eq(financeAllocationRules.cycleId, batch.cycleId),
                eq(financeAllocationRules.code, ruleCode)
              )
            )
            .limit(1);
          if (existing) ruleId = existing.id;
          else {
            const [created] = await tx
              .insert(financeAllocationRules)
              .values({
                cycleId: batch.cycleId,
                code: ruleCode,
                name: ruleCode,
                criteriaType: row.driver_value ? "loaded_driver" : "fixed_percent",
                sourceDimensionType: String(row.source_fact_type),
                status: "active",
                createdBy: userId,
              })
              .$returningId();
            ruleId = created.id;
          }
          ruleIds.set(ruleCode, ruleId);
        }
        await tx
          .insert(financeAllocationDestinations)
          .values({
            ruleId,
            destinationType: String(row.destination_type),
            destinationDimensionId: row.destinationDimensionId,
            driverValue:
              row.driver_value !== null && row.driver_value !== undefined
                ? String(row.driver_value)
                : null,
            allocationPercent: String(row.allocation_percent),
          })
          .onDuplicateKeyUpdate({
            set: {
              destinationType: String(row.destination_type),
              driverValue:
                row.driver_value !== null && row.driver_value !== undefined
                  ? String(row.driver_value)
                  : null,
              allocationPercent: String(row.allocation_percent),
            },
          });
        const groupKey = `${ruleId}:${row.period}:${row.source_fact_type}:${row.source_record_id}`;
        executionGroups.set(groupKey, [
          ...(executionGroups.get(groupKey) ?? []),
          { ...row, ruleId },
        ]);
      }
      const groupedExecutions: any[][] = Array.from(executionGroups.values());
      for (let executionIndex = 0; executionIndex < groupedExecutions.length; executionIndex += 1) {
        const groupRows: any[] = groupedExecutions[executionIndex];
        const first = groupRows[0];
        const sourceType = String(first.source_fact_type);
        const sourceRecordId = String(first.source_record_id);
        let sourceFactId: number | null = null;
        if (sourceType === "budget")
          [sourceFactId] = (
            await tx
              .select({ id: financeBudgetLines.id })
              .from(financeBudgetLines)
              .where(
                and(
                  eq(financeBudgetLines.cycleId, batch.cycleId),
                  eq(financeBudgetLines.sourceRecordId, sourceRecordId),
                  eq(financeBudgetLines.isActive, true)
                )
              )
              .limit(1)
          ).map(item => item.id);
        else if (sourceType === "actual")
          [sourceFactId] = (
            await tx
              .select({ id: financeActualEntries.id })
              .from(financeActualEntries)
              .where(
                and(
                  eq(financeActualEntries.cycleId, batch.cycleId),
                  eq(financeActualEntries.sourceRecordId, sourceRecordId),
                  eq(financeActualEntries.isActive, true)
                )
              )
              .limit(1)
          ).map(item => item.id);
        else if (sourceType === "commitment")
          [sourceFactId] = (
            await tx
              .select({ id: financeCommitments.id })
              .from(financeCommitments)
              .where(
                and(
                  eq(financeCommitments.cycleId, batch.cycleId),
                  eq(financeCommitments.sourceRecordId, sourceRecordId),
                  eq(financeCommitments.isActive, true)
                )
              )
              .limit(1)
          ).map(item => item.id);
        else if (sourceType === "forecast")
          [sourceFactId] = (
            await tx
              .select({ id: financeForecastLines.id })
              .from(financeForecastLines)
              .where(
                and(
                  eq(financeForecastLines.cycleId, batch.cycleId),
                  eq(financeForecastLines.sourceRecordId, sourceRecordId),
                  eq(financeForecastLines.isActive, true)
                )
              )
              .limit(1)
          ).map(item => item.id);
        if (!sourceFactId)
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Fonte do rateio não encontrada: ${sourceType}/${sourceRecordId}.`,
          });
        const sourceAmount = Number(first.source_amount);
        const allocatedAmount = groupRows.reduce(
          (sum: number, row: any) => sum + Number(row.allocated_amount),
          0
        );
        const differenceAmount = sourceAmount - allocatedAmount;
        const [run] = await tx
          .insert(financeAllocationRuns)
          .values({
            ruleId: first.ruleId,
            cycleId: batch.cycleId,
            batchId: batch.id,
            period: String(first.period),
            status: Math.abs(differenceAmount) < 0.01 ? "committed" : "validated",
            sourceAmount: String(sourceAmount),
            allocatedAmount: String(allocatedAmount),
            differenceAmount: String(differenceAmount),
            executedBy: userId,
          })
          .$returningId();
        await tx.insert(financeAllocationEntries).values(
          groupRows.map((row: any) => ({
            runId: run.id,
            sourceFactType: sourceType,
            sourceFactId,
            destinationType: String(row.destination_type),
            destinationDimensionId: row.destinationDimensionId,
            driverValue:
              row.driver_value !== null && row.driver_value !== undefined
                ? String(row.driver_value)
                : null,
            allocationPercent: String(row.allocation_percent),
            allocatedAmount: String(row.allocated_amount),
          }))
        );
      }
    }
    await tx
      .update(financeImportBatches)
      .set({
        status: "committed",
        approvedBy: userId,
        approvedAt: new Date(),
        committedAt: new Date(),
        scope: { periods, companyIds },
        previousAmount: String(previousAmount),
        removedAmount: String(batch.mode === "replace_scope" ? previousAmount : 0),
        addedAmount: String(addedAmount),
        variationAmount: String(
          addedAmount - (batch.mode === "replace_scope" ? previousAmount : 0)
        ),
      })
      .where(eq(financeImportBatches.id, batchId));
    await tx.insert(financeBatchApprovals).values({
      batchId,
      decision: "approved",
      decidedBy: userId,
      comment: "Lote aprovado e persistido.",
    });
  });
  await recordAudit({
    actorUserId: userId,
    entityType: "finance_import_batch",
    entityId: batchId,
    action: "commit",
    summary: `Lote financeiro ${batch.fileName} aprovado e persistido.`,
    metadata: { loadType: batch.loadType, rowCount: rows.length },
  });
  return { success: true };
}

export const financeRouter = router({
  access: protectedProcedure.query(async ({ ctx }) => {
    const can = async (permission: string) => {
      try {
        await assertFinance(ctx.user, permission);
        return true;
      } catch {
        return false;
      }
    };
    const [view, importData, mapData, submit, approve, reverseBatch, manageDimensions] =
      await Promise.all([
        can("finance.view"),
        can("finance.import"),
        can("finance.map"),
        can("finance.submit"),
        can("finance.approve"),
        can("finance.reverse_batch"),
        can("finance.manage_dimensions"),
      ]);
    return {
      allowed: view,
      capabilities: { view, importData, mapData, submit, approve, reverseBatch, manageDimensions },
    };
  }),
  context: protectedProcedure.query(async ({ ctx }) => {
    await assertFinance(ctx.user);
    const db = await requireDb();
    const [
      cycles,
      versions,
      dimensions,
      usersList,
      companiesList,
      areasList,
      modalitiesList,
      projectsList,
    ] = await Promise.all([
      db.select().from(financeCycles).orderBy(desc(financeCycles.fiscalYear)),
      db.select().from(financeVersions).orderBy(desc(financeVersions.createdAt)),
      db
        .select()
        .from(financeDimensions)
        .orderBy(asc(financeDimensions.dimensionType), asc(financeDimensions.name)),
      db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.status, "active"))
        .orderBy(asc(users.name)),
      db
        .select({ id: companies.id, name: companies.shortName, code: companies.acronym })
        .from(companies)
        .where(eq(companies.status, "active")),
      db.select({ id: areas.id, name: areas.name }).from(areas).where(eq(areas.status, "active")),
      db
        .select({ id: modalities.id, name: modalities.name })
        .from(modalities)
        .where(eq(modalities.status, "active")),
      db.select({ id: projects.id, name: projects.name, code: projects.code }).from(projects),
    ]);
    return {
      cycles,
      versions,
      dimensions,
      users: usersList,
      companies: companiesList,
      areas: areasList,
      modalities: modalitiesList,
      projects: projectsList,
      linkedProject:
        projectsList.find(item => item.name === "Planejamento Orçamentário 2027") ?? null,
    };
  }),
  cockpit: protectedProcedure
    .input(
      financeContextBase
        .extend({ compositionDimension: comparisonDimensionSchema.default("company") })
        .default({ compositionDimension: "company" })
    )
    .query(async ({ ctx, input }) => {
      await assertFinance(ctx.user);
      return cockpit(ctx.user, input);
    }),
  comparison: protectedProcedure
    .input(financeContextBase.extend({ dimension: comparisonDimensionSchema.default("company") }))
    .query(async ({ ctx, input }) => {
      await assertFinance(ctx.user);
      const db = await requireDb();
      const overview = await cockpit(ctx.user, input);
      const cycleId = overview.context.cycle?.id;
      if (!cycleId) return { overview, dimension: input.dimension, rows: [] };
      const scope = await getFinanceScope(ctx.user);
      const budgetVersionId = overview.context.budgetVersion?.id;
      const forecastVersionId = overview.context.forecastVersion?.id;
      const budgetField =
        input.dimension === "company"
          ? financeBudgetLines.companyId
          : input.dimension === "brand"
            ? financeBudgetLines.brandId
            : input.dimension === "business_unit"
              ? financeBudgetLines.businessUnitId
              : input.dimension === "modality"
                ? financeBudgetLines.modalityId
                : input.dimension === "product"
                  ? financeBudgetLines.productId
                  : input.dimension === "area"
                    ? financeBudgetLines.areaId
                    : input.dimension === "pillar"
                      ? financeBudgetLines.pillarId
                      : input.dimension === "channel"
                        ? financeBudgetLines.channelId
                        : input.dimension === "project"
                          ? financeBudgetLines.projectId
                          : input.dimension === "initiative"
                            ? financeBudgetLines.initiativeId
                            : input.dimension === "owner"
                              ? financeBudgetLines.ownerUserId
                              : financeBudgetLines.vendorId;
      const actualField =
        input.dimension === "company"
          ? financeActualEntries.companyId
          : input.dimension === "brand"
            ? financeActualEntries.brandId
            : input.dimension === "business_unit"
              ? financeActualEntries.businessUnitId
              : input.dimension === "modality"
                ? financeActualEntries.modalityId
                : input.dimension === "product"
                  ? financeActualEntries.productId
                  : input.dimension === "area"
                    ? financeActualEntries.areaId
                    : input.dimension === "pillar"
                      ? financeActualEntries.pillarId
                      : input.dimension === "channel"
                        ? financeActualEntries.channelId
                        : input.dimension === "project"
                          ? financeActualEntries.projectId
                          : input.dimension === "initiative"
                            ? financeActualEntries.initiativeId
                            : input.dimension === "owner"
                              ? financeActualEntries.ownerUserId
                              : financeActualEntries.vendorId;
      const commitmentField =
        input.dimension === "company"
          ? financeCommitments.companyId
          : input.dimension === "brand"
            ? financeCommitments.brandId
            : input.dimension === "business_unit"
              ? financeCommitments.businessUnitId
              : input.dimension === "modality"
                ? financeCommitments.modalityId
                : input.dimension === "product"
                  ? financeCommitments.productId
                  : input.dimension === "area"
                    ? financeCommitments.areaId
                    : input.dimension === "pillar"
                      ? financeCommitments.pillarId
                      : input.dimension === "channel"
                        ? financeCommitments.channelId
                        : input.dimension === "project"
                          ? financeCommitments.projectId
                          : input.dimension === "initiative"
                            ? financeCommitments.initiativeId
                            : input.dimension === "owner"
                              ? financeCommitments.ownerUserId
                              : financeCommitments.vendorId;
      const forecastField =
        input.dimension === "company"
          ? financeForecastLines.companyId
          : input.dimension === "brand"
            ? financeForecastLines.brandId
            : input.dimension === "business_unit"
              ? financeForecastLines.businessUnitId
              : input.dimension === "modality"
                ? financeForecastLines.modalityId
                : input.dimension === "product"
                  ? financeForecastLines.productId
                  : input.dimension === "area"
                    ? financeForecastLines.areaId
                    : input.dimension === "pillar"
                      ? financeForecastLines.pillarId
                      : input.dimension === "channel"
                        ? financeForecastLines.channelId
                        : input.dimension === "project"
                          ? financeForecastLines.projectId
                          : input.dimension === "initiative"
                            ? financeForecastLines.initiativeId
                            : input.dimension === "owner"
                              ? financeForecastLines.ownerUserId
                              : financeForecastLines.vendorId;
      const budgetRows = budgetVersionId
        ? await db
            .select({
              id: budgetField,
              total: sql<string>`sum(${financeBudgetLines.budgetAmount})`,
            })
            .from(financeBudgetLines)
            .where(
              and(
                eq(financeBudgetLines.versionId, budgetVersionId),
                eq(financeBudgetLines.isActive, true),
                scopedWhere(financeBudgetLines, scope, ctx.user.id)
              )
            )
            .groupBy(budgetField)
        : [];
      const actualRows = await db
        .select({ id: actualField, total: sql<string>`sum(${financeActualEntries.actualAmount})` })
        .from(financeActualEntries)
        .where(
          and(
            eq(financeActualEntries.cycleId, cycleId),
            eq(financeActualEntries.isActive, true),
            input.cutoffPeriod ? lte(financeActualEntries.period, input.cutoffPeriod) : undefined,
            scopedWhere(financeActualEntries, scope, ctx.user.id)
          )
        )
        .groupBy(actualField);
      const commitmentRows = await db
        .select({ id: commitmentField, total: sql<string>`sum(${financeCommitments.openAmount})` })
        .from(financeCommitments)
        .where(
          and(
            eq(financeCommitments.cycleId, cycleId),
            eq(financeCommitments.isActive, true),
            inArray(financeCommitments.commitmentStatus, ["open", "partially_realized", "overdue"]),
            scopedWhere(financeCommitments, scope, ctx.user.id)
          )
        )
        .groupBy(commitmentField);
      const forecastRows = forecastVersionId
        ? await db
            .select({
              id: forecastField,
              total: sql<string>`sum(${financeForecastLines.forecastAmount})`,
            })
            .from(financeForecastLines)
            .where(
              and(
                eq(financeForecastLines.versionId, forecastVersionId),
                eq(financeForecastLines.isActive, true),
                scopedWhere(financeForecastLines, scope, ctx.user.id)
              )
            )
            .groupBy(forecastField)
        : [];
      const ids = Array.from(
        new Set(
          [...budgetRows, ...actualRows, ...commitmentRows, ...forecastRows]
            .map(item => item.id)
            .filter((value): value is number => value !== null)
        )
      );
      const labels = new Map<number, string>();
      if (input.dimension === "company" && ids.length)
        (
          await db
            .select({ id: companies.id, label: companies.shortName })
            .from(companies)
            .where(inArray(companies.id, ids))
        ).forEach(item => labels.set(item.id, item.label));
      else if (input.dimension === "area" && ids.length)
        (
          await db
            .select({ id: areas.id, label: areas.name })
            .from(areas)
            .where(inArray(areas.id, ids))
        ).forEach(item => labels.set(item.id, item.label));
      else if (input.dimension === "modality" && ids.length)
        (
          await db
            .select({ id: modalities.id, label: modalities.name })
            .from(modalities)
            .where(inArray(modalities.id, ids))
        ).forEach(item => labels.set(item.id, item.label));
      else if (input.dimension === "project" && ids.length)
        (
          await db
            .select({ id: projects.id, label: projects.name })
            .from(projects)
            .where(inArray(projects.id, ids))
        ).forEach(item => labels.set(item.id, item.label));
      else if (input.dimension === "owner" && ids.length)
        (
          await db
            .select({ id: users.id, label: users.name })
            .from(users)
            .where(inArray(users.id, ids))
        ).forEach(item => labels.set(item.id, item.label ?? `Usuário ${item.id}`));
      else if (ids.length)
        (
          await db
            .select({ id: financeDimensions.id, label: financeDimensions.name })
            .from(financeDimensions)
            .where(inArray(financeDimensions.id, ids))
        ).forEach(item => labels.set(item.id, item.label));
      const toMap = (rows: Array<{ id: number | null; total: string | null }>) =>
        new Map(
          rows
            .filter(item => item.id !== null)
            .map(item => [item.id as number, numberValue(item.total) ?? 0])
        );
      const budgetMap = toMap(budgetRows),
        actualMap = toMap(actualRows),
        commitmentMap = toMap(commitmentRows),
        forecastMap = toMap(forecastRows);
      const rows = ids
        .map(id => {
          const budget = budgetMap.get(id) ?? 0;
          const actual = actualMap.get(id) ?? 0;
          const commitments = commitmentMap.get(id) ?? 0;
          const forecast = forecastMap.get(id) ?? 0;
          const variance = actual - budget;
          return {
            dimensionId: id,
            label: labels.get(id) ?? `Não classificado ${id}`,
            budget,
            actual,
            commitments,
            forecast,
            available: budget - actual - commitments,
            variance,
            variancePct: budget === 0 ? null : variance / budget,
          };
        })
        .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
      return { overview, dimension: input.dimension, rows };
    }),
  facts: protectedProcedure
    .input(
      financeContextBase.extend({
        view: z.enum([
          "budget_actual",
          "commitments",
          "investments",
          "responsibility",
          "vendors",
          "allocations",
        ]),
      })
    )
    .query(async ({ ctx, input }) => {
      await assertFinance(ctx.user);
      const db = await requireDb();
      const overview = await cockpit(ctx.user, input);
      const cycleId = overview.context.cycle?.id;
      if (!cycleId) return { overview, rows: [] };
      const scope = await getFinanceScope(ctx.user);
      if (input.view === "commitments")
        return {
          overview,
          rows: await db
            .select({
              id: financeCommitments.id,
              period: financeCommitments.period,
              documentNumber: financeCommitments.documentNumber,
              status: financeCommitments.commitmentStatus,
              originalAmount: financeCommitments.originalAmount,
              realizedAmount: financeCommitments.realizedAmount,
              openAmount: financeCommitments.openAmount,
              ownerName: users.name,
            })
            .from(financeCommitments)
            .leftJoin(users, eq(users.id, financeCommitments.ownerUserId))
            .where(
              and(
                eq(financeCommitments.cycleId, cycleId),
                eq(financeCommitments.isActive, true),
                scopedWhere(financeCommitments, scope, ctx.user.id)
              )
            )
            .orderBy(desc(financeCommitments.openAmount))
            .limit(200),
        };
      if (input.view === "vendors")
        return {
          overview,
          rows: await db
            .select({
              id: financeDimensions.id,
              dimensionType: financeDimensions.dimensionType,
              code: financeDimensions.code,
              name: financeDimensions.name,
              status: financeDimensions.status,
              taxId: financeDimensions.taxId,
            })
            .from(financeDimensions)
            .where(inArray(financeDimensions.dimensionType, ["vendor", "contract"]))
            .orderBy(asc(financeDimensions.dimensionType), asc(financeDimensions.name)),
        };
      if (input.view === "allocations")
        return {
          overview,
          rows: await db
            .select({
              run: financeAllocationRuns,
              ruleCode: financeAllocationRules.code,
              ruleName: financeAllocationRules.name,
              entryCount: sql<number>`count(${financeAllocationEntries.id})`,
            })
            .from(financeAllocationRuns)
            .innerJoin(
              financeAllocationRules,
              eq(financeAllocationRules.id, financeAllocationRuns.ruleId)
            )
            .leftJoin(
              financeAllocationEntries,
              eq(financeAllocationEntries.runId, financeAllocationRuns.id)
            )
            .where(eq(financeAllocationRuns.cycleId, cycleId))
            .groupBy(
              financeAllocationRuns.id,
              financeAllocationRules.code,
              financeAllocationRules.name
            )
            .orderBy(desc(financeAllocationRuns.executedAt)),
        };
      const dimension =
        input.view === "responsibility"
          ? financeBudgetLines.ownerUserId
          : input.view === "investments"
            ? financeBudgetLines.pillarId
            : financeBudgetLines.companyId;
      const base = await db
        .select({
          dimensionId: dimension,
          budget: sql<string>`sum(${financeBudgetLines.budgetAmount})`,
        })
        .from(financeBudgetLines)
        .where(
          and(
            eq(financeBudgetLines.cycleId, cycleId),
            eq(financeBudgetLines.isActive, true),
            scopedWhere(financeBudgetLines, scope, ctx.user.id)
          )
        )
        .groupBy(dimension)
        .limit(200);
      return { overview, rows: base.map(item => ({ ...item, budget: numberValue(item.budget) })) };
    }),
  dimensions: router({
    list: protectedProcedure
      .input(z.object({ type: dimensionTypeSchema.optional() }).default({}))
      .query(async ({ ctx, input }) => {
        await assertFinance(ctx.user);
        const db = await requireDb();
        return db
          .select()
          .from(financeDimensions)
          .where(input.type ? eq(financeDimensions.dimensionType, input.type) : undefined)
          .orderBy(asc(financeDimensions.dimensionType), asc(financeDimensions.name));
      }),
    upsert: protectedProcedure.input(dimensionSchema).mutation(async ({ ctx, input }) => {
      await assertFinance(ctx.user, "finance.manage_dimensions");
      const db = await requireDb();
      const { id, ...values } = input;
      let entityId = id ?? 0;
      if (id) await db.update(financeDimensions).set(values).where(eq(financeDimensions.id, id));
      else {
        const [created] = await db
          .insert(financeDimensions)
          .values({ ...values, createdBy: ctx.user.id })
          .$returningId();
        entityId = created.id;
      }
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "finance_dimension",
        entityId,
        action: id ? "update" : "create",
        summary: `${input.dimensionType}: ${input.code} · ${input.name}`,
      });
      return { success: true, id: entityId };
    }),
  }),
  mappings: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await assertFinance(ctx.user, "finance.map");
      const db = await requireDb();
      return db
        .select({
          mapping: financeMappingRules,
          targetCode: financeDimensions.code,
          targetName: financeDimensions.name,
        })
        .from(financeMappingRules)
        .innerJoin(
          financeDimensions,
          eq(financeDimensions.id, financeMappingRules.targetDimensionId)
        )
        .orderBy(desc(financeMappingRules.createdAt));
    }),
    upsert: protectedProcedure
      .input(
        z.object({
          sourceSystem: z.string().trim().min(2).max(120),
          dimensionType: z.string().trim().min(2).max(60),
          sourceValue: z.string().trim().min(1).max(300),
          targetDimensionId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.map");
        const db = await requireDb();
        const [target] = await db
          .select()
          .from(financeDimensions)
          .where(eq(financeDimensions.id, input.targetDimensionId))
          .limit(1);
        if (!target)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Cadastro financeiro de destino não encontrado.",
          });
        if (target.dimensionType !== input.dimensionType)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "O destino não pertence ao mesmo tipo de dimensão.",
          });
        await db
          .insert(financeMappingRules)
          .values({ ...input, status: "active", createdBy: ctx.user.id })
          .onDuplicateKeyUpdate({
            set: { targetDimensionId: input.targetDimensionId, status: "active" },
          });
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_mapping_rule",
          entityId: input.targetDimensionId,
          action: "upsert",
          summary: `De-para ${input.sourceValue} → ${target.code} salvo.`,
          metadata: input,
        });
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.map");
        const db = await requireDb();
        await db
          .update(financeMappingRules)
          .set({ status: "inactive" })
          .where(eq(financeMappingRules.id, input.id));
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_mapping_rule",
          entityId: input.id,
          action: "deactivate",
          summary: "Regra de de-para desativada.",
        });
        return { success: true };
      }),
  }),
  cycles: router({
    create: protectedProcedure
      .input(
        z.object({
          fiscalYear: z.number().int().min(2020).max(2100),
          code: z.string().trim().min(2).max(40),
          name: z.string().trim().min(2).max(160),
          startPeriod: z.string().regex(/^\d{4}-\d{2}$/),
          endPeriod: z.string().regex(/^\d{4}-\d{2}$/),
          currency: z.string().length(3).default("BRL"),
          linkedProjectId: nullableId,
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.manage_dimensions");
        const db = await requireDb();
        const [created] = await db
          .insert(financeCycles)
          .values({
            ...input,
            code: input.code.toUpperCase(),
            currency: input.currency.toUpperCase(),
            createdBy: ctx.user.id,
          })
          .$returningId();
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_cycle",
          entityId: created.id,
          action: "create",
          summary: `Ciclo financeiro ${input.code.toUpperCase()} criado.`,
        });
        return { success: true, id: created.id };
      }),
    createVersion: protectedProcedure
      .input(
        z.object({
          cycleId: z.number().int().positive(),
          code: z.string().trim().min(2).max(60),
          name: z.string().trim().min(2).max(160),
          versionType: z.enum(["budget_original", "budget_revision", "forecast"]),
          effectivePeriod: z
            .string()
            .regex(/^\d{4}-\d{2}$/)
            .nullable()
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.manage_dimensions");
        const db = await requireDb();
        const [count] = await db
          .select({ value: sql<number>`count(*)` })
          .from(financeVersions)
          .where(eq(financeVersions.cycleId, input.cycleId));
        const [created] = await db
          .insert(financeVersions)
          .values({
            ...input,
            code: input.code.toUpperCase(),
            versionNumber: Number(count?.value ?? 0) + 1,
            createdBy: ctx.user.id,
          })
          .$returningId();
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_version",
          entityId: created.id,
          action: "create",
          summary: `Versão financeira ${input.code.toUpperCase()} criada.`,
        });
        return { success: true, id: created.id };
      }),
    approveVersion: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.approve");
        const db = await requireDb();
        const [version] = await db
          .select()
          .from(financeVersions)
          .where(eq(financeVersions.id, input.id))
          .limit(1);
        if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada." });
        await db
          .update(financeVersions)
          .set({ status: "approved", approvedBy: ctx.user.id, approvedAt: new Date() })
          .where(eq(financeVersions.id, input.id));
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_version",
          entityId: input.id,
          action: "approve",
          summary: `Versão financeira ${version.code} aprovada.`,
        });
        return { success: true };
      }),
  }),
  scopes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await assertFinance(ctx.user, "finance.manage_dimensions");
      const db = await requireDb();
      return db
        .select({ scope: financeUserScopes, userName: users.name, userEmail: users.email })
        .from(financeUserScopes)
        .innerJoin(users, eq(users.id, financeUserScopes.userId))
        .orderBy(asc(users.name), asc(financeUserScopes.scopeType));
    }),
    upsert: protectedProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          scopeType: z.enum(["all", "company", "area", "owner"]),
          scopeId: nullableId,
          accessLevel: z.enum(["view", "contribute", "approve", "admin"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.manage_dimensions");
        const db = await requireDb();
        if (input.scopeType !== "all" && !input.scopeId)
          throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione o valor do escopo." });
        await db
          .insert(financeUserScopes)
          .values({
            ...input,
            scopeId: input.scopeType === "all" ? null : input.scopeId,
            createdBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({ set: { accessLevel: input.accessLevel } });
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_user_scope",
          entityId: input.userId,
          action: "upsert",
          summary: `Escopo financeiro ${input.scopeType} atribuído.`,
          metadata: input,
        });
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.manage_dimensions");
        const db = await requireDb();
        const [scope] = await db
          .select()
          .from(financeUserScopes)
          .where(eq(financeUserScopes.id, input.id))
          .limit(1);
        await db.delete(financeUserScopes).where(eq(financeUserScopes.id, input.id));
        if (scope)
          await recordAudit({
            actorUserId: ctx.user.id,
            entityType: "finance_user_scope",
            entityId: scope.userId,
            action: "remove",
            summary: `Escopo financeiro ${scope.scopeType} removido.`,
            metadata: scope,
          });
        return { success: true };
      }),
  }),
  imports: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await assertFinance(ctx.user);
      const db = await requireDb();
      return db
        .select({
          batch: financeImportBatches,
          userName: users.name,
          cycleYear: financeCycles.fiscalYear,
          versionName: financeVersions.name,
        })
        .from(financeImportBatches)
        .leftJoin(users, eq(users.id, financeImportBatches.createdBy))
        .leftJoin(financeCycles, eq(financeCycles.id, financeImportBatches.cycleId))
        .leftJoin(financeVersions, eq(financeVersions.id, financeImportBatches.versionId))
        .orderBy(desc(financeImportBatches.createdAt))
        .limit(200);
    }),
    detail: protectedProcedure.input(batchIdSchema).query(async ({ ctx, input }) => {
      await assertFinance(ctx.user);
      const db = await requireDb();
      const [batch] = await db
        .select()
        .from(financeImportBatches)
        .where(eq(financeImportBatches.id, input.batchId))
        .limit(1);
      if (!batch) throw new TRPCError({ code: "NOT_FOUND", message: "Lote não encontrado." });
      const [rows, errors, approvals] = await Promise.all([
        db
          .select()
          .from(financeImportStagingRows)
          .where(eq(financeImportStagingRows.batchId, input.batchId))
          .orderBy(asc(financeImportStagingRows.rowNumber))
          .limit(500),
        db
          .select()
          .from(financeImportErrors)
          .where(eq(financeImportErrors.batchId, input.batchId))
          .orderBy(asc(financeImportErrors.rowNumber)),
        db
          .select()
          .from(financeBatchApprovals)
          .where(eq(financeBatchApprovals.batchId, input.batchId))
          .orderBy(desc(financeBatchApprovals.decidedAt)),
      ]);
      return { batch, rows, errors, approvals };
    }),
    template: protectedProcedure
      .input(
        z.object({ loadType: loadTypeSchema, format: z.enum(["csv", "xlsx"]).default("xlsx") })
      )
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user);
        const generated = await createFinanceTemplate(input.loadType, input.format);
        return {
          fileName: `vitru-nexus-${input.loadType}.${generated.extension}`,
          mimeType: generated.mimeType,
          base64: generated.buffer.toString("base64"),
        };
      }),
    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string().min(1).max(500),
          mimeType: z.string().max(180),
          base64: z.string().min(1),
          loadType: loadTypeSchema,
          mode: z.enum(["append", "replace_scope", "reversal"]).default("append"),
          sourceSystem: z.string().trim().min(2).max(120),
          cycleId: nullableId,
          versionId: nullableId,
          notes: z.string().max(5000).nullable().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.import");
        const db = await requireDb();
        if (input.mode === "reversal")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Use a ação Reverter em um lote persistido.",
          });
        const buffer = Buffer.from(input.base64, "base64");
        if (buffer.byteLength > MAX_FINANCE_FILE_BYTES)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Arquivo acima do limite de 20 MB.",
          });
        const hash = hashBuffer(buffer);
        const [duplicate] = await db
          .select({ id: financeImportBatches.id })
          .from(financeImportBatches)
          .where(
            and(
              eq(financeImportBatches.fileHash, hash),
              eq(financeImportBatches.loadType, input.loadType)
            )
          )
          .limit(1);
        if (duplicate)
          throw new TRPCError({
            code: "CONFLICT",
            message: `Arquivo já enviado no lote #${duplicate.id}.`,
          });
        let parsed;
        try {
          parsed = await parseFinanceFile(
            buffer,
            input.fileName,
            input.loadType as FinanceLoadType
          );
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Arquivo inválido.",
          });
        }
        if (parsed.rows.length > 100_000)
          throw new TRPCError({
            code: "PAYLOAD_TOO_LARGE",
            message: "Arquivo acima do limite de 100 mil linhas do MVP.",
          });
        const validation = validateFinanceRows(
          parsed.rows,
          parsed.headers,
          input.loadType as FinanceLoadType
        );
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const stored = await storagePut(
          `finance/${input.cycleId ?? "unassigned"}/${hash.slice(0, 12)}-${safeName}`,
          buffer,
          input.mimeType
        );
        const blocking = validation.issues.filter(item => item.severity === "blocking");
        const [result] = await db
          .insert(financeImportBatches)
          .values({
            cycleId: input.cycleId,
            versionId: input.versionId,
            loadType: input.loadType,
            mode: input.mode,
            status: blocking.length ? "validation_failed" : "ready_for_review",
            sourceSystem: input.sourceSystem,
            fileName: input.fileName,
            fileKey: stored.key,
            fileUrl: stored.url,
            fileHash: hash,
            fileSize: buffer.byteLength,
            rowCount: validation.normalized.length,
            acceptedCount:
              validation.normalized.length - new Set(blocking.map(item => item.rowNumber)).size,
            rejectedCount: new Set(blocking.map(item => item.rowNumber)).size,
            warningCount: validation.issues.filter(item => item.severity === "warning").length,
            totalAmount: String(
              validation.normalized.reduce(
                (sum, row) =>
                  sum + Number(row.amount ?? row.open_amount ?? row.allocated_amount ?? 0),
                0
              )
            ),
            notes: input.notes,
            createdBy: ctx.user.id,
          })
          .$returningId();
        const batchId = result.id;
        const chunks: ParsedRow[][] = Array.from(
          { length: Math.ceil(validation.normalized.length / 500) },
          (_, index) => validation.normalized.slice(index * 500, index * 500 + 500)
        );
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
          const chunk = chunks[chunkIndex];
          if (chunk.length)
            await db.insert(financeImportStagingRows).values(
              chunk.map((row: ParsedRow, rowIndex: number) => {
                const status: "rejected" | "accepted" = validation.issues.some(
                  issue =>
                    issue.rowNumber === chunkIndex * 500 + rowIndex + 2 &&
                    issue.severity === "blocking"
                )
                  ? "rejected"
                  : "accepted";
                return {
                  batchId,
                  rowNumber: chunkIndex * 500 + rowIndex + 2,
                  rawData: row,
                  sourceRecordId: row.source_record_id ? String(row.source_record_id) : null,
                  businessKeyHash: createHash("sha256").update(JSON.stringify(row)).digest("hex"),
                  amount:
                    row.amount !== undefined
                      ? String(row.amount)
                      : row.open_amount !== undefined
                        ? String(row.open_amount)
                        : row.allocated_amount !== undefined
                          ? String(row.allocated_amount)
                          : null,
                  status,
                };
              })
            );
        }
        if (validation.issues.length)
          await db.insert(financeImportErrors).values(
            validation.issues.map(issue => ({
              batchId,
              ...issue,
              receivedValue: issue.receivedValue ?? null,
              fieldName: issue.fieldName ?? null,
              suggestedAction: issue.suggestedAction ?? null,
            }))
          );
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_import_batch",
          entityId: batchId,
          action: "upload",
          summary: `Lote ${input.fileName} enviado para staging.`,
          metadata: {
            loadType: input.loadType,
            rows: validation.normalized.length,
            blockingErrors: blocking.length,
          },
        });
        return {
          batchId,
          status: blocking.length ? "validation_failed" : "ready_for_review",
          rows: validation.normalized.length,
          blockingErrors: blocking.length,
        };
      }),
    validate: protectedProcedure.input(batchIdSchema).mutation(async ({ ctx, input }) => {
      await assertFinance(ctx.user, "finance.map");
      return resolveStagingRows(input.batchId);
    }),
    submit: protectedProcedure.input(batchIdSchema).mutation(async ({ ctx, input }) => {
      await assertFinance(ctx.user, "finance.submit");
      const db = await requireDb();
      const [batch] = await db
        .select()
        .from(financeImportBatches)
        .where(eq(financeImportBatches.id, input.batchId))
        .limit(1);
      if (!batch || batch.status !== "ready_for_review")
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "O lote precisa estar pronto para revisão.",
        });
      await db
        .update(financeImportBatches)
        .set({ status: "approval_pending" })
        .where(eq(financeImportBatches.id, input.batchId));
      await db
        .insert(financeBatchApprovals)
        .values({ batchId: input.batchId, decision: "submitted", decidedBy: ctx.user.id });
      return { success: true };
    }),
    approve: protectedProcedure.input(batchIdSchema).mutation(async ({ ctx, input }) => {
      await assertFinance(ctx.user, "finance.approve");
      return commitBatch(input.batchId, ctx.user.id);
    }),
    reject: protectedProcedure
      .input(batchIdSchema.extend({ comment: z.string().trim().min(3).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.approve");
        const db = await requireDb();
        const [batch] = await db
          .select()
          .from(financeImportBatches)
          .where(eq(financeImportBatches.id, input.batchId))
          .limit(1);
        if (!batch || batch.status !== "approval_pending")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Somente lotes aguardando aprovação podem ser rejeitados.",
          });
        await db
          .update(financeImportBatches)
          .set({ status: "rejected" })
          .where(eq(financeImportBatches.id, input.batchId));
        await db.insert(financeBatchApprovals).values({
          batchId: input.batchId,
          decision: "rejected",
          decidedBy: ctx.user.id,
          comment: input.comment,
        });
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_import_batch",
          entityId: input.batchId,
          action: "reject",
          summary: `Lote financeiro ${batch.fileName} rejeitado.`,
          metadata: { comment: input.comment },
        });
        return { success: true };
      }),
    reverse: protectedProcedure
      .input(batchIdSchema.extend({ comment: z.string().trim().min(3).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        await assertFinance(ctx.user, "finance.reverse_batch");
        const db = await requireDb();
        const [batch] = await db
          .select()
          .from(financeImportBatches)
          .where(eq(financeImportBatches.id, input.batchId))
          .limit(1);
        if (!batch || batch.status !== "committed")
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Somente lotes persistidos podem ser revertidos.",
          });
        await db.transaction(async tx => {
          await Promise.all([
            tx
              .update(financeBudgetLines)
              .set({ isActive: false })
              .where(eq(financeBudgetLines.batchId, input.batchId)),
            tx
              .update(financeActualEntries)
              .set({ isActive: false })
              .where(eq(financeActualEntries.batchId, input.batchId)),
            tx
              .update(financeCommitments)
              .set({ isActive: false })
              .where(eq(financeCommitments.batchId, input.batchId)),
            tx
              .update(financeForecastLines)
              .set({ isActive: false })
              .where(eq(financeForecastLines.batchId, input.batchId)),
            tx
              .update(financeBudgetLines)
              .set({ isActive: true, deactivatedByBatchId: null })
              .where(eq(financeBudgetLines.deactivatedByBatchId, input.batchId)),
            tx
              .update(financeActualEntries)
              .set({ isActive: true, deactivatedByBatchId: null })
              .where(eq(financeActualEntries.deactivatedByBatchId, input.batchId)),
            tx
              .update(financeCommitments)
              .set({ isActive: true, deactivatedByBatchId: null })
              .where(eq(financeCommitments.deactivatedByBatchId, input.batchId)),
            tx
              .update(financeForecastLines)
              .set({ isActive: true, deactivatedByBatchId: null })
              .where(eq(financeForecastLines.deactivatedByBatchId, input.batchId)),
            tx
              .update(financeAllocationRuns)
              .set({ status: "reversed" })
              .where(eq(financeAllocationRuns.batchId, input.batchId)),
          ]);
          await tx
            .update(financeImportBatches)
            .set({ status: "reversed" })
            .where(eq(financeImportBatches.id, input.batchId));
          await tx.insert(financeBatchApprovals).values({
            batchId: input.batchId,
            decision: "reversed",
            decidedBy: ctx.user.id,
            comment: input.comment,
          });
        });
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_import_batch",
          entityId: input.batchId,
          action: "reverse",
          summary: `Lote financeiro ${batch.fileName} revertido.`,
          metadata: { comment: input.comment },
        });
        return { success: true };
      }),
  }),
});
