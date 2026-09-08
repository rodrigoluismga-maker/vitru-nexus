import { and, asc, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  financeMarketAttentionPoints,
  financeMarketEntries,
  financeMarketGlossary,
  financeMarketLoads,
  financeMarketQualityIssues,
  financeDimensions,
  financeUserScopes,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
const filterSchema = z
  .object({
    brands: z.array(z.string()).max(20).default([]),
    businessUnits: z.array(z.string()).max(30).default([]),
    modalities: z.array(z.string()).max(30).default([]),
    products: z.array(z.string()).max(50).default([]),
    categories: z.array(z.string()).max(30).default([]),
    accounts: z.array(z.string()).max(50).default([]),
    costCenters: z.array(z.string()).max(50).default([]),
    months: z.array(z.number().int().min(1).max(12)).max(12).default([]),
    entryTypes: z.array(z.string()).max(20).default([]),
  })
  .default({
    brands: [],
    businessUnits: [],
    modalities: [],
    products: [],
    categories: [],
    accounts: [],
    costCenters: [],
    months: [],
    entryTypes: [],
  });
const dimensionSchema = z.enum([
  "brand",
  "businessUnit",
  "modality",
  "product",
  "category",
  "account",
  "costCenter",
  "month",
  "entryType",
]);
const defaultComparisonMonths = [1, 2, 3, 4, 5, 6, 7];
const analysisSchema = z
  .object({
    scenarioMode: z.enum(["actual", "forecast", "outlook"]).default("actual"),
    months: z
      .array(z.number().int().min(1).max(12))
      .min(1)
      .max(12)
      .default(defaultComparisonMonths),
  })
  .default({ scenarioMode: "actual", months: defaultComparisonMonths });
async function access(user: Parameters<typeof assertPermission>[0]) {
  await assertPermission(user, "finance.view");
  if (user.role === "admin") return undefined;
  const db = await requireDb();
  const scopes = await db
    .select()
    .from(financeUserScopes)
    .where(eq(financeUserScopes.userId, user.id));
  if (scopes.some(item => item.scopeType === "all" && item.scopeId === null)) return undefined;
  const dimensionIds = scopes
    .filter(item => item.scopeType === "dimension" && item.scopeId)
    .map(item => item.scopeId as number);
  if (!dimensionIds.length) return sql`false`;
  const dimensions = await db
    .select()
    .from(financeDimensions)
    .where(inArray(financeDimensions.id, dimensionIds));
  const grouped = new Map<string, string[]>();
  for (const item of dimensions) {
    const values = grouped.get(item.dimensionType) ?? [];
    values.push(item.code);
    grouped.set(item.dimensionType, values);
  }
  const clauses = [];
  if (grouped.get("market_brand")?.length)
    clauses.push(inArray(financeMarketEntries.brand, grouped.get("market_brand")!));
  if (grouped.get("market_business_unit")?.length)
    clauses.push(inArray(financeMarketEntries.businessUnit, grouped.get("market_business_unit")!));
  if (grouped.get("market_modality")?.length)
    clauses.push(inArray(financeMarketEntries.modality, grouped.get("market_modality")!));
  if (grouped.get("market_product")?.length)
    clauses.push(inArray(financeMarketEntries.product, grouped.get("market_product")!));
  if (grouped.get("market_category")?.length)
    clauses.push(inArray(financeMarketEntries.managementCategory, grouped.get("market_category")!));
  return clauses.length ? or(...clauses)! : sql`false`;
}
async function activeLoad() {
  const db = await requireDb();
  const [load] = await db
    .select()
    .from(financeMarketLoads)
    .where(eq(financeMarketLoads.status, "active"))
    .orderBy(desc(financeMarketLoads.activatedAt))
    .limit(1);
  return load ?? null;
}
function conditions(loadId: number, input: z.infer<typeof filterSchema>, scope?: any) {
  const clauses: any[] = [
    eq(financeMarketEntries.loadId, loadId),
    eq(financeMarketEntries.isActive, true),
    scope,
  ];
  if (input.brands.length) clauses.push(inArray(financeMarketEntries.brand, input.brands));
  if (input.businessUnits.length)
    clauses.push(inArray(financeMarketEntries.businessUnit, input.businessUnits));
  if (input.modalities.length)
    clauses.push(inArray(financeMarketEntries.modality, input.modalities));
  if (input.products.length) clauses.push(inArray(financeMarketEntries.product, input.products));
  if (input.categories.length)
    clauses.push(inArray(financeMarketEntries.managementCategory, input.categories));
  if (input.accounts.length)
    clauses.push(inArray(financeMarketEntries.accountingAccountCode, input.accounts));
  if (input.costCenters.length)
    clauses.push(inArray(financeMarketEntries.costCenterCode, input.costCenters));
  if (input.months.length) clauses.push(inArray(financeMarketEntries.month, input.months));
  if (input.entryTypes.length)
    clauses.push(inArray(financeMarketEntries.entryType, input.entryTypes));
  return and(...clauses)!;
}
const dimension = {
  brand: { key: financeMarketEntries.brand, label: financeMarketEntries.brand },
  businessUnit: {
    key: financeMarketEntries.businessUnit,
    label: financeMarketEntries.businessUnit,
  },
  modality: { key: financeMarketEntries.modality, label: financeMarketEntries.modality },
  product: { key: financeMarketEntries.product, label: financeMarketEntries.product },
  category: {
    key: financeMarketEntries.managementCategory,
    label: financeMarketEntries.managementCategory,
  },
  account: {
    key: financeMarketEntries.accountingAccountCode,
    label: financeMarketEntries.accountingAccountName,
  },
  costCenter: {
    key: financeMarketEntries.costCenterCode,
    label: financeMarketEntries.costCenterName,
  },
  month: { key: financeMarketEntries.month, label: financeMarketEntries.month },
  entryType: { key: financeMarketEntries.entryType, label: financeMarketEntries.entryType },
} as const;
async function breakdown(
  loadId: number,
  filters: z.infer<typeof filterSchema>,
  by: z.infer<typeof dimensionSchema>,
  scope?: any,
  analysis: z.infer<typeof analysisSchema> = {
    scenarioMode: "actual",
    months: defaultComparisonMonths,
  }
) {
  const db = await requireDb();
  const target = dimension[by];
  const referenceCondition = and(
    eq(financeMarketEntries.scenario, "actual"),
    eq(financeMarketEntries.fiscalYear, 2025),
    inArray(financeMarketEntries.month, analysis.months)
  );
  const currentCondition =
    analysis.scenarioMode === "actual"
      ? and(
          eq(financeMarketEntries.scenario, "actual"),
          eq(financeMarketEntries.fiscalYear, 2026),
          inArray(financeMarketEntries.month, analysis.months)
        )
      : analysis.scenarioMode === "forecast"
        ? and(
            eq(financeMarketEntries.scenario, "forecast"),
            eq(financeMarketEntries.fiscalYear, 2026),
            inArray(financeMarketEntries.month, analysis.months)
          )
        : and(
            eq(financeMarketEntries.fiscalYear, 2026),
            inArray(financeMarketEntries.scenario, ["actual", "forecast"]),
            inArray(financeMarketEntries.month, analysis.months)
          );
  const rows = await db
    .select({
      key: target.key,
      label: sql<string>`max(${target.label})`,
      real2025: sql<string>`sum(case when ${referenceCondition} then ${financeMarketEntries.amountManagement} else 0 end)`,
      real2026: sql<string>`sum(case when ${currentCondition} then ${financeMarketEntries.amountManagement} else 0 end)`,
      forecast2026: sql<string>`
        sum(
          case when ${financeMarketEntries.scenario} = 'forecast'
            and ${financeMarketEntries.fiscalYear} = 2026
          then ${financeMarketEntries.amountManagement} else 0 end
        )
      `,
      rows: sql<number>`count(*)`,
    })
    .from(financeMarketEntries)
    .where(conditions(loadId, filters, scope))
    .groupBy(target.key);
  const mapped = rows.map(row => {
    const real2025 = Number(row.real2025 ?? 0);
    const real2026 = Number(row.real2026 ?? 0);
    const comparisonValid =
      analysis.scenarioMode === "outlook" ||
      (analysis.scenarioMode === "actual" && analysis.months.every(month => month <= 7));
    const delta = comparisonValid ? real2026 - real2025 : real2026;
    return {
      key: String(row.key ?? "[Não informado]"),
      label: String(row.label ?? row.key ?? "[Não informado]"),
      real2025,
      real2026,
      forecast2026: Number(row.forecast2026 ?? 0),
      delta,
      yoy: comparisonValid && real2025 ? delta / Math.abs(real2025) : null,
      comparisonValid,
      rows: Number(row.rows),
    };
  });
  const totalReal2026 = mapped.reduce((sum, item) => sum + item.real2026, 0);
  const grossMovement = mapped.reduce((sum, item) => sum + Math.abs(item.delta), 0);
  return mapped
    .map(item => ({
      ...item,
      shareReal2026: totalReal2026 ? item.real2026 / totalReal2026 : null,
      movementShare: grossMovement ? Math.abs(item.delta) / grossMovement : null,
      direction:
        item.delta > 0
          ? ("increase" as const)
          : item.delta < 0
            ? ("decrease" as const)
            : ("stable" as const),
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}
export const marketFinanceRouter = router({
  scopes: router({
    catalog: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finance.manage_dimensions");
      const db = await requireDb();
      const load = await activeLoad();
      if (!load) return [];
      const rows = await db
        .select({
          brand: financeMarketEntries.brand,
          businessUnit: financeMarketEntries.businessUnit,
          modality: financeMarketEntries.modality,
          product: financeMarketEntries.product,
          category: financeMarketEntries.managementCategory,
        })
        .from(financeMarketEntries)
        .where(eq(financeMarketEntries.loadId, load.id));
      const definitions = [
        ["market_brand", "Marca", rows.map(item => item.brand)],
        ["market_business_unit", "BU", rows.map(item => item.businessUnit)],
        ["market_modality", "Modalidade", rows.map(item => item.modality)],
        ["market_product", "Produto", rows.map(item => item.product)],
        ["market_category", "Categoria", rows.map(item => item.category)],
      ] as const;
      return definitions.flatMap(([dimensionType, label, values]) =>
        Array.from(new Set(values.filter((value): value is string => Boolean(value))))
          .sort()
          .map(value => ({
            dimensionType,
            label,
            code: value,
            name: value,
          }))
      );
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finance.manage_dimensions");
      const db = await requireDb();
      return db
        .select({
          scope: financeUserScopes,
          dimension: financeDimensions,
          userName: users.name,
          userEmail: users.email,
        })
        .from(financeUserScopes)
        .innerJoin(users, eq(users.id, financeUserScopes.userId))
        .leftJoin(financeDimensions, eq(financeDimensions.id, financeUserScopes.scopeId))
        .where(eq(financeUserScopes.scopeType, "dimension"))
        .orderBy(
          asc(users.name),
          asc(financeDimensions.dimensionType),
          asc(financeDimensions.name)
        );
    }),
    upsert: protectedProcedure
      .input(
        z.object({
          userId: z.number().int().positive(),
          dimensionType: z.enum([
            "market_brand",
            "market_business_unit",
            "market_modality",
            "market_product",
            "market_category",
          ]),
          code: z.string().trim().min(1).max(200),
          accessLevel: z.enum(["view", "contribute", "approve", "admin"]).default("view"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "finance.manage_dimensions");
        const db = await requireDb();
        const load = await activeLoad();
        if (!load) throw new TRPCError({ code: "CONFLICT", message: "Não existe carga ativa." });
        const column = {
          market_brand: financeMarketEntries.brand,
          market_business_unit: financeMarketEntries.businessUnit,
          market_modality: financeMarketEntries.modality,
          market_product: financeMarketEntries.product,
          market_category: financeMarketEntries.managementCategory,
        }[input.dimensionType];
        const [official] = await db
          .select({ value: column })
          .from(financeMarketEntries)
          .where(and(eq(financeMarketEntries.loadId, load.id), eq(column, input.code)))
          .limit(1);
        if (!official?.value)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Valor não existe na fonte oficial ativa.",
          });
        await db
          .insert(financeDimensions)
          .values({
            dimensionType: input.dimensionType,
            code: input.code,
            name: input.code,
            createdBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({ set: { name: input.code, status: "active" } });
        const [dimension] = await db
          .select()
          .from(financeDimensions)
          .where(
            and(
              eq(financeDimensions.dimensionType, input.dimensionType),
              eq(financeDimensions.code, input.code)
            )
          )
          .limit(1);
        await db
          .insert(financeUserScopes)
          .values({
            userId: input.userId,
            scopeType: "dimension",
            scopeId: dimension.id,
            accessLevel: input.accessLevel,
            createdBy: ctx.user.id,
          })
          .onDuplicateKeyUpdate({ set: { accessLevel: input.accessLevel } });
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_user_scope",
          entityId: input.userId,
          action: "upsert",
          summary: "Escopo dimensional de Mercado atribuído.",
          metadata: {
            dimensionType: input.dimensionType,
            code: input.code,
            accessLevel: input.accessLevel,
          },
        });
        return { success: true, dimensionId: dimension.id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "finance.manage_dimensions");
        const db = await requireDb();
        const [scope] = await db
          .select()
          .from(financeUserScopes)
          .where(
            and(eq(financeUserScopes.id, input.id), eq(financeUserScopes.scopeType, "dimension"))
          )
          .limit(1);
        if (!scope) throw new TRPCError({ code: "NOT_FOUND", message: "Escopo não encontrado." });
        await db.delete(financeUserScopes).where(eq(financeUserScopes.id, input.id));
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_user_scope",
          entityId: scope.userId,
          action: "removed",
          summary: "Escopo dimensional de Mercado removido.",
          metadata: { scopeId: input.id },
        });
        return { success: true };
      }),
  }),
  loads: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await assertPermission(ctx.user, "finance.view");
      const db = await requireDb();
      return db.select().from(financeMarketLoads).orderBy(desc(financeMarketLoads.loadedAt));
    }),
    validate: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "finance.import");
        const db = await requireDb();
        const [load] = await db
          .select()
          .from(financeMarketLoads)
          .where(eq(financeMarketLoads.id, input.id))
          .limit(1);
        if (!load) throw new TRPCError({ code: "NOT_FOUND", message: "Carga não encontrada." });
        if (["active", "superseded", "reversed"].includes(load.status))
          throw new TRPCError({
            code: "CONFLICT",
            message: "Carga fechada não pode ser revalidada.",
          });
        const [stats] = await db
          .select({
            rows: sql<number>`count(*)`,
            signed: sql<number>`coalesce(sum(${financeMarketEntries.amountSigned}),0)`,
            management: sql<number>`coalesce(sum(${financeMarketEntries.amountManagement}),0)`,
            duplicates: sql<number>`coalesce(sum(${financeMarketEntries.exactDuplicate}=true),0)`,
          })
          .from(financeMarketEntries)
          .where(eq(financeMarketEntries.loadId, input.id));
        const validRows = Number(stats?.rows ?? 0);
        const amountSigned = Number(stats?.signed ?? 0);
        const amountManagement = Number(stats?.management ?? 0);
        const reconciled = validRows > 0 && Math.abs(amountSigned + amountManagement) < 0.01;
        await db
          .update(financeMarketLoads)
          .set({
            validRows,
            duplicateRows: Number(stats?.duplicates ?? 0),
            amountSigned: String(amountSigned),
            amountManagement: String(amountManagement),
            status: reconciled ? "validated" : "failed",
          })
          .where(eq(financeMarketLoads.id, input.id));
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_market_load",
          entityId: input.id,
          action: "validated",
          summary: reconciled
            ? "Carga de Mercado reconciliada."
            : "Carga de Mercado falhou na reconciliação.",
          metadata: { validRows, amountSigned, amountManagement, reconciled },
        });
        return { validRows, amountSigned, amountManagement, reconciled };
      }),
    approve: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "finance.approve");
        const db = await requireDb();
        const [load] = await db
          .select()
          .from(financeMarketLoads)
          .where(eq(financeMarketLoads.id, input.id))
          .limit(1);
        if (!load) throw new TRPCError({ code: "NOT_FOUND", message: "Carga não encontrada." });
        if (load.status !== "validated")
          throw new TRPCError({
            code: "CONFLICT",
            message: "Somente cargas validadas podem ser aprovadas.",
          });
        await db
          .update(financeMarketLoads)
          .set({ status: "approved", approvedBy: ctx.user.id, approvedAt: new Date() })
          .where(eq(financeMarketLoads.id, input.id));
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_market_load",
          entityId: input.id,
          action: "approved",
          summary: "Carga de Mercado aprovada.",
          metadata: {},
        });
        return { success: true };
      }),
    activate: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "finance.approve");
        const db = await requireDb();
        const [load] = await db
          .select()
          .from(financeMarketLoads)
          .where(eq(financeMarketLoads.id, input.id))
          .limit(1);
        if (!load) throw new TRPCError({ code: "NOT_FOUND", message: "Carga não encontrada." });
        if (load.status !== "approved")
          throw new TRPCError({
            code: "CONFLICT",
            message: "Somente cargas aprovadas podem ser ativadas.",
          });
        await db.transaction(async tx => {
          const active = await tx
            .select({ id: financeMarketLoads.id })
            .from(financeMarketLoads)
            .where(eq(financeMarketLoads.status, "active"));
          for (const current of active) {
            await tx
              .update(financeMarketLoads)
              .set({ status: "superseded" })
              .where(eq(financeMarketLoads.id, current.id));
            await tx
              .update(financeMarketEntries)
              .set({ isActive: false })
              .where(eq(financeMarketEntries.loadId, current.id));
          }
          await tx
            .update(financeMarketLoads)
            .set({ status: "active", activatedAt: new Date() })
            .where(eq(financeMarketLoads.id, input.id));
          await tx
            .update(financeMarketEntries)
            .set({ isActive: true })
            .where(eq(financeMarketEntries.loadId, input.id));
        });
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "finance_market_load",
          entityId: input.id,
          action: "activated",
          summary: "Carga de Mercado ativada.",
          metadata: {},
        });
        return { success: true };
      }),
    rollback: protectedProcedure.mutation(async ({ ctx }) => {
      await assertPermission(ctx.user, "finance.approve");
      const db = await requireDb();
      const [current] = await db
        .select()
        .from(financeMarketLoads)
        .where(eq(financeMarketLoads.status, "active"))
        .orderBy(desc(financeMarketLoads.activatedAt))
        .limit(1);
      const [previous] = await db
        .select()
        .from(financeMarketLoads)
        .where(eq(financeMarketLoads.status, "superseded"))
        .orderBy(desc(financeMarketLoads.activatedAt))
        .limit(1);
      if (!current || !previous)
        throw new TRPCError({
          code: "CONFLICT",
          message: "Não existe carga anterior disponível para rollback.",
        });
      await db.transaction(async tx => {
        await tx
          .update(financeMarketLoads)
          .set({ status: "reversed" })
          .where(eq(financeMarketLoads.id, current.id));
        await tx
          .update(financeMarketEntries)
          .set({ isActive: false })
          .where(eq(financeMarketEntries.loadId, current.id));
        await tx
          .update(financeMarketLoads)
          .set({ status: "active", activatedAt: new Date() })
          .where(eq(financeMarketLoads.id, previous.id));
        await tx
          .update(financeMarketEntries)
          .set({ isActive: true })
          .where(eq(financeMarketEntries.loadId, previous.id));
      });
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "finance_market_load",
        entityId: current.id,
        action: "rollback",
        summary: "Rollback da carga de Mercado executado.",
        metadata: { restoredLoadId: previous.id },
      });
      return { restoredLoadId: previous.id };
    }),
  }),
  context: protectedProcedure.query(async ({ ctx }) => {
    const scope = await access(ctx.user);
    const db = await requireDb();
    const load = await activeLoad();
    if (!load) return { load: null, filters: {}, glossary: [], attentionCount: 0, qualityCount: 0 };
    const distinct = async (column: any) =>
      (
        await db
          .selectDistinct({ value: column })
          .from(financeMarketEntries)
          .where(
            and(
              eq(financeMarketEntries.loadId, load.id),
              eq(financeMarketEntries.isActive, true),
              scope
            )
          )
          .orderBy(asc(column))
      )
        .map(item => item.value)
        .filter(Boolean);
    const pairs = async (key: any, label: any) =>
      (
        await db
          .select({ value: key, label: sql<string>`max(${label})` })
          .from(financeMarketEntries)
          .where(
            and(
              eq(financeMarketEntries.loadId, load.id),
              eq(financeMarketEntries.isActive, true),
              scope
            )
          )
          .groupBy(key)
          .orderBy(asc(key))
      )
        .filter(item => item.value)
        .map(item => ({
          value: String(item.value),
          label: item.label ? `${item.value} · ${item.label}` : String(item.value),
        }));
    const [
      brands,
      businessUnits,
      modalities,
      products,
      categories,
      accounts,
      costCenters,
      entryTypes,
      accountOptions,
      costCenterOptions,
      glossary,
      attentionCount,
      qualityCount,
    ] = await Promise.all([
      distinct(financeMarketEntries.brand),
      distinct(financeMarketEntries.businessUnit),
      distinct(financeMarketEntries.modality),
      distinct(financeMarketEntries.product),
      distinct(financeMarketEntries.managementCategory),
      distinct(financeMarketEntries.accountingAccountCode),
      distinct(financeMarketEntries.costCenterCode),
      distinct(financeMarketEntries.entryType),
      pairs(financeMarketEntries.accountingAccountCode, financeMarketEntries.accountingAccountName),
      pairs(financeMarketEntries.costCenterCode, financeMarketEntries.costCenterName),
      db
        .select()
        .from(financeMarketGlossary)
        .where(eq(financeMarketGlossary.loadId, load.id))
        .orderBy(asc(financeMarketGlossary.category)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(financeMarketAttentionPoints)
        .where(
          and(
            eq(financeMarketAttentionPoints.loadId, load.id),
            eq(financeMarketAttentionPoints.status, "open")
          )
        ),
      db
        .select({ count: sql<number>`count(*)` })
        .from(financeMarketQualityIssues)
        .where(eq(financeMarketQualityIssues.loadId, load.id)),
    ]);
    return {
      load,
      filters: {
        brands,
        businessUnits,
        modalities,
        products,
        categories,
        accounts,
        costCenters,
        entryTypes,
        accountOptions,
        costCenterOptions,
      },
      glossary,
      attentionCount: Number(attentionCount[0]?.count ?? 0),
      qualityCount: Number(qualityCount[0]?.count ?? 0),
    };
  }),
  overview: protectedProcedure
    .input(
      z.object({
        filters: filterSchema,
        compositionBy: dimensionSchema.default("brand"),
        analysis: analysisSchema,
      })
    )
    .query(async ({ ctx, input }) => {
      const scope = await access(ctx.user);
      const db = await requireDb();
      const load = await activeLoad();
      if (!load) return null;
      const base = conditions(load.id, input.filters, scope);
      const referenceCondition = and(
        eq(financeMarketEntries.scenario, "actual"),
        eq(financeMarketEntries.fiscalYear, 2025),
        inArray(financeMarketEntries.month, input.analysis.months)
      );
      const currentCondition =
        input.analysis.scenarioMode === "actual"
          ? and(
              eq(financeMarketEntries.scenario, "actual"),
              eq(financeMarketEntries.fiscalYear, 2026),
              inArray(financeMarketEntries.month, input.analysis.months)
            )
          : input.analysis.scenarioMode === "forecast"
            ? and(
                eq(financeMarketEntries.scenario, "forecast"),
                eq(financeMarketEntries.fiscalYear, 2026),
                inArray(financeMarketEntries.month, input.analysis.months)
              )
            : and(
                eq(financeMarketEntries.fiscalYear, 2026),
                inArray(financeMarketEntries.scenario, ["actual", "forecast"]),
                inArray(financeMarketEntries.month, input.analysis.months)
              );
      const [totals] = await db
        .select({
          realJanJul25: sql<string>`sum(case when ${referenceCondition} then ${financeMarketEntries.amountManagement} else 0 end)`,
          realJanJul26: sql<string>`sum(case when ${currentCondition} then ${financeMarketEntries.amountManagement} else 0 end)`,
          realFY25: sql<string>`
            sum(case when ${financeMarketEntries.scenario}='actual'
              and ${financeMarketEntries.fiscalYear}=2025
            then ${financeMarketEntries.amountManagement} else 0 end)
          `,
          realYTD26: sql<string>`
            sum(case when ${financeMarketEntries.scenario}='actual'
              and ${financeMarketEntries.fiscalYear}=2026
            then ${financeMarketEntries.amountManagement} else 0 end)
          `,
          forecastRemaining26: sql<string>`
            sum(case when ${financeMarketEntries.scenario}='forecast'
              and ${financeMarketEntries.fiscalYear}=2026
            then ${financeMarketEntries.amountManagement} else 0 end)
          `,
          transactions: sql<number>`count(*)`,
          realJanJul25Transactions: sql<number>`sum(case when ${referenceCondition} then 1 else 0 end)`,
          realJanJul26Transactions: sql<number>`sum(case when ${currentCondition} then 1 else 0 end)`,
          manualRows: sql<number>`sum(case when ${financeMarketEntries.manualEntry}=true then 1 else 0 end)`,
        })
        .from(financeMarketEntries)
        .where(base);
      const annualBase = conditions(load.id, { ...input.filters, months: [] }, scope);
      const [annualTotals] = await db
        .select({
          realFY25: sql<string>`
            sum(case when ${financeMarketEntries.scenario}='actual'
              and ${financeMarketEntries.fiscalYear}=2025
            then ${financeMarketEntries.amountManagement} else 0 end)
          `,
          realYTD26: sql<string>`
            sum(case when ${financeMarketEntries.scenario}='actual'
              and ${financeMarketEntries.fiscalYear}=2026
            then ${financeMarketEntries.amountManagement} else 0 end)
          `,
          forecastRemaining26: sql<string>`
            sum(case when ${financeMarketEntries.scenario}='forecast'
              and ${financeMarketEntries.fiscalYear}=2026
            then ${financeMarketEntries.amountManagement} else 0 end)
          `,
        })
        .from(financeMarketEntries)
        .where(annualBase);
      const monthlyFilters = { ...input.filters, months: [] };
      const monthlyBase = conditions(load.id, monthlyFilters, scope);
      const monthly = await db
        .select({
          year: financeMarketEntries.fiscalYear,
          month: financeMarketEntries.month,
          scenario: financeMarketEntries.scenario,
          amount: sql<string>`sum(${financeMarketEntries.amountManagement})`,
        })
        .from(financeMarketEntries)
        .where(monthlyBase)
        .groupBy(
          financeMarketEntries.fiscalYear,
          financeMarketEntries.month,
          financeMarketEntries.scenario
        )
        .orderBy(asc(financeMarketEntries.fiscalYear), asc(financeMarketEntries.month));
      const real25 = Number(totals.realJanJul25 ?? 0);
      const real26 = Number(totals.realJanJul26 ?? 0);
      const fy25 = Number(annualTotals.realFY25 ?? 0);
      const realYtd26 = Number(annualTotals.realYTD26 ?? 0);
      const forecast = Number(annualTotals.forecastRemaining26 ?? 0);
      const outlook = realYtd26 + forecast;
      const compositionAll = await breakdown(
        load.id,
        input.filters,
        input.compositionBy,
        scope,
        input.analysis
      );
      const movement = compositionAll.reduce(
        (summary, item) => {
          if (item.delta > 0) summary.increases += item.delta;
          if (item.delta < 0) summary.reductions += Math.abs(item.delta);
          return summary;
        },
        { increases: 0, reductions: 0 }
      );
      const composition = compositionAll.slice(0, 12);
      const attentionClauses: any[] = [
        eq(financeMarketAttentionPoints.loadId, load.id),
        eq(financeMarketAttentionPoints.status, "open"),
      ];
      if (input.filters.brands.length)
        attentionClauses.push(inArray(financeMarketAttentionPoints.brand, input.filters.brands));
      if (input.filters.businessUnits.length)
        attentionClauses.push(
          inArray(financeMarketAttentionPoints.businessUnit, input.filters.businessUnits)
        );
      if (input.filters.categories.length)
        attentionClauses.push(
          inArray(financeMarketAttentionPoints.managementCategory, input.filters.categories)
        );
      const attention = await db
        .select()
        .from(financeMarketAttentionPoints)
        .where(and(...attentionClauses))
        .orderBy(desc(financeMarketAttentionPoints.id))
        .limit(8);
      const comparisonValid =
        input.analysis.scenarioMode === "outlook" ||
        (input.analysis.scenarioMode === "actual" &&
          input.analysis.months.every(month => month <= 7));
      return {
        load,
        analysis: { ...input.analysis, comparisonValid },
        kpis: {
          realJanJul25: real25,
          realJanJul26: real26,
          deltaYtd: comparisonValid ? real26 - real25 : real26,
          yoyYtd: comparisonValid && real25 ? (real26 - real25) / Math.abs(real25) : null,
          realFY25: fy25,
          realYtd26,
          forecastRemaining26: forecast,
          outlookFY26: outlook,
          outlookDelta: outlook - fy25,
          outlookYoY: fy25 ? (outlook - fy25) / Math.abs(fy25) : null,
          transactions: Number(totals.transactions),
          realJanJul25Transactions: Number(totals.realJanJul25Transactions),
          realJanJul26Transactions: Number(totals.realJanJul26Transactions),
          manualShare: Number(totals.transactions)
            ? Number(totals.manualRows) / Number(totals.transactions)
            : 0,
        },
        movement,
        monthly: monthly.map(item => ({ ...item, amount: Number(item.amount) })),
        composition,
        attention,
      };
    }),
  variation: protectedProcedure
    .input(z.object({ filters: filterSchema, by: dimensionSchema, analysis: analysisSchema }))
    .query(async ({ ctx, input }) => {
      const scope = await access(ctx.user);
      const load = await activeLoad();
      return load ? breakdown(load.id, input.filters, input.by, scope, input.analysis) : [];
    }),
  transactions: protectedProcedure
    .input(
      z.object({
        filters: filterSchema,
        scenario: z.enum(["actual", "forecast"]).optional(),
        year: z.number().int().min(2024).max(2026).optional(),
        search: z.string().trim().max(100).default(""),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(20).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const scope = await access(ctx.user);
      const db = await requireDb();
      const load = await activeLoad();
      if (!load) return { rows: [], total: 0 };
      const extra: any[] = [conditions(load.id, input.filters, scope)];
      if (input.scenario) extra.push(eq(financeMarketEntries.scenario, input.scenario));
      if (input.year) extra.push(eq(financeMarketEntries.fiscalYear, input.year));
      if (input.search)
        extra.push(
          or(
            like(financeMarketEntries.history, `%${input.search}%`),
            like(financeMarketEntries.accountingAccountName, `%${input.search}%`),
            like(financeMarketEntries.managementCategory, `%${input.search}%`)
          )
        );
      const where = and(...extra)!;
      const [count] = await db
        .select({ total: sql<number>`count(*)` })
        .from(financeMarketEntries)
        .where(where);
      const rows = await db
        .select({
          id: financeMarketEntries.id,
          sourceExcelRow: financeMarketEntries.sourceExcelRow,
          origin: financeMarketEntries.origin,
          scenario: financeMarketEntries.scenario,
          period: financeMarketEntries.period,
          postingDate: financeMarketEntries.postingDate,
          brand: financeMarketEntries.brand,
          businessUnit: financeMarketEntries.businessUnit,
          modality: financeMarketEntries.modality,
          product: financeMarketEntries.product,
          category: financeMarketEntries.managementCategory,
          entryType: financeMarketEntries.entryType,
          accountCode: financeMarketEntries.accountingAccountCode,
          accountName: financeMarketEntries.accountingAccountName,
          costCenterCode: financeMarketEntries.costCenterCode,
          costCenterName: financeMarketEntries.costCenterName,
          budgetCode: financeMarketEntries.budgetCode,
          budgetName: financeMarketEntries.budgetName,
          history: financeMarketEntries.history,
          sourceUser: financeMarketEntries.sourceUser,
          ledgerBatch: financeMarketEntries.ledgerBatch,
          ledgerSubBatch: financeMarketEntries.ledgerSubBatch,
          amountSigned: financeMarketEntries.amountSigned,
          amountManagement: financeMarketEntries.amountManagement,
          manualEntry: financeMarketEntries.manualEntry,
          exactDuplicate: financeMarketEntries.exactDuplicate,
          qualityFlags: financeMarketEntries.qualityFlags,
        })
        .from(financeMarketEntries)
        .where(where)
        .orderBy(desc(financeMarketEntries.postingDate), desc(financeMarketEntries.id))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);
      return {
        rows: rows.map(row => ({
          ...row,
          amountSigned: Number(row.amountSigned),
          amountManagement: Number(row.amountManagement),
        })),
        total: Number(count?.total ?? 0),
      };
    }),
  attention: protectedProcedure
    .input(z.object({ filters: filterSchema }))
    .query(async ({ ctx, input }) => {
      await access(ctx.user);
      const db = await requireDb();
      const load = await activeLoad();
      if (!load) return [];
      const clauses: any[] = [eq(financeMarketAttentionPoints.loadId, load.id)];
      if (input.filters.brands.length)
        clauses.push(inArray(financeMarketAttentionPoints.brand, input.filters.brands));
      if (input.filters.businessUnits.length)
        clauses.push(
          inArray(financeMarketAttentionPoints.businessUnit, input.filters.businessUnits)
        );
      if (input.filters.categories.length)
        clauses.push(
          inArray(financeMarketAttentionPoints.managementCategory, input.filters.categories)
        );
      return db
        .select()
        .from(financeMarketAttentionPoints)
        .where(and(...clauses))
        .orderBy(
          desc(financeMarketAttentionPoints.status),
          asc(financeMarketAttentionPoints.brand),
          asc(financeMarketAttentionPoints.managementCategory)
        );
    }),
  quality: protectedProcedure.query(async ({ ctx }) => {
    const scope = await access(ctx.user);
    const db = await requireDb();
    const load = await activeLoad();
    if (!load) return null;
    const issues = await db
      .select()
      .from(financeMarketQualityIssues)
      .where(eq(financeMarketQualityIssues.loadId, load.id))
      .orderBy(
        desc(financeMarketQualityIssues.severity),
        asc(financeMarketQualityIssues.sourceExcelRow)
      );
    const [stats] = await db
      .select({
        rows: sql<number>`count(*)`,
        manual: sql<number>`sum(${financeMarketEntries.manualEntry}=true)`,
        duplicate: sql<number>`sum(${financeMarketEntries.exactDuplicate}=true)`,
        missingUser: sql<number>`sum(${financeMarketEntries.sourceUser} is null)`,
        missingBudget: sql<number>`sum(${financeMarketEntries.budgetCode} is null)`,
        missingAccountName: sql<number>`sum(${financeMarketEntries.accountingAccountName} is null)`,
        missingCostCenterName: sql<number>`sum(${financeMarketEntries.costCenterName} is null)`,
      })
      .from(financeMarketEntries)
      .where(
        and(
          eq(financeMarketEntries.loadId, load.id),
          eq(financeMarketEntries.isActive, true),
          scope
        )
      );
    return {
      load,
      issues,
      stats: Object.fromEntries(
        Object.entries(stats).map(([key, value]) => [key, Number(value ?? 0)])
      ),
    };
  }),
});
