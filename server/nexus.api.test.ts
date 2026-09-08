import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { ensureNoArchiveReferences } from "./data/adminRepository";
import { resolveProjectParticipantIds } from "./services/projectNotifications";
import { totalPages } from "../shared/pagination";

function context(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const admin = {
  id: 1,
  openId: "admin",
  email: "admin@vitru.com",
  name: "Admin",
  loginMethod: "manus",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  photoKey: null,
  photoUrl: null,
  jobTitle: null,
  areaId: null,
  companyId: null,
  roleProfileId: null,
  phone: null,
  status: "active" as const,
};
const restrictedUser = {
  ...admin,
  id: 987654321,
  openId: "restricted-user",
  email: "restricted@vitru.com",
  name: "Restricted",
  role: "user" as const,
};

describe("Critical API contracts", () => {
  it("rejects unauthenticated access before dashboard data access", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.dashboard.summary()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an unsafe document format before storage or database access", async () => {
    const caller = appRouter.createCaller(context(admin));
    await expect(
      caller.documents.upload({
        projectId: 1,
        title: "Executável",
        fileName: "arquivo.exe",
        mimeType: "application/x-msdownload",
        dataBase64: "YQ==",
      })
    ).rejects.toThrow("Tipo de arquivo não permitido");
  });

  it("rejects a self-referencing action dependency before database access", async () => {
    const caller = appRouter.createCaller(context(admin));
    await expect(
      caller.actions.addDependency({ actionId: 4, dependsOnActionId: 4 })
    ).rejects.toThrow("não pode depender dela mesma");
  });

  it("rejects unauthenticated access to expansion portfolio data", async () => {
    const caller = appRouter.createCaller(context(null));
    await expect(caller.expansion.overview({ projectId: 2 })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("validates city state codes before database access", async () => {
    const caller = appRouter.createCaller(context(admin));
    await expect(
      caller.expansion.cities.create({ projectId: 2, name: "Cidade teste", stateCode: "P" })
    ).rejects.toThrow();
  });

  it("validates expansion metric codes before database access", async () => {
    const caller = appRouter.createCaller(context(admin));
    await expect(
      caller.expansion.metrics.create({
        projectId: 2,
        metricCode: "Matrículas 2027",
        name: "Matrículas",
        periodLabel: "2027",
      })
    ).rejects.toThrow();
  });

  it("blocks invitation administration without users.manage", async () => {
    const caller = appRouter.createCaller(context(restrictedUser));
    await expect(
      caller.admin.users.create({ name: "Pessoa", email: "pessoa@vitru.com" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.users.resendInvitation({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.admin.users.invitationHistory({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(caller.admin.users.invitationConfiguration()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("blocks invitation status visibility without admin.view", async () => {
    const caller = appRouter.createCaller(context(restrictedUser));
    await expect(caller.admin.users.invitationStatus({ userIds: [] })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("returns no financial capabilities and blocks financial context without a finance profile", async () => {
    const caller = appRouter.createCaller(context(restrictedUser));
    const access = await caller.finance.access();
    expect(access.allowed).toBe(false);
    expect(Object.values(access.capabilities).every(value => value === false)).toBe(true);
    await expect(caller.finance.context()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("Service and administrative calculations", () => {
  it("deduplicates recipients and excludes the actor", () => {
    expect(resolveProjectParticipantIds(1, 2, [2, 3, 3, 4], 2)).toEqual([1, 3, 4]);
  });

  it("calculates pages and blocks archive with active references", () => {
    expect(totalPages(21, 10)).toBe(3);
    expect(totalPages(0, 10)).toBe(1);
    expect(() => ensureNoArchiveReferences(2)).toThrow("Arquivamento bloqueado");
    expect(() => ensureNoArchiveReferences(0)).not.toThrow();
  });
});
