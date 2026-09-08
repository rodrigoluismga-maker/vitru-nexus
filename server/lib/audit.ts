import { auditEvents } from "../../drizzle/schema";
import { getDb } from "../db";

export async function recordAudit(input: {
  actorUserId?: number | null;
  entityType: string;
  entityId: string | number;
  action: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values({
    actorUserId: input.actorUserId ?? null,
    entityType: input.entityType,
    entityId: String(input.entityId),
    action: input.action,
    summary: input.summary,
    metadata: input.metadata,
  });
}
