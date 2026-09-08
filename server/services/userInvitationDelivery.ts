import { desc, eq } from "drizzle-orm";
import { userInvitations } from "../../drizzle/schema";
import { requireDb } from "../data/database";
import { recordAudit } from "../lib/audit";
import { buildInvitationTemplate } from "./invitationTemplate";
import {
  getMicrosoftGraphConfig,
  sendMicrosoftGraphMail,
  type GraphMailResult,
} from "./microsoftGraphMail";

export type DeliverUserInvitationInput = {
  userId: number;
  recipientName: string;
  recipientEmail: string;
  requestedBy: number;
};

export async function deliverUserInvitation(
  input: DeliverUserInvitationInput,
  sendMail: (input: {
    to: string;
    subject: string;
    html: string;
  }) => Promise<GraphMailResult> = sendMicrosoftGraphMail
) {
  const db = await requireDb();
  const [latest] = await db
    .select({ attempt: userInvitations.attempt })
    .from(userInvitations)
    .where(eq(userInvitations.userId, input.userId))
    .orderBy(desc(userInvitations.requestedAt))
    .limit(1);
  const attempt = (latest?.attempt ?? 0) + 1;
  const senderEmail = getMicrosoftGraphConfig().senderEmail || null;
  const [inserted] = await db.insert(userInvitations).values({
    userId: input.userId,
    recipientEmail: input.recipientEmail,
    senderEmail,
    attempt,
    requestedBy: input.requestedBy,
    status: "pending",
  });
  const invitationId = Number(inserted.insertId);
  const template = buildInvitationTemplate({ recipientName: input.recipientName });
  const result = await sendMail({
    to: input.recipientEmail,
    subject: template.subject,
    html: template.html,
  });
  const now = new Date();

  if (result.status === "accepted") {
    await db
      .update(userInvitations)
      .set({ status: "accepted", acceptedAt: now, providerRequestId: result.providerRequestId })
      .where(eq(userInvitations.id, invitationId));
    await recordAudit({
      actorUserId: input.requestedBy,
      entityType: "user",
      entityId: input.userId,
      action: attempt === 1 ? "invitation_sent" : "invitation_resent",
      summary: `Convite enviado para ${input.recipientEmail}.`,
      metadata: { invitationId, attempt, provider: "microsoft_graph" },
    });
  } else {
    await db
      .update(userInvitations)
      .set({
        status: "failed",
        failedAt: now,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      })
      .where(eq(userInvitations.id, invitationId));
    await recordAudit({
      actorUserId: input.requestedBy,
      entityType: "user",
      entityId: input.userId,
      action: "invitation_failed",
      summary: `Falha ao enviar convite para ${input.recipientEmail}.`,
      metadata: { invitationId, attempt, provider: "microsoft_graph", errorCode: result.errorCode },
    });
  }
  return { invitationId, attempt, ...result };
}
