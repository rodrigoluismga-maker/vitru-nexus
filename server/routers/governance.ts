import { and, asc, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { auditEvents, decisions, deliveries, milestones, risks } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import { notifyProjectParticipants } from "../services/projectNotifications";

const projectInput = z.object({ projectId: z.number().int().positive() });
const riskInput = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(3).max(220),
  description: z.string().max(5000).nullable().optional(),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  status: z.enum(["open", "mitigating", "accepted", "closed"]).default("open"),
  ownerId: z.number().int().positive().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  mitigation: z.string().max(5000).nullable().optional(),
});
const milestoneInput = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(3).max(220),
  description: z.string().max(5000).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(["planned", "in_progress", "delayed", "done", "cancelled"]).default("planned"),
  ownerId: z.number().int().positive().nullable().optional(),
});
const deliveryInput = milestoneInput.extend({
  milestoneId: z.number().int().positive().nullable().optional(),
  status: z
    .enum(["planned", "in_progress", "delayed", "delivered", "cancelled"])
    .default("planned"),
});
const decisionInput = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(3).max(220),
  context: z.string().max(5000).nullable().optional(),
  status: z.enum(["pending", "approved", "rejected", "deferred"]).default("pending"),
  ownerId: z.number().int().positive().nullable().optional(),
  deciderId: z.number().int().positive().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  decision: z.string().max(5000).nullable().optional(),
  impact: z.string().max(5000).nullable().optional(),
});
const lifecycleInput = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("risk"),
    id: z.number().int().positive(),
    projectId: z.number().int().positive(),
    data: riskInput.omit({ projectId: true }).partial(),
  }),
  z.object({
    entity: z.literal("milestone"),
    id: z.number().int().positive(),
    projectId: z.number().int().positive(),
    data: milestoneInput.omit({ projectId: true }).partial(),
  }),
  z.object({
    entity: z.literal("delivery"),
    id: z.number().int().positive(),
    projectId: z.number().int().positive(),
    data: deliveryInput.omit({ projectId: true }).partial(),
  }),
  z.object({
    entity: z.literal("decision"),
    id: z.number().int().positive(),
    projectId: z.number().int().positive(),
    data: decisionInput.omit({ projectId: true }).partial(),
  }),
]);
const archiveInput = z.object({
  entity: z.enum(["risk", "milestone", "delivery", "decision"]),
  id: z.number().int().positive(),
  projectId: z.number().int().positive(),
});

export const governanceRouter = router({
  overview: protectedProcedure.input(projectInput).query(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.view");
    const db = await requireDb();
    const [riskList, milestoneList, deliveryList, decisionList, history] = await Promise.all([
      db
        .select()
        .from(risks)
        .where(and(eq(risks.projectId, input.projectId), isNull(risks.archivedAt)))
        .orderBy(desc(risks.impact)),
      db
        .select()
        .from(milestones)
        .where(and(eq(milestones.projectId, input.projectId), isNull(milestones.archivedAt)))
        .orderBy(asc(milestones.dueDate)),
      db
        .select()
        .from(deliveries)
        .where(and(eq(deliveries.projectId, input.projectId), isNull(deliveries.archivedAt)))
        .orderBy(asc(deliveries.dueDate)),
      db
        .select()
        .from(decisions)
        .where(and(eq(decisions.projectId, input.projectId), isNull(decisions.archivedAt)))
        .orderBy(asc(decisions.dueDate)),
      db
        .select()
        .from(auditEvents)
        .where(
          or(
            and(
              eq(auditEvents.entityType, "project"),
              eq(auditEvents.entityId, String(input.projectId))
            ),
            sql`JSON_UNQUOTE(JSON_EXTRACT(${auditEvents.metadata}, '$.projectId')) = ${String(input.projectId)}`
          )
        )
        .orderBy(desc(auditEvents.createdAt))
        .limit(50),
    ]);
    return {
      risks: riskList,
      milestones: milestoneList,
      deliveries: deliveryList,
      decisions: decisionList,
      history,
    };
  }),
  createRisk: protectedProcedure.input(riskInput).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    const [r] = await db.insert(risks).values({ ...input, createdBy: ctx.user.id });
    const id = Number(r.insertId);
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "risk",
      entityId: id,
      action: "created",
      summary: `Risco ${input.title} registrado.`,
      metadata: { projectId: input.projectId },
    });
    await notifyProjectParticipants({
      projectId: input.projectId,
      actorUserId: ctx.user.id,
      type: "risk_created",
      title: "Novo risco registrado",
      message: input.title,
      severity: input.impact >= 4 ? "critical" : "attention",
      sourceEntityType: "risk",
      sourceEntityId: id,
    });
    return { id };
  }),
  createMilestone: protectedProcedure.input(milestoneInput).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    const [r] = await db.insert(milestones).values(input);
    const id = Number(r.insertId);
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "milestone",
      entityId: id,
      action: "created",
      summary: `Marco ${input.title} criado.`,
      metadata: { projectId: input.projectId },
    });
    await notifyProjectParticipants({
      projectId: input.projectId,
      actorUserId: ctx.user.id,
      type: "milestone_created",
      title: "Novo marco",
      message: input.title,
      sourceEntityType: "milestone",
      sourceEntityId: id,
    });
    return { id };
  }),
  createDelivery: protectedProcedure.input(deliveryInput).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    const [r] = await db.insert(deliveries).values(input);
    const id = Number(r.insertId);
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "delivery",
      entityId: id,
      action: "created",
      summary: `Entrega ${input.title} criada.`,
      metadata: { projectId: input.projectId },
    });
    await notifyProjectParticipants({
      projectId: input.projectId,
      actorUserId: ctx.user.id,
      type: "delivery_created",
      title: "Nova entrega",
      message: input.title,
      sourceEntityType: "delivery",
      sourceEntityId: id,
    });
    return { id };
  }),
  createDecision: protectedProcedure.input(decisionInput).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    const [r] = await db.insert(decisions).values({
      ...input,
      createdBy: ctx.user.id,
      decidedAt: input.status === "approved" || input.status === "rejected" ? new Date() : null,
    });
    const id = Number(r.insertId);
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "decision",
      entityId: id,
      action: "created",
      summary: `Decisão ${input.title} registrada.`,
      metadata: { projectId: input.projectId },
    });
    await notifyProjectParticipants({
      projectId: input.projectId,
      actorUserId: ctx.user.id,
      type: "decision_created",
      title: "Nova decisão",
      message: input.title,
      severity: input.status === "pending" ? "attention" : "info",
      sourceEntityType: "decision",
      sourceEntityId: id,
    });
    return { id };
  }),
  updateLifecycle: protectedProcedure.input(lifecycleInput).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    if (input.entity === "risk")
      await db
        .update(risks)
        .set(input.data)
        .where(and(eq(risks.id, input.id), eq(risks.projectId, input.projectId)));
    if (input.entity === "milestone")
      await db
        .update(milestones)
        .set(input.data)
        .where(and(eq(milestones.id, input.id), eq(milestones.projectId, input.projectId)));
    if (input.entity === "delivery")
      await db
        .update(deliveries)
        .set(input.data)
        .where(and(eq(deliveries.id, input.id), eq(deliveries.projectId, input.projectId)));
    if (input.entity === "decision") {
      const terminal = input.data.status === "approved" || input.data.status === "rejected";
      await db
        .update(decisions)
        .set({
          ...input.data,
          ...(input.data.status ? { decidedAt: terminal ? new Date() : null } : {}),
        })
        .where(and(eq(decisions.id, input.id), eq(decisions.projectId, input.projectId)));
    }
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: input.entity,
      entityId: input.id,
      action: "updated",
      summary: `${input.entity} atualizado.`,
      metadata: { projectId: input.projectId, fields: Object.keys(input.data) },
    });
    return { success: true };
  }),
  archiveLifecycle: protectedProcedure.input(archiveInput).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    const archivedAt = new Date();
    if (input.entity === "risk")
      await db
        .update(risks)
        .set({ archivedAt })
        .where(and(eq(risks.id, input.id), eq(risks.projectId, input.projectId)));
    if (input.entity === "milestone")
      await db
        .update(milestones)
        .set({ archivedAt })
        .where(and(eq(milestones.id, input.id), eq(milestones.projectId, input.projectId)));
    if (input.entity === "delivery")
      await db
        .update(deliveries)
        .set({ archivedAt })
        .where(and(eq(deliveries.id, input.id), eq(deliveries.projectId, input.projectId)));
    if (input.entity === "decision")
      await db
        .update(decisions)
        .set({ archivedAt })
        .where(and(eq(decisions.id, input.id), eq(decisions.projectId, input.projectId)));
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: input.entity,
      entityId: input.id,
      action: "archived",
      summary: `${input.entity} arquivado.`,
      metadata: { projectId: input.projectId },
    });
    return { success: true };
  }),
});
