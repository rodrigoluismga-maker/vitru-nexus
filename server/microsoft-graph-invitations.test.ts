import { describe, expect, it, vi } from "vitest";
import { buildInvitationTemplate } from "./services/invitationTemplate";
import {
  getMicrosoftGraphMailReadiness,
  sendMicrosoftGraphMail,
  type MicrosoftGraphConfig,
} from "./services/microsoftGraphMail";

const config: MicrosoftGraphConfig = {
  tenantId: "tenant-id",
  clientId: "client-id",
  clientSecret: "client-secret",
  senderEmail: "nexus@vitru.com.br",
};

describe("Microsoft Graph invitations", () => {
  it("builds a branded, safe invitation without local password instructions", () => {
    const template = buildInvitationTemplate({ recipientName: '<Rodrigo & "Time">' });
    expect(template.subject).toBe("Seu acesso ao Vitru Nexus");
    expect(template.html).toContain("https://vitrunexus.com");
    expect(template.html).toContain("&lt;Rodrigo &amp; &quot;Time&quot;&gt;");
    expect(template.text).toContain("Não é necessário criar uma nova senha");
  });

  it("reports missing Microsoft configuration without exposing values", () => {
    const readiness = getMicrosoftGraphMailReadiness({
      tenantId: "",
      clientId: "id",
      clientSecret: "",
      senderEmail: "",
    });
    expect(readiness.configured).toBe(false);
    expect(readiness.missing).toEqual(["tenantId", "clientSecret", "senderEmail"]);
  });

  it("requests a client-credentials token and accepts a Graph 202 response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(null, { status: 202, headers: { "request-id": "graph-request-id" } })
      );

    const result = await sendMicrosoftGraphMail(
      { to: "pessoa@vitru.com.br", subject: "Convite", html: "<p>Convite</p>" },
      { config, fetchImpl }
    );
    expect(result).toEqual({ status: "accepted", providerRequestId: "graph-request-id" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0]?.[0]).toContain("tenant-id/oauth2/v2.0/token");
    expect(String(fetchImpl.mock.calls[0]?.[1]?.body)).toContain(
      "scope=https%3A%2F%2Fgraph.microsoft.com%2F.default"
    );
    expect(fetchImpl.mock.calls[1]?.[0]).toContain("users/nexus%40vitru.com.br/sendMail");
  });

  it("returns a provider failure without throwing or losing the user invitation", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "access-token" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: "ErrorAccessDenied", message: "Mailbox scope denied" } }),
          { status: 403, headers: { "content-type": "application/json" } }
        )
      );

    await expect(
      sendMicrosoftGraphMail(
        { to: "pessoa@vitru.com.br", subject: "Convite", html: "<p>Convite</p>" },
        { config, fetchImpl }
      )
    ).resolves.toEqual({
      status: "failed",
      errorCode: "ErrorAccessDenied",
      errorMessage: "Mailbox scope denied",
    });
  });
});
