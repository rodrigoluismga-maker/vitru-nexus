import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  companies,
  expansionCities,
  expansionCompetitors,
  expansionMediaPlans,
  expansionMetrics,
  expansionOffers,
  expansionSalesPlans,
  expansionScenarios,
  modalities,
  projects,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";

const projectInput = z.object({ projectId: z.number().int().positive() });
const idInput = projectInput.extend({ id: z.number().int().positive() });
const nullableMetric = z.number().finite().nullable().optional();
const nullablePositiveId = z.number().int().positive().nullable().optional();
const nullableDate = z.date().nullable().optional();

const citySchema = projectInput.extend({
  name: z.string().trim().min(2).max(160),
  stateCode: z
    .string()
    .trim()
    .length(2)
    .transform(value => value.toUpperCase()),
  region: z.string().trim().max(80).nullable().optional(),
  ibgeCode: z.string().trim().max(12).nullable().optional(),
  population: z.number().int().nonnegative().nullable().optional(),
  populationReferenceYear: z.number().int().min(1900).max(2100).nullable().optional(),
  populationSource: z.string().url().max(1000).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  stage: z
    .enum([
      "prospecting",
      "study",
      "approval",
      "implementation",
      "operation",
      "paused",
      "cancelled",
    ])
    .default("prospecting"),
  health: z.enum(["healthy", "attention", "critical", "unassessed"]).default("unassessed"),
  marketPotentialScore: z.number().min(0).max(100).nullable().optional(),
  attractionScore: z.number().min(0).max(100).nullable().optional(),
  competitionScore: z.number().min(0).max(100).nullable().optional(),
  operationalReadinessScore: z.number().min(0).max(100).nullable().optional(),
  overallScore: z.number().min(0).max(100).nullable().optional(),
  targetOpeningDate: nullableDate,
  notes: z.string().max(10000).nullable().optional(),
});

const offerSchema = projectInput.extend({
  cityId: z.number().int().positive(),
  companyId: z.number().int().positive(),
  modalityId: nullablePositiveId,
  courseName: z.string().trim().min(2).max(180),
  courseCode: z.string().trim().max(60).nullable().optional(),
  degreeType: z.string().trim().max(80).nullable().optional(),
  shift: z.string().trim().max(80).nullable().optional(),
  entryPeriod: z.string().trim().max(40).nullable().optional(),
  grossPrice: nullableMetric,
  launchDiscount: z.number().min(0).max(1).nullable().optional(),
  targetNetPrice: nullableMetric,
  capacity: z.number().int().nonnegative().nullable().optional(),
  status: z
    .enum(["study", "approved", "implementation", "active", "paused", "cancelled"])
    .default("study"),
  notes: z.string().max(10000).nullable().optional(),
});

const scenarioSchema = projectInput.extend({
  cityId: nullablePositiveId,
  name: z.enum(["conservative", "base", "accelerated"]),
  periodLabel: z.string().trim().min(2).max(80),
  targetEnrollments: z.number().int().nonnegative().nullable().optional(),
  targetLeads: z.number().int().nonnegative().nullable().optional(),
  conversionRate: z.number().min(0).max(1).nullable().optional(),
  averageTicket: nullableMetric,
  grossRevenue: nullableMetric,
  totalInvestment: nullableMetric,
  digitalShare: z.number().min(0).max(1).nullable().optional(),
  assumptions: z.string().max(20000).nullable().optional(),
});

const competitorSchema = projectInput.extend({
  cityId: z.number().int().positive(),
  institutionName: z.string().trim().min(2).max(180),
  isPrivate: z.boolean().default(true),
  courseName: z.string().trim().max(180).nullable().optional(),
  modality: z.string().trim().max(100).nullable().optional(),
  grossPrice: nullableMetric,
  netPrice: nullableMetric,
  evidenceSource: z.string().url().max(1000).nullable().optional(),
  evidenceDate: nullableDate,
  notes: z.string().max(10000).nullable().optional(),
});

const mediaSchema = projectInput.extend({
  cityId: z.number().int().positive(),
  campaignName: z.string().trim().min(2).max(180),
  channelName: z.string().trim().min(2).max(140),
  channelType: z.enum(["digital", "offline", "partnership", "event", "other"]),
  objective: z.string().trim().max(220).nullable().optional(),
  investment: nullableMetric,
  targetLeads: z.number().int().nonnegative().nullable().optional(),
  targetEnrollments: z.number().int().nonnegative().nullable().optional(),
  startDate: nullableDate,
  endDate: nullableDate,
  ownerId: nullablePositiveId,
  status: z.enum(["planned", "active", "completed", "paused", "cancelled"]).default("planned"),
});

const salesSchema = projectInput.extend({
  cityId: z.number().int().positive(),
  channelName: z.string().trim().min(2).max(140),
  ownerId: nullablePositiveId,
  plannedHeadcount: z.number().int().nonnegative().nullable().optional(),
  currentHeadcount: z.number().int().nonnegative().nullable().optional(),
  targetLeads: z.number().int().nonnegative().nullable().optional(),
  targetEnrollments: z.number().int().nonnegative().nullable().optional(),
  actualEnrollments: z.number().int().nonnegative().nullable().optional(),
  readiness: z
    .enum(["not_started", "mobilizing", "ready", "operating", "blocked"])
    .default("not_started"),
  notes: z.string().max(10000).nullable().optional(),
});

const metricSchema = projectInput.extend({
  cityId: nullablePositiveId,
  offerId: nullablePositiveId,
  scenarioId: nullablePositiveId,
  metricCode: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_]+$/),
  name: z.string().trim().min(2).max(180),
  unit: z.string().trim().max(40).nullable().optional(),
  periodLabel: z.string().trim().min(2).max(80),
  targetValue: nullableMetric,
  actualValue: nullableMetric,
  forecastValue: nullableMetric,
  source: z.string().trim().max(500).nullable().optional(),
  measuredAt: nullableDate,
});

function decimal(value: number | null | undefined) {
  return value === null || value === undefined ? null : String(value);
}

async function assertExpansionProject(projectId: number) {
  const db = await requireDb();
  const [project] = await db
    .select({ id: projects.id, workspaceTemplate: projects.workspaceTemplate })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado." });
  if (project.workspaceTemplate !== "expansion")
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Este projeto não utiliza o workspace de expansão presencial.",
    });
  return db;
}

async function audit(
  userId: number,
  projectId: number,
  entityType: string,
  entityId: number,
  action: string,
  summary: string
) {
  await recordAudit({
    actorUserId: userId,
    entityType,
    entityId,
    action,
    summary,
    metadata: { projectId },
  });
}

export const expansionRouter = router({
  overview: protectedProcedure.input(projectInput).query(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "projects.view");
    const db = await assertExpansionProject(input.projectId);
    const [cities, offers, scenarios, competitors, mediaPlans, salesPlans, metrics] =
      await Promise.all([
        db
          .select()
          .from(expansionCities)
          .where(eq(expansionCities.projectId, input.projectId))
          .orderBy(asc(expansionCities.name)),
        db
          .select({
            offer: expansionOffers,
            cityName: expansionCities.name,
            stateCode: expansionCities.stateCode,
            companyName: companies.shortName,
            modalityName: modalities.name,
          })
          .from(expansionOffers)
          .innerJoin(expansionCities, eq(expansionCities.id, expansionOffers.cityId))
          .innerJoin(companies, eq(companies.id, expansionOffers.companyId))
          .leftJoin(modalities, eq(modalities.id, expansionOffers.modalityId))
          .where(eq(expansionOffers.projectId, input.projectId))
          .orderBy(asc(expansionCities.name), asc(expansionOffers.courseName)),
        db
          .select({
            scenario: expansionScenarios,
            cityName: expansionCities.name,
            stateCode: expansionCities.stateCode,
          })
          .from(expansionScenarios)
          .leftJoin(expansionCities, eq(expansionCities.id, expansionScenarios.cityId))
          .where(eq(expansionScenarios.projectId, input.projectId))
          .orderBy(asc(expansionScenarios.periodLabel), asc(expansionScenarios.name)),
        db
          .select({
            competitor: expansionCompetitors,
            cityName: expansionCities.name,
            stateCode: expansionCities.stateCode,
          })
          .from(expansionCompetitors)
          .innerJoin(expansionCities, eq(expansionCities.id, expansionCompetitors.cityId))
          .where(eq(expansionCompetitors.projectId, input.projectId))
          .orderBy(asc(expansionCities.name), asc(expansionCompetitors.institutionName)),
        db
          .select({
            plan: expansionMediaPlans,
            cityName: expansionCities.name,
            stateCode: expansionCities.stateCode,
            ownerName: users.name,
          })
          .from(expansionMediaPlans)
          .innerJoin(expansionCities, eq(expansionCities.id, expansionMediaPlans.cityId))
          .leftJoin(users, eq(users.id, expansionMediaPlans.ownerId))
          .where(eq(expansionMediaPlans.projectId, input.projectId))
          .orderBy(asc(expansionCities.name), asc(expansionMediaPlans.startDate)),
        db
          .select({
            plan: expansionSalesPlans,
            cityName: expansionCities.name,
            stateCode: expansionCities.stateCode,
            ownerName: users.name,
          })
          .from(expansionSalesPlans)
          .innerJoin(expansionCities, eq(expansionCities.id, expansionSalesPlans.cityId))
          .leftJoin(users, eq(users.id, expansionSalesPlans.ownerId))
          .where(eq(expansionSalesPlans.projectId, input.projectId))
          .orderBy(asc(expansionCities.name), asc(expansionSalesPlans.channelName)),
        db
          .select({
            metric: expansionMetrics,
            cityName: expansionCities.name,
            stateCode: expansionCities.stateCode,
          })
          .from(expansionMetrics)
          .leftJoin(expansionCities, eq(expansionCities.id, expansionMetrics.cityId))
          .where(eq(expansionMetrics.projectId, input.projectId))
          .orderBy(desc(expansionMetrics.periodLabel), asc(expansionMetrics.name)),
      ]);
    return { cities, offers, scenarios, competitors, mediaPlans, salesPlans, metrics };
  }),
  options: protectedProcedure.input(projectInput).query(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "projects.view");
    const db = await assertExpansionProject(input.projectId);
    const [companyList, modalityList, userList] = await Promise.all([
      db
        .select({
          id: companies.id,
          name: companies.shortName,
          color: companies.institutionalColor,
        })
        .from(companies)
        .where(eq(companies.status, "active"))
        .orderBy(asc(companies.shortName)),
      db
        .select({ id: modalities.id, name: modalities.name })
        .from(modalities)
        .where(eq(modalities.status, "active"))
        .orderBy(asc(modalities.name)),
      db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.status, "active"))
        .orderBy(asc(users.name)),
    ]);
    return { companies: companyList, modalities: modalityList, users: userList };
  }),
  cities: router({
    create: protectedProcedure.input(citySchema).mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await assertExpansionProject(input.projectId);
      const [result] = await db.insert(expansionCities).values({
        ...input,
        latitude: decimal(input.latitude),
        longitude: decimal(input.longitude),
        marketPotentialScore: decimal(input.marketPotentialScore),
        attractionScore: decimal(input.attractionScore),
        competitionScore: decimal(input.competitionScore),
        operationalReadinessScore: decimal(input.operationalReadinessScore),
        overallScore: decimal(input.overallScore),
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      });
      const id = Number(result.insertId);
      await audit(
        ctx.user.id,
        input.projectId,
        "expansion_city",
        id,
        "created",
        `Praça ${input.name}/${input.stateCode} adicionada à expansão.`
      );
      return { id };
    }),
    update: protectedProcedure
      .input(idInput.extend({ data: citySchema.omit({ projectId: true }).partial() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "governance.manage");
        const db = await assertExpansionProject(input.projectId);
        const data = input.data;
        await db
          .update(expansionCities)
          .set({
            ...data,
            latitude: data.latitude === undefined ? undefined : decimal(data.latitude),
            longitude: data.longitude === undefined ? undefined : decimal(data.longitude),
            marketPotentialScore:
              data.marketPotentialScore === undefined
                ? undefined
                : decimal(data.marketPotentialScore),
            attractionScore:
              data.attractionScore === undefined ? undefined : decimal(data.attractionScore),
            competitionScore:
              data.competitionScore === undefined ? undefined : decimal(data.competitionScore),
            operationalReadinessScore:
              data.operationalReadinessScore === undefined
                ? undefined
                : decimal(data.operationalReadinessScore),
            overallScore: data.overallScore === undefined ? undefined : decimal(data.overallScore),
            updatedBy: ctx.user.id,
          })
          .where(
            and(eq(expansionCities.id, input.id), eq(expansionCities.projectId, input.projectId))
          );
        await audit(
          ctx.user.id,
          input.projectId,
          "expansion_city",
          input.id,
          "updated",
          "Praça de expansão atualizada."
        );
        return { success: true };
      }),
  }),
  offers: router({
    create: protectedProcedure.input(offerSchema).mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await assertExpansionProject(input.projectId);
      const [r] = await db.insert(expansionOffers).values({
        ...input,
        grossPrice: decimal(input.grossPrice),
        launchDiscount: decimal(input.launchDiscount),
        targetNetPrice: decimal(input.targetNetPrice),
      });
      const id = Number(r.insertId);
      await audit(
        ctx.user.id,
        input.projectId,
        "expansion_offer",
        id,
        "created",
        `Oferta ${input.courseName} adicionada.`
      );
      return { id };
    }),
    update: protectedProcedure
      .input(idInput.extend({ data: offerSchema.omit({ projectId: true }).partial() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "governance.manage");
        const db = await assertExpansionProject(input.projectId);
        const d = input.data;
        await db
          .update(expansionOffers)
          .set({
            ...d,
            grossPrice: d.grossPrice === undefined ? undefined : decimal(d.grossPrice),
            launchDiscount: d.launchDiscount === undefined ? undefined : decimal(d.launchDiscount),
            targetNetPrice: d.targetNetPrice === undefined ? undefined : decimal(d.targetNetPrice),
          })
          .where(
            and(eq(expansionOffers.id, input.id), eq(expansionOffers.projectId, input.projectId))
          );
        await audit(
          ctx.user.id,
          input.projectId,
          "expansion_offer",
          input.id,
          "updated",
          "Oferta de expansão atualizada."
        );
        return { success: true };
      }),
  }),
  scenarios: router({
    create: protectedProcedure.input(scenarioSchema).mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await assertExpansionProject(input.projectId);
      const [r] = await db.insert(expansionScenarios).values({
        ...input,
        conversionRate: decimal(input.conversionRate),
        averageTicket: decimal(input.averageTicket),
        grossRevenue: decimal(input.grossRevenue),
        totalInvestment: decimal(input.totalInvestment),
        digitalShare: decimal(input.digitalShare),
      });
      const id = Number(r.insertId);
      await audit(
        ctx.user.id,
        input.projectId,
        "expansion_scenario",
        id,
        "created",
        `Cenário ${input.name} criado para ${input.periodLabel}.`
      );
      return { id };
    }),
    update: protectedProcedure
      .input(idInput.extend({ data: scenarioSchema.omit({ projectId: true }).partial() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "governance.manage");
        const db = await assertExpansionProject(input.projectId);
        const d = input.data;
        await db
          .update(expansionScenarios)
          .set({
            ...d,
            conversionRate: d.conversionRate === undefined ? undefined : decimal(d.conversionRate),
            averageTicket: d.averageTicket === undefined ? undefined : decimal(d.averageTicket),
            grossRevenue: d.grossRevenue === undefined ? undefined : decimal(d.grossRevenue),
            totalInvestment:
              d.totalInvestment === undefined ? undefined : decimal(d.totalInvestment),
            digitalShare: d.digitalShare === undefined ? undefined : decimal(d.digitalShare),
          })
          .where(
            and(
              eq(expansionScenarios.id, input.id),
              eq(expansionScenarios.projectId, input.projectId)
            )
          );
        await audit(
          ctx.user.id,
          input.projectId,
          "expansion_scenario",
          input.id,
          "updated",
          "Cenário de expansão atualizado."
        );
        return { success: true };
      }),
  }),
  competitors: router({
    create: protectedProcedure.input(competitorSchema).mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await assertExpansionProject(input.projectId);
      const [r] = await db.insert(expansionCompetitors).values({
        ...input,
        grossPrice: decimal(input.grossPrice),
        netPrice: decimal(input.netPrice),
      });
      const id = Number(r.insertId);
      await audit(
        ctx.user.id,
        input.projectId,
        "expansion_competitor",
        id,
        "created",
        `Concorrente ${input.institutionName} registrado.`
      );
      return { id };
    }),
    update: protectedProcedure
      .input(idInput.extend({ data: competitorSchema.omit({ projectId: true }).partial() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "governance.manage");
        const db = await assertExpansionProject(input.projectId);
        const d = input.data;
        await db
          .update(expansionCompetitors)
          .set({
            ...d,
            grossPrice: d.grossPrice === undefined ? undefined : decimal(d.grossPrice),
            netPrice: d.netPrice === undefined ? undefined : decimal(d.netPrice),
          })
          .where(
            and(
              eq(expansionCompetitors.id, input.id),
              eq(expansionCompetitors.projectId, input.projectId)
            )
          );
        await audit(
          ctx.user.id,
          input.projectId,
          "expansion_competitor",
          input.id,
          "updated",
          "Registro de concorrência atualizado."
        );
        return { success: true };
      }),
  }),
  media: router({
    create: protectedProcedure.input(mediaSchema).mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await assertExpansionProject(input.projectId);
      const [r] = await db
        .insert(expansionMediaPlans)
        .values({ ...input, investment: decimal(input.investment) });
      const id = Number(r.insertId);
      await audit(
        ctx.user.id,
        input.projectId,
        "expansion_media",
        id,
        "created",
        `Plano de mídia ${input.campaignName} criado.`
      );
      return { id };
    }),
    update: protectedProcedure
      .input(idInput.extend({ data: mediaSchema.omit({ projectId: true }).partial() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "governance.manage");
        const db = await assertExpansionProject(input.projectId);
        const d = input.data;
        await db
          .update(expansionMediaPlans)
          .set({ ...d, investment: d.investment === undefined ? undefined : decimal(d.investment) })
          .where(
            and(
              eq(expansionMediaPlans.id, input.id),
              eq(expansionMediaPlans.projectId, input.projectId)
            )
          );
        await audit(
          ctx.user.id,
          input.projectId,
          "expansion_media",
          input.id,
          "updated",
          "Plano de mídia atualizado."
        );
        return { success: true };
      }),
  }),
  sales: router({
    create: protectedProcedure.input(salesSchema).mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await assertExpansionProject(input.projectId);
      const [r] = await db.insert(expansionSalesPlans).values(input);
      const id = Number(r.insertId);
      await audit(
        ctx.user.id,
        input.projectId,
        "expansion_sales",
        id,
        "created",
        `Plano comercial ${input.channelName} criado.`
      );
      return { id };
    }),
    update: protectedProcedure
      .input(idInput.extend({ data: salesSchema.omit({ projectId: true }).partial() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "governance.manage");
        const db = await assertExpansionProject(input.projectId);
        await db
          .update(expansionSalesPlans)
          .set(input.data)
          .where(
            and(
              eq(expansionSalesPlans.id, input.id),
              eq(expansionSalesPlans.projectId, input.projectId)
            )
          );
        await audit(
          ctx.user.id,
          input.projectId,
          "expansion_sales",
          input.id,
          "updated",
          "Plano comercial atualizado."
        );
        return { success: true };
      }),
  }),
  metrics: router({
    create: protectedProcedure.input(metricSchema).mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await assertExpansionProject(input.projectId);
      const [r] = await db.insert(expansionMetrics).values({
        ...input,
        targetValue: decimal(input.targetValue),
        actualValue: decimal(input.actualValue),
        forecastValue: decimal(input.forecastValue),
      });
      const id = Number(r.insertId);
      await audit(
        ctx.user.id,
        input.projectId,
        "expansion_metric",
        id,
        "created",
        `Indicador ${input.name} criado.`
      );
      return { id };
    }),
    update: protectedProcedure
      .input(idInput.extend({ data: metricSchema.omit({ projectId: true }).partial() }))
      .mutation(async ({ ctx, input }) => {
        await assertPermission(ctx.user, "governance.manage");
        const db = await assertExpansionProject(input.projectId);
        const d = input.data;
        await db
          .update(expansionMetrics)
          .set({
            ...d,
            targetValue: d.targetValue === undefined ? undefined : decimal(d.targetValue),
            actualValue: d.actualValue === undefined ? undefined : decimal(d.actualValue),
            forecastValue: d.forecastValue === undefined ? undefined : decimal(d.forecastValue),
          })
          .where(
            and(eq(expansionMetrics.id, input.id), eq(expansionMetrics.projectId, input.projectId))
          );
        await audit(
          ctx.user.id,
          input.projectId,
          "expansion_metric",
          input.id,
          "updated",
          "Indicador de expansão atualizado."
        );
        return { success: true };
      }),
  }),
});
