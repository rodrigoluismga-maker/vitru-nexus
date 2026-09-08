import { describe, expect, it } from "vitest";
import { canAccessDocument } from "./services/documentAccess";
import { hasValidDocumentSignature } from "./routers/documents";
import { isPublicStorageAssetKey } from "./_core/storageProxy";

const base = {
  role: "user" as const,
  roleProfileCode: "viewer",
  memberRole: null,
  isManager: false,
  isSponsor: false,
  isUploader: false,
  canViewPortfolio: false,
  canManageProjects: false,
};

describe("document security", () => {
  it("enforces access levels with least privilege", () => {
    expect(canAccessDocument("project", { ...base, canViewPortfolio: true })).toBe(true);
    expect(canAccessDocument("restricted", { ...base, canViewPortfolio: true })).toBe(false);
    expect(canAccessDocument("restricted", { ...base, isUploader: true })).toBe(true);
    expect(canAccessDocument("executive", { ...base, roleProfileCode: "director" })).toBe(true);
    expect(canAccessDocument("executive", { ...base, roleProfileCode: "manager" })).toBe(false);
    expect(canAccessDocument("executive", { ...base, role: "admin" })).toBe(true);
  });

  it("keeps private document and finance keys out of the legacy proxy", () => {
    expect(isPublicStorageAssetKey("vitru-logo-negativa.webp")).toBe(true);
    expect(isPublicStorageAssetKey("nexus-media/project_cover/1/image.webp")).toBe(true);
    expect(isPublicStorageAssetKey("nexus/12/board.pdf")).toBe(false);
    expect(isPublicStorageAssetKey("finance/2027/base.xlsx")).toBe(false);
    expect(isPublicStorageAssetKey("nexus-media/../nexus/board.pdf")).toBe(false);
  });

  it("validates file signatures instead of trusting the client MIME", () => {
    expect(hasValidDocumentSignature("application/pdf", Buffer.from("%PDF-1.7"))).toBe(true);
    expect(
      hasValidDocumentSignature("application/pdf", Buffer.from("<script>alert(1)</script>"))
    ).toBe(false);
    expect(hasValidDocumentSignature("image/png", Buffer.from("89504e470d0a1a0a", "hex"))).toBe(
      true
    );
    expect(
      hasValidDocumentSignature(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        Buffer.from("504b0304", "hex")
      )
    ).toBe(true);
  });
});
