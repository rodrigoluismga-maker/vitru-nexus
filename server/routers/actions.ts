import { and, asc, desc, eq, or } from "drizzle-orm";
import { z } from "zod";
import {
  actionChecklistItems,
  actionDependencies,
  auditEvents,
  comments,
  projectActions,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import { idInputSchema } from "../lib/schemas";
import { notifyProjectParticipants } from "../services/projectNotifications";

const actionSchema = z.object({
  projectId: z.number().int().positive(),
  title: z.string().trim().min(3).max(220),
  description: z.string().trim().max(5000).nullable().optional(),
  ownerId: z.number().int().positive().nullable().optional(),
  areaId: z.number().int().positive().nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done", "cancelled"]).default("todo"),
  priorityId: z.number().int().positive().nullable().optional(),
  progress: z.number().int().min(0).max(100).default(0),
  estimatedHours: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
  actualHours: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .nullable()
    .optional(),
});

export const actionsRouter = router({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.view");
      const db = await requireDb();
      return db
        .select({
          id: projectActions.id,
          projectId: projectActions.projectId,
          title: projectActions.title,
          description: projectActions.description,
          ownerId: projectActions.ownerId,
          ownerName: users.name,
          dueDate: projectActions.dueDate,
          status: projectActions.status,
          progress: projectActions.progress,
          priorityId: projectActions.priorityId,
          estimatedHours: projectActions.estimatedHours,
          actualHours: projectActions.actualHours,
          updatedAt: projectActions.updatedAt,
        })
        .from(projectActions)
        .leftJoin(users, eq(users.id, projectActions.ownerId))
        .where(eq(projectActions.projectId, input.projectId))
        .orderBy(asc(projectActions.dueDate));
    }),
  byId: protectedProcedure.input(idInputSchema).query(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.view");
    const db = await requireDb();
    const [action] = await db
      .select()
      .from(projectActions)
      .where(eq(projectActions.id, input.id))
      .limit(1);
    if (!action) return null;
    const [checklist, thread, dependencies, history] = await Promise.all([
      db
        .select()
        .from(actionChecklistItems)
        .where(eq(actionChecklistItems.actionId, input.id))
        .orderBy(asc(actionChecklistItems.sortOrder)),
      db
        .select({
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
          editedAt: comments.editedAt,
          authorId: comments.authorId,
          authorName: users.name,
          authorPhoto: users.photoUrl,
        })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.authorId))
        .where(eq(comments.actionId, input.id))
        .orderBy(desc(comments.createdAt)),
      db
        .select({
          actionId: actionDependencies.actionId,
          dependsOnActionId: actionDependencies.dependsOnActionId,
          title: projectActions.title,
          status: projectActions.status,
        })
        .from(actionDependencies)
        .innerJoin(projectActions, eq(projectActions.id, actionDependencies.dependsOnActionId))
        .where(eq(actionDependencies.actionId, input.id)),
      db
        .select({
          id: auditEvents.id,
          action: auditEvents.action,
          summary: auditEvents.summary,
          createdAt: auditEvents.createdAt,
          actorUserId: auditEvents.actorUserId,
        })
        .from(auditEvents)
        .where(
          and(eq(auditEvents.entityType, "action"), eq(auditEvents.entityId, String(input.id)))
        )
        .orderBy(desc(auditEvents.createdAt)),
    ]);
    return { action, checklist, comments: thread, dependencies, history };
  }),
  create: protectedProcedure.input(actionSchema).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "governance.manage");
    const db = await requireDb();
    const [r] = await db
      .insert(projectActions)
      .values({ ...input, createdBy: ctx.user.id, updatedBy: ctx.user.id });
    const id = Number(r.insertId);
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "action",
      entityId: id,
      action: "created",
      summary: `Ação ${input.title} criada.`,
      metadata: { projectId: input.projectId },
    });
    await notifyProjectParticipants({
      projectId: input.projectId,
      actorUserId: ctx.user.id,
      type: "action_created",
      title: "Nova ação no projeto",
      message: input.title,
      sourceEntityType: "action",
      sourceEntityId: id,
    });
    return { id };
  }),
  update: protectedProcedure
    .input(idInputSchema.extend({ data: actionSchema.omit({ projectId: true }).partial() }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      const [existing] = await db
        .select({ projectId: projectActions.projectId, title: projectActions.title })
        .from(projectActions)
        .where(eq(projectActions.id, input.id))
        .limit(1);
      await db
        .update(projectActions)
        .set({ ...input.data, updatedBy: ctx.user.id })
        .where(eq(projectActions.id, input.id));
      if (existing) {
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "action",
          entityId: input.id,
          action: "updated",
          summary: "Ação atualizada.",
          metadata: { projectId: existing.projectId },
        });
        await notifyProjectParticipants({
          projectId: existing.projectId,
          actorUserId: ctx.user.id,
          type: "action_updated",
          title: "Ação atualizada",
          message: input.data.title ?? existing.title,
          sourceEntityType: "action",
          sourceEntityId: input.id,
        });
      }
      return { success: true };
    }),
  addChecklistItem: protectedProcedure
    .input(
      z.object({ actionId: z.number().int().positive(), label: z.string().trim().min(2).max(240) })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      const [r] = await db.insert(actionChecklistItems).values(input);
      return { id: Number(r.insertId) };
    }),
  toggleChecklistItem: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), completed: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      const [item] = await db
        .select({
          actionId: actionChecklistItems.actionId,
          projectId: projectActions.projectId,
          label: actionChecklistItems.label,
        })
        .from(actionChecklistItems)
        .innerJoin(projectActions, eq(projectActions.id, actionChecklistItems.actionId))
        .where(eq(actionChecklistItems.id, input.id))
        .limit(1);
      await db
        .update(actionChecklistItems)
        .set({
          isCompleted: input.completed,
          completedAt: input.completed ? new Date() : null,
          completedBy: input.completed ? ctx.user.id : null,
        })
        .where(eq(actionChecklistItems.id, input.id));
      if (item)
        await recordAudit({
          actorUserId: ctx.user.id,
          entityType: "action",
          entityId: item.actionId,
          action: input.completed ? "checklist_completed" : "checklist_reopened",
          summary: `${item.label} ${input.completed ? "concluído" : "reaberto"}.`,
          metadata: { projectId: item.projectId, checklistItemId: input.id },
        });
      return { success: true };
    }),
  addComment: protectedProcedure
    .input(
      z.object({
        actionId: z.number().int().positive(),
        projectId: z.number().int().positive(),
        content: z.string().trim().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      const [r] = await db.insert(comments).values({ ...input, authorId: ctx.user.id });
      const id = Number(r.insertId);
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "action",
        entityId: input.actionId,
        action: "commented",
        summary: "Comentário adicionado à ação.",
      });
      return { id };
    }),
  addDependency: protectedProcedure
    .input(
      z.object({
        actionId: z.number().int().positive(),
        dependsOnActionId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      if (input.actionId === input.dependsOnActionId)
        throw new Error("Uma ação não pode depender dela mesma.");
      const db = await requireDb();
      const rows = await db
        .select({
          id: projectActions.id,
          projectId: projectActions.projectId,
          title: projectActions.title,
        })
        .from(projectActions)
        .where(
          or(eq(projectActions.id, input.actionId), eq(projectActions.id, input.dependsOnActionId))
        );
      if (rows.length !== 2 || rows[0]?.projectId !== rows[1]?.projectId)
        throw new Error("A dependência deve pertencer ao mesmo projeto.");
      await db
        .insert(actionDependencies)
        .values(input)
        .onDuplicateKeyUpdate({ set: { actionId: input.actionId } });
      const current = rows.find(item => item.id === input.actionId);
      const dependency = rows.find(item => item.id === input.dependsOnActionId);
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "action",
        entityId: input.actionId,
        action: "dependency_added",
        summary: `Dependência adicionada: ${dependency?.title ?? "ação"}.`,
        metadata: { projectId: current?.projectId, dependsOnActionId: input.dependsOnActionId },
      });
      return { success: true };
    }),
  removeDependency: protectedProcedure
    .input(
      z.object({
        actionId: z.number().int().positive(),
        dependsOnActionId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "governance.manage");
      const db = await requireDb();
      await db
        .delete(actionDependencies)
        .where(
          and(
            eq(actionDependencies.actionId, input.actionId),
            eq(actionDependencies.dependsOnActionId, input.dependsOnActionId)
          )
        );
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "action",
        entityId: input.actionId,
        action: "dependency_removed",
        summary: "Dependência removida da ação.",
      });
      return { success: true };
    }),
});
