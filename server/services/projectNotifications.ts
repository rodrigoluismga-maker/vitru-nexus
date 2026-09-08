import { eq } from "drizzle-orm";
import { notifications, projectMembers, projects } from "../../drizzle/schema";
import { requireDb } from "../data/database";

export function resolveProjectParticipantIds(
  managerId: number | null | undefined,
  sponsorId: number | null | undefined,
  memberIds: number[],
  actorUserId?: number | null
) {
  const recipients = new Set<number>();
  if (managerId) recipients.add(managerId);
  if (sponsorId) recipients.add(sponsorId);
  memberIds.forEach(userId => recipients.add(userId));
  if (actorUserId) recipients.delete(actorUserId);
  return Array.from(recipients);
}

export async function notifyProjectParticipants(input: {
  projectId: number;
  actorUserId?: number | null;
  type: string;
  title: string;
  message: string;
  severity?: "info" | "attention" | "critical";
  sourceEntityType: string;
  sourceEntityId: number | string;
}) {
  const db = await requireDb();
  const [project] = await db
    .select({ managerId: projects.managerId, sponsorId: projects.executiveSponsorId })
    .from(projects)
    .where(eq(projects.id, input.projectId))
    .limit(1);
  const members = await db
    .select({ userId: projectMembers.userId })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, input.projectId));
  const recipients = resolveProjectParticipantIds(
    project?.managerId,
    project?.sponsorId,
    members.map(member => member.userId),
    input.actorUserId
  );
  if (!recipients.length) return;
  await db.insert(notifications).values(
    recipients.map(userId => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity ?? "info",
      sourceEntityType: input.sourceEntityType,
      sourceEntityId: String(input.sourceEntityId),
    }))
  );
}
