import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  permissions,
  roleProfilePermissions,
  userPermissionOverrides,
  users,
} from "../../drizzle/schema";
import { getDb } from "../db";

type SessionUser = { id: number; role: "user" | "admin" };

export async function hasPermission(user: SessionUser, code: string) {
  if (user.role === "admin") return true;
  const db = await getDb();
  if (!db) return false;

  const [override] = await db
    .select({ effect: userPermissionOverrides.effect })
    .from(userPermissionOverrides)
    .innerJoin(permissions, eq(permissions.id, userPermissionOverrides.permissionId))
    .where(and(eq(userPermissionOverrides.userId, user.id), eq(permissions.code, code)))
    .limit(1);
  if (override) return override.effect === "allow";

  const [allowed] = await db
    .select({ id: permissions.id })
    .from(users)
    .innerJoin(
      roleProfilePermissions,
      eq(roleProfilePermissions.roleProfileId, users.roleProfileId)
    )
    .innerJoin(permissions, eq(permissions.id, roleProfilePermissions.permissionId))
    .where(and(eq(users.id, user.id), eq(permissions.code, code)))
    .limit(1);
  return Boolean(allowed);
}

export async function assertPermission(user: SessionUser, code: string) {
  if (!(await hasPermission(user, code))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não possui permissão para realizar esta ação.",
    });
  }
}
