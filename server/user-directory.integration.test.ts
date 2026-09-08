import { and, desc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  areas,
  auditEvents,
  companies,
  roleProfiles,
  userInvitations,
  users,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getDb, upsertUser } from "./db";
import { appRouter } from "./routers";
import { createAdminRouter } from "./routers/admin";
import { deliverUserInvitation } from "./services/userInvitationDelivery";

describe.sequential("user directory integration", () => {
  it("creates an invitation, blocks duplicate e-mail and persists organizational links", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is required for this integration test");

    const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    const [company] = await db.select({ id: companies.id }).from(companies).limit(1);
    const [area] = await db.select({ id: areas.id }).from(areas).limit(1);
    const [profile] = await db.select({ id: roleProfiles.id }).from(roleProfiles).limit(1);
    if (!admin || !company || !area || !profile)
      throw new Error("Base administrativa incompleta para o teste de diretório");

    const context: TrpcContext = {
      user: admin,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(context);
    const email = `nexus-user-flow-${Date.now()}@example.invalid`;
    let createdId: number | undefined;

    try {
      const created = await caller.admin.users.create({
        name: "Validação Diretório",
        email: `  ${email.toUpperCase()}  `,
        companyId: company.id,
        areaId: area.id,
        roleProfileId: profile.id,
        jobTitle: "Teste automatizado",
        phone: null,
      });
      createdId = created.id;

      const [invited] = await db.select().from(users).where(eq(users.id, created.id)).limit(1);
      expect(invited).toMatchObject({
        email,
        status: "invited",
        companyId: company.id,
        areaId: area.id,
        roleProfileId: profile.id,
      });
      expect(invited?.lastSignedIn).toBeNull();
      expect(invited?.openId).toMatch(/^invited:/);

      const invitationRouter = createAdminRouter({
        deliverInvitation: input =>
          deliverUserInvitation(input, async () => ({
            status: "accepted",
            providerRequestId: "integration-request-id",
          })),
      });
      const invitationCaller = invitationRouter.createCaller(context);
      const resent = await invitationCaller.users.resendInvitation({ id: created.id });
      expect(resent).toMatchObject({
        status: "accepted",
        attempt: 2,
        providerRequestId: "integration-request-id",
      });
      const invitationHistory = await invitationCaller.users.invitationHistory({ id: created.id });
      expect(invitationHistory[0]).toMatchObject({ status: "accepted", attempt: 2 });
      expect(invitationHistory[1]).toMatchObject({ status: "failed", attempt: 1 });

      await expect(caller.admin.users.create({ name: "Duplicado", email })).rejects.toMatchObject({
        code: "CONFLICT",
      });

      const corporateOpenId = `corporate:${Date.now()}`;
      await upsertUser({
        openId: corporateOpenId,
        name: "Validação Diretório",
        email,
        loginMethod: "corporate",
        lastSignedIn: new Date(),
      });
      const [activated] = await db.select().from(users).where(eq(users.id, created.id)).limit(1);
      const [latestInvitation] = await db
        .select()
        .from(userInvitations)
        .where(eq(userInvitations.userId, created.id))
        .orderBy(desc(userInvitations.requestedAt))
        .limit(1);
      expect(activated?.status).toBe("active");
      expect(activated?.openId).toMatch(/^corporate:/);
      expect(latestInvitation?.status).toBe("activated");
      expect(latestInvitation?.activatedAt).toBeInstanceOf(Date);

      await caller.admin.users.update({
        id: created.id,
        data: {
          jobTitle: "Vínculos validados",
          companyId: company.id,
          areaId: area.id,
          roleProfileId: profile.id,
          status: "inactive",
        },
      });
      const [updated] = await db.select().from(users).where(eq(users.id, created.id)).limit(1);
      expect(updated).toMatchObject({ jobTitle: "Vínculos validados", status: "inactive" });
      await expect(
        invitationCaller.users.resendInvitation({ id: created.id })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      await expect(
        upsertUser({ openId: corporateOpenId, email, lastSignedIn: new Date() })
      ).rejects.toMatchObject({ reason: "inactive" });
      const [stillInactive] = await db
        .select()
        .from(users)
        .where(eq(users.id, created.id))
        .limit(1);
      expect(stillInactive?.status).toBe("inactive");

      await expect(
        upsertUser({
          openId: `unregistered:${Date.now()}`,
          email: `unknown-${email}`,
          lastSignedIn: new Date(),
        })
      ).rejects.toMatchObject({ reason: "not_invited" });
    } finally {
      if (createdId) {
        await db
          .delete(auditEvents)
          .where(and(eq(auditEvents.entityType, "user"), eq(auditEvents.entityId, createdId)));
        await db.delete(users).where(eq(users.id, createdId));
      }
    }
  });
});
