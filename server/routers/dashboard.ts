import { and, asc, count, eq, isNull, lt, ne, sql } from "drizzle-orm";
import {
  auditEvents,
  companies,
  decisions,
  deliveries,
  projectActions,
  projects,
  projectStatuses,
  risks,
  users,
} from "../../drizzle/schema";
import { requireDb } from "../data/database";
import { protectedProcedure, router } from "../_core/trpc";
import { assertPermission } from "../lib/rbac";
export const dashboardRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "dashboard.view");
    const db = await requireDb();
    const now = new Date();
    const [
      [projectTotal],
      [activeProjects],
      [criticalProjects],
      [openRisks],
      [pendingDecisions],
      [overdueActions],
    ] = await Promise.all([
      db.select({ value: count() }).from(projects),
      db
        .select({ value: count() })
        .from(projects)
        .innerJoin(projectStatuses, eq(projectStatuses.id, projects.statusId))
        .where(ne(projectStatuses.code, "completed")),
      db.select({ value: count() }).from(projects).where(eq(projects.health, "critical")),
      db.select({ value: count() }).from(risks).where(ne(risks.status, "closed")),
      db.select({ value: count() }).from(decisions).where(eq(decisions.status, "pending")),
      db
        .select({ value: count() })
        .from(projectActions)
        .where(
          and(
            lt(projectActions.dueDate, now),
            ne(projectActions.status, "done"),
            ne(projectActions.status, "cancelled")
          )
        ),
    ]);
    const projectList = await db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        progress: projects.progress,
        health: projects.health,
        color: projects.color,
        status: projectStatuses.name,
        statusColor: projectStatuses.color,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .innerJoin(projectStatuses, eq(projectStatuses.id, projects.statusId))
      .orderBy(asc(projects.name));
    const upcoming = await db
      .select({
        id: deliveries.id,
        title: deliveries.title,
        dueDate: deliveries.dueDate,
        status: deliveries.status,
        projectId: deliveries.projectId,
      })
      .from(deliveries)
      .where(ne(deliveries.status, "delivered"))
      .orderBy(asc(deliveries.dueDate))
      .limit(6);
    const recentActivities = await db
      .select({
        id: auditEvents.id,
        action: auditEvents.action,
        summary: auditEvents.summary,
        entityType: auditEvents.entityType,
        createdAt: auditEvents.createdAt,
        actorName: users.name,
      })
      .from(auditEvents)
      .leftJoin(users, eq(users.id, auditEvents.actorUserId))
      .where(ne(auditEvents.entityType, "auth"))
      .orderBy(sql`${auditEvents.createdAt} DESC`)
      .limit(8);
    return {
      totals: {
        projects: projectTotal?.value ?? 0,
        activeProjects: activeProjects?.value ?? 0,
        criticalProjects: criticalProjects?.value ?? 0,
        openRisks: openRisks?.value ?? 0,
        pendingDecisions: pendingDecisions?.value ?? 0,
        overdueActions: overdueActions?.value ?? 0,
      },
      projects: projectList,
      upcoming,
      recentActivities,
      generatedAt: now,
      dataState: projectList.length ? "connected" : "empty",
    };
  }),
  adminSummary: protectedProcedure.query(async ({ ctx }) => {
    await assertPermission(ctx.user, "admin.view");
    const db = await requireDb();
    const [rows, byCompany, byArea, byModality] = await Promise.all([
      db.execute(sql`
      SELECT 'Empresas' label, COUNT(*) value FROM companies
      UNION ALL SELECT 'Áreas', COUNT(*) FROM areas
      UNION ALL SELECT 'Usuários', COUNT(*) FROM users
      UNION ALL SELECT 'Projetos', COUNT(*) FROM projects
      UNION ALL SELECT 'Projetos ativos', COUNT(*) FROM projects p
        JOIN project_statuses s ON s.id=p.statusId
        WHERE s.code NOT IN ('completed','cancelled')
      UNION ALL SELECT 'Projetos em atraso', COUNT(*) FROM projects p
        JOIN project_statuses s ON s.id=p.statusId
        WHERE p.endDate < NOW() AND s.code NOT IN ('completed','cancelled')
      UNION ALL SELECT 'Ações abertas', COUNT(*) FROM project_actions WHERE status NOT IN ('done','cancelled')
      UNION ALL SELECT 'Ações atrasadas', COUNT(*) FROM project_actions WHERE dueDate < NOW() AND status NOT IN ('done','cancelled')
    `),
      db.execute(
        sql`SELECT c.shortName label, COUNT(p.id) value FROM companies c
          LEFT JOIN projects p ON p.companyId=c.id
          GROUP BY c.id,c.shortName ORDER BY value DESC,c.shortName`
      ),
      db.execute(
        sql`SELECT a.name label, COUNT(p.id) value FROM areas a
          LEFT JOIN projects p ON p.ownerAreaId=a.id
          GROUP BY a.id,a.name HAVING COUNT(p.id) > 0 ORDER BY value DESC,a.name`
      ),
      db.execute(
        sql`SELECT COALESCE(m.name,'Sem modalidade') label, COUNT(p.id) value FROM projects p
          LEFT JOIN modalities m ON m.id=p.modalityId
          GROUP BY m.id,m.name ORDER BY value DESC`
      ),
    ]);
    return {
      cards: rows[0],
      byCompany: byCompany[0],
      byArea: byArea[0],
      byModality: byModality[0],
      userId: ctx.user.id,
    };
  }),
});
