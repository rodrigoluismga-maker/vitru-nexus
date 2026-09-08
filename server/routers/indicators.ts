import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { projectIndicators } from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import { idInputSchema } from "../lib/schemas";
import { notifyProjectParticipants } from "../services/projectNotifications";

const indicatorSchema = z.object({
  projectId: z.number().int().positive(),
  name: z.string().trim().min(2).max(180),
  description: z.string().max(3000).nullable().optional(),
  unit: z.string().max(40).nullable().optional(),
  direction: z.enum(["higher", "lower", "target"]).default("target"),
  targetValue: z.string().nullable().optional(),
  currentValue: z.string().nullable().optional(),
  periodLabel: z.string().max(80).nullable().optional(),
  source: z.string().max(255).nullable().optional(),
  status: z.enum(["on_track", "attention", "critical", "unassessed"]).default("unassessed"),
  ownerId: z.number().int().positive().nullable().optional(),
  measuredAt: z.coerce.date().nullable().optional(),
});

export const indicatorsRouter = router({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.view");
      const db = await requireDb();
      return db
        .select()
        .from(projectIndicators)
        .where(eq(projectIndicators.projectId, input.projectId))
        .orderBy(asc(projectIndicators.name));
    }),
  create: protectedProcedure.input(indicatorSchema).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    const [result] = await db.insert(projectIndicators).values(input);
    const id = Number(result.insertId);
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "indicator",
      entityId: id,
      action: "created",
      summary: `Indicador ${input.name} criado.`,
      metadata: { projectId: input.projectId },
    });
    await notifyProjectParticipants({
      projectId: input.projectId,
      actorUserId: ctx.user.id,
      type: "indicator_updated",
      title: "Indicador adicionado",
      message: input.name,
      sourceEntityType: "indicator",
      sourceEntityId: id,
    });
    return { id };
  }),
  update: protectedProcedure
    .input(
      idInputSchema.extend({
        data: indicatorSchema.omit({ projectId: true }).partial(),
        projectId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      await db.update(projectIndicators).set(input.data).where(eq(projectIndicators.id, input.id));
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "indicator",
        entityId: input.id,
        action: "updated",
        summary: "Indicador atualizado.",
        metadata: { projectId: input.projectId },
      });
      return { success: true };
    }),
});
