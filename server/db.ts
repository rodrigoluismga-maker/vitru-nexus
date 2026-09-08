import { and, desc, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditEvents, InsertUser, type User, userInvitations, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

export type UserAccessDenialReason = "not_invited" | "inactive" | "blocked" | "identity_mismatch";

export class UserAccessDeniedError extends Error {
  constructor(
    public readonly reason: UserAccessDenialReason,
    public readonly userId?: number
  ) {
    super("User access is not authorized");
    this.name = "UserAccessDeniedError";
  }
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const signedInAt = user.lastSignedIn ?? new Date();
    const normalizedEmail = user.email?.trim().toLowerCase() || null;
    const [existingIdentity] = await db
      .select()
      .from(users)
      .where(eq(users.openId, user.openId))
      .limit(1);

    if (existingIdentity) {
      assertUserCanAuthenticate(existingIdentity);
      await db
        .update(users)
        .set({
          name: user.name ?? existingIdentity.name,
          email: normalizedEmail ?? existingIdentity.email,
          loginMethod: user.loginMethod ?? existingIdentity.loginMethod,
          lastSignedIn: signedInAt,
        })
        .where(eq(users.id, existingIdentity.id));
      return;
    }

    if (normalizedEmail) {
      const [directoryUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      if (directoryUser?.status === "invited" && directoryUser.openId.startsWith("invited:")) {
        const activatedAt = user.lastSignedIn ?? new Date();
        await db
          .update(users)
          .set({
            openId: user.openId,
            name: user.name ?? undefined,
            email: normalizedEmail,
            loginMethod: user.loginMethod ?? undefined,
            lastSignedIn: activatedAt,
            status: "active",
          })
          .where(eq(users.id, directoryUser.id));
        const [latestInvitation] = await db
          .select({ id: userInvitations.id })
          .from(userInvitations)
          .where(eq(userInvitations.userId, directoryUser.id))
          .orderBy(desc(userInvitations.requestedAt), desc(userInvitations.id))
          .limit(1);
        if (latestInvitation)
          await db
            .update(userInvitations)
            .set({ status: "activated", activatedAt })
            .where(eq(userInvitations.id, latestInvitation.id));
        await db.insert(auditEvents).values({
          actorUserId: directoryUser.id,
          entityType: "user",
          entityId: String(directoryUser.id),
          action: "invitation_activated",
          summary: "Convite ativado no primeiro acesso autorizado.",
        });
        return;
      }

      if (directoryUser) {
        const reason: UserAccessDenialReason =
          directoryUser.status === "inactive" || directoryUser.status === "blocked"
            ? directoryUser.status
            : "identity_mismatch";
        await recordAuthenticationDenied(directoryUser.id, reason);
        throw new UserAccessDeniedError(reason, directoryUser.id);
      }
    }

    if (user.openId === ENV.ownerOpenId) {
      await db.insert(users).values({
        openId: user.openId,
        name: user.name ?? "Administrador",
        email: normalizedEmail,
        loginMethod: user.loginMethod ?? null,
        role: "admin",
        status: "active",
        lastSignedIn: signedInAt,
      });
      return;
    }

    await db.insert(auditEvents).values({
      actorUserId: null,
      entityType: "auth",
      entityId: "unregistered",
      action: "authentication_denied_unregistered",
      summary: "Identidade não autorizada tentou acessar o sistema.",
    });
    throw new UserAccessDeniedError("not_invited");
  } catch (error) {
    if (error instanceof UserAccessDeniedError) throw error;
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export function assertUserCanAuthenticate(user: Pick<User, "id" | "status">): void {
  if (user.status === "active") return;
  const reason: UserAccessDenialReason =
    user.status === "inactive" || user.status === "blocked" ? user.status : "not_invited";
  throw new UserAccessDeniedError(reason, user.id);
}

export async function recordAuthenticationDenied(
  userId: number,
  reason: UserAccessDenialReason
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values({
    actorUserId: userId,
    entityType: "user",
    entityId: String(userId),
    action: "authentication_denied",
    summary: `Acesso negado por política de identidade (${reason}).`,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
