import { describe, expect, it } from "vitest";
import { buildInvitedUser, normalizeInvitationEmail } from "./services/userInvitations";

describe("user invitations", () => {
  it("normalizes invitation e-mails consistently", () => {
    expect(normalizeInvitationEmail("  Pessoa@Vitru.COM.BR ")).toBe("pessoa@vitru.com.br");
  });

  it("keeps lastSignedIn null until the invited user logs in", () => {
    const invitation = buildInvitedUser({ name: "Pessoa Convidada", email: "pessoa@vitru.com.br" });
    expect(invitation.status).toBe("invited");
    expect(invitation.lastSignedIn).toBeNull();
    expect(invitation.openId).toMatch(/^invited:[0-9a-f-]{36}$/);
  });
});
