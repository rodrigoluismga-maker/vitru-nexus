import { ENV } from "../_core/env";

export type MicrosoftGraphConfig = {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  senderEmail: string;
};

export type GraphMailInput = {
  to: string;
  subject: string;
  html: string;
};

export type GraphMailResult =
  | { status: "accepted"; providerRequestId: string | null }
  | { status: "failed"; errorCode: string; errorMessage: string };

type FetchLike = typeof fetch;

export function getMicrosoftGraphConfig(): MicrosoftGraphConfig {
  return {
    tenantId: ENV.microsoftTenantId,
    clientId: ENV.microsoftClientId,
    clientSecret: ENV.microsoftClientSecret,
    senderEmail: ENV.microsoftSenderEmail,
  };
}

export function getMicrosoftGraphMailReadiness(config = getMicrosoftGraphConfig()) {
  const missing = Object.entries(config)
    .filter(([, value]) => !value.trim())
    .map(([key]) => key);
  return { configured: missing.length === 0, senderEmail: config.senderEmail || null, missing };
}

function providerError(code: string, message: string): GraphMailResult {
  return { status: "failed", errorCode: code, errorMessage: message.slice(0, 500) };
}

export async function sendMicrosoftGraphMail(
  input: GraphMailInput,
  options: { config?: MicrosoftGraphConfig; fetchImpl?: FetchLike } = {}
): Promise<GraphMailResult> {
  if (process.env.NODE_ENV === "test" && !options.fetchImpl) {
    return providerError(
      "GRAPH_TEST_MODE",
      "Envio externo desabilitado durante testes automatizados."
    );
  }
  const config = options.config ?? getMicrosoftGraphConfig();
  const fetchImpl = options.fetchImpl ?? fetch;
  const readiness = getMicrosoftGraphMailReadiness(config);
  if (!readiness.configured)
    return providerError(
      "GRAPH_NOT_CONFIGURED",
      `Configuração Microsoft 365 incompleta: ${readiness.missing.join(", ")}.`
    );

  try {
    const tokenResponse = await fetchImpl(
      `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    );
    const tokenPayload = (await tokenResponse.json().catch(() => ({}))) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      return providerError(
        tokenPayload.error ?? `TOKEN_${tokenResponse.status}`,
        tokenPayload.error_description ??
          "Não foi possível autenticar a aplicação no Microsoft 365."
      );
    }

    const mailResponse = await fetchImpl(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(config.senderEmail)}/sendMail`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${tokenPayload.access_token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: {
            subject: input.subject,
            body: { contentType: "HTML", content: input.html },
            toRecipients: [{ emailAddress: { address: input.to } }],
          },
          saveToSentItems: true,
        }),
      }
    );
    if (!mailResponse.ok) {
      const payload = (await mailResponse.json().catch(() => ({}))) as {
        error?: { code?: string; message?: string };
      };
      return providerError(
        payload.error?.code ?? `GRAPH_${mailResponse.status}`,
        payload.error?.message ?? "O Microsoft Graph recusou o envio do convite."
      );
    }
    return { status: "accepted", providerRequestId: mailResponse.headers.get("request-id") };
  } catch (error) {
    return providerError(
      "GRAPH_NETWORK_ERROR",
      error instanceof Error ? error.message : "Falha de comunicação com o Microsoft Graph."
    );
  }
}
