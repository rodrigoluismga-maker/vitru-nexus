import { describe, expect, it } from "vitest";
import { assertPermission, hasPermission } from "./lib/rbac";
import { colorSchema, companySchema, pageInputSchema, projectSchema } from "./lib/schemas";
import { isAllowedDocumentMime, MAX_FILE_SIZE } from "./routers/documents";
import {
  dayKey,
  overdueActionDedupeKey,
  pendingDecisionDedupeKey,
} from "./scheduled/governanceAlerts";

describe("Nexus domain validation", () => {
  it("normalizes pagination defaults and enforces limits", () => {
    expect(pageInputSchema.parse({})).toEqual({ search: "", page: 1, pageSize: 20 });
    expect(() => pageInputSchema.parse({ page: 0, pageSize: 101 })).toThrow();
  });

  it("accepts valid Vitru colors and rejects incomplete hex values", () => {
    expect(colorSchema.parse("#6824D3")).toBe("#6824D3");
    expect(() => colorSchema.parse("#6824")).toThrow();
  });

  it("trims company fields and requires the corporate identifiers", () => {
    const parsed = companySchema.parse({
      name: "  Vitru Educação  ",
      shortName: "Vitru",
      acronym: "VITRU",
    });
    expect(parsed.name).toBe("Vitru Educação");
    expect(parsed.status).toBe("active");
  });

  it("rejects invalid project progress and reversed dates", () => {
    const base = {
      name: "Projeto Estratégico",
      code: "PROJ-01",
      companyId: 1,
      ownerAreaId: 1,
      categoryId: 1,
      statusId: 1,
      priorityId: 1,
    };
    expect(() => projectSchema.parse({ ...base, progress: 101 })).toThrow();
    expect(() =>
      projectSchema.parse({
        ...base,
        startDate: new Date("2027-02-01"),
        endDate: new Date("2027-01-01"),
      })
    ).toThrow("A data final não pode ser anterior");
  });
});

describe("Nexus authorization and file rules", () => {
  it("grants administrators without a database roundtrip", async () => {
    await expect(hasPermission({ id: 1, role: "admin" }, "admin.manage")).resolves.toBe(true);
    await expect(
      assertPermission({ id: 1, role: "admin" }, "projects.manage")
    ).resolves.toBeUndefined();
  });

  it("permits governed office and image formats", () => {
    expect(isAllowedDocumentMime("application/pdf")).toBe(true);
    expect(isAllowedDocumentMime("application/x-msdownload")).toBe(false);
    expect(MAX_FILE_SIZE).toBe(15 * 1024 * 1024);
  });
});

describe("Scheduled alert idempotency", () => {
  const date = new Date("2026-09-03T12:00:00.000Z");
  it("creates deterministic daily keys", () => {
    expect(dayKey(date)).toBe("2026-09-03");
    expect(overdueActionDedupeKey(42, date)).toBe("overdue-action:42:2026-09-03");
    expect(pendingDecisionDedupeKey(7, date)).toBe("pending-decision:7:2026-09-03");
  });
});
