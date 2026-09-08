import type { Request, Response } from "express";
import { and, eq, lt, ne, or } from "drizzle-orm";
import { decisions, notifications, projectActions, projects } from "../../drizzle/schema";
import { getDb } from "../db";
import { sdk } from "../_core/sdk";

export function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function overdueActionDedupeKey(actionId: number, date = new Date()) {
  return `overdue-action:${actionId}:${dayKey(date)}`;
}
export function pendingDecisionDedupeKey(decisionId: number, date = new Date()) {
  return `pending-decision:${decisionId}:${dayKey(date)}`;
}

export async function governanceAlertsHandler(req: Request, res: Response) {
  try {
    const caller = await sdk.authenticateRequest(req);
    if (!caller.isCron || !caller.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) return res.status(503).json({ error: "database-unavailable" });
    const now = new Date();
    const today = dayKey(now);

    const [overdueActions, pendingDecisions] = await Promise.all([
      db
        .select({
          id: projectActions.id,
          title: projectActions.title,
          dueDate: projectActions.dueDate,
          ownerId: projectActions.ownerId,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(projectActions)
        .innerJoin(projects, eq(projects.id, projectActions.projectId))
        .where(
          and(
            lt(projectActions.dueDate, now),
            ne(projectActions.status, "done"),
            ne(projectActions.status, "cancelled")
          )
        ),
      db
        .select({
          id: decisions.id,
          title: decisions.title,
          dueDate: decisions.dueDate,
          ownerId: decisions.ownerId,
          deciderId: decisions.deciderId,
          projectId: projects.id,
          projectName: projects.name,
        })
        .from(decisions)
        .innerJoin(projects, eq(projects.id, decisions.projectId))
        .where(
          and(
            eq(decisions.status, "pending"),
            or(lt(decisions.dueDate, now), eq(decisions.dueDate, now))
          )
        ),
    ]);

    let created = 0;
    for (const action of overdueActions) {
      if (!action.ownerId) continue;
      await db
        .insert(notifications)
        .values({
          userId: action.ownerId,
          type: "overdue_action",
          title: "Ação vencida",
          message: `${action.title} · ${action.projectName}`,
          severity: "critical",
          sourceEntityType: "action",
          sourceEntityId: String(action.id),
          dueAt: action.dueDate,
          dedupeKey: overdueActionDedupeKey(action.id, now),
        })
        .onDuplicateKeyUpdate({
          set: { message: `${action.title} · ${action.projectName}`, dueAt: action.dueDate },
        });
      created += 1;
    }

    for (const decision of pendingDecisions) {
      const recipientId = decision.deciderId ?? decision.ownerId;
      if (!recipientId) continue;
      await db
        .insert(notifications)
        .values({
          userId: recipientId,
          type: "pending_decision",
          title: "Decisão pendente",
          message: `${decision.title} · ${decision.projectName}`,
          severity: "attention",
          sourceEntityType: "decision",
          sourceEntityId: String(decision.id),
          dueAt: decision.dueDate,
          dedupeKey: pendingDecisionDedupeKey(decision.id, now),
        })
        .onDuplicateKeyUpdate({
          set: { message: `${decision.title} · ${decision.projectName}`, dueAt: decision.dueDate },
        });
      created += 1;
    }

    return res.json({
      ok: true,
      created,
      overdueActions: overdueActions.length,
      pendingDecisions: pendingDecisions.length,
      taskUid: caller.taskUid,
    });
  } catch (error) {
    const normalized = error instanceof Error ? error : new Error("Erro desconhecido");
    return res.status(500).json({
      error: normalized.message,
      stack: normalized.stack,
      context: { url: req.originalUrl },
      timestamp: new Date().toISOString(),
    });
  }
}
