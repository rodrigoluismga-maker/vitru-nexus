import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  areas,
  companies,
  modalities,
  priorities,
  projectCategories,
  projectMembers,
  projectStatuses,
  projects,
  users,
} from "../../drizzle/schema";
import { protectedProcedure, router } from "../_core/trpc";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { assertPermission } from "../lib/rbac";
import { idInputSchema, projectSchema } from "../lib/schemas";
import { notifyProjectParticipants } from "../services/projectNotifications";

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "projects.view");
    const db = await requireDb();
    return db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        description: projects.description,
        objective: projects.objective,
        progress: projects.progress,
        health: projects.health,
        color: projects.color,
        icon: projects.icon,
        coverUrl: projects.coverUrl,
        workspaceTemplate: projects.workspaceTemplate,
        startDate: projects.startDate,
        endDate: projects.endDate,
        updatedAt: projects.updatedAt,
        companyId: projects.companyId,
        ownerAreaId: projects.ownerAreaId,
        modalityId: projects.modalityId,
        managerId: projects.managerId,
        executiveSponsorId: projects.executiveSponsorId,
        categoryId: projects.categoryId,
        statusId: projects.statusId,
        priorityId: projects.priorityId,
        company: companies.shortName,
        area: areas.name,
        modality: modalities.name,
        category: projectCategories.name,
        status: projectStatuses.name,
        statusCode: projectStatuses.code,
        statusColor: projectStatuses.color,
        priority: priorities.name,
        priorityColor: priorities.color,
      })
      .from(projects)
      .innerJoin(companies, eq(companies.id, projects.companyId))
      .innerJoin(areas, eq(areas.id, projects.ownerAreaId))
      .leftJoin(modalities, eq(modalities.id, projects.modalityId))
      .innerJoin(projectCategories, eq(projectCategories.id, projects.categoryId))
      .innerJoin(projectStatuses, eq(projectStatuses.id, projects.statusId))
      .innerJoin(priorities, eq(priorities.id, projects.priorityId))
      .orderBy(asc(projects.name));
  }),
  byId: protectedProcedure.input(idInputSchema).query(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "projects.view");
    const db = await requireDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
    return project ?? null;
  }),
  workspaceContext: protectedProcedure.input(idInputSchema).query(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "projects.view");
    const db = await requireDb();
    const [project] = await db.select().from(projects).where(eq(projects.id, input.id)).limit(1);
    if (!project) return null;
    const memberList = await db
      .select({
        userId: users.id,
        name: users.name,
        email: users.email,
        jobTitle: users.jobTitle,
        photoUrl: users.photoUrl,
        memberRole: projectMembers.memberRole,
        responsibility: projectMembers.responsibility,
        isPrimary: projectMembers.isPrimary,
      })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .where(eq(projectMembers.projectId, input.id));
    const [manager] = project.managerId
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            jobTitle: users.jobTitle,
            photoUrl: users.photoUrl,
          })
          .from(users)
          .where(eq(users.id, project.managerId))
          .limit(1)
      : [];
    const [sponsor] = project.executiveSponsorId
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            jobTitle: users.jobTitle,
            photoUrl: users.photoUrl,
          })
          .from(users)
          .where(eq(users.id, project.executiveSponsorId))
          .limit(1)
      : [];
    return { project, manager: manager ?? null, sponsor: sponsor ?? null, members: memberList };
  }),
  create: protectedProcedure.input(projectSchema).mutation(async ({ ctx, input }) => {
    await assertPermission(ctx.user, "projects.manage");
    const db = await requireDb();
    const [result] = await db
      .insert(projects)
      .values({ ...input, createdBy: ctx.user.id, updatedBy: ctx.user.id });
    const id = Number(result.insertId);
    await recordAudit({
      actorUserId: ctx.user.id,
      entityType: "project",
      entityId: id,
      action: "created",
      summary: `Projeto ${input.name} criado.`,
      metadata: { projectId: id },
    });
    await notifyProjectParticipants({
      projectId: id,
      actorUserId: ctx.user.id,
      type: "project_created",
      title: "Novo projeto",
      message: input.name,
      sourceEntityType: "project",
      sourceEntityId: id,
    });
    return { id };
  }),
  update: protectedProcedure
    .input(idInputSchema.extend({ data: projectSchema.partial() }))
    .mutation(async ({ ctx, input }) => {
      await assertPermission(ctx.user, "projects.manage");
      const db = await requireDb();
      await db
        .update(projects)
        .set({ ...input.data, updatedBy: ctx.user.id })
        .where(eq(projects.id, input.id));
      await recordAudit({
        actorUserId: ctx.user.id,
        entityType: "project",
        entityId: input.id,
        action: "updated",
        summary: "Projeto atualizado.",
        metadata: { projectId: input.id },
      });
      await notifyProjectParticipants({
        projectId: input.id,
        actorUserId: ctx.user.id,
        type: "project_updated",
        title: "Projeto atualizado",
        message: input.data.name ?? "Uma informação relevante do projeto foi atualizada.",
        sourceEntityType: "project",
        sourceEntityId: input.id,
      });
      return { success: true };
    }),
});
