# Convites por Microsoft 365 — Arquitetura aprovada

## Decisão

O Vitru Nexus enviará convites por uma caixa corporativa autorizada no Microsoft 365, usando Microsoft Graph com identidade de aplicativo. O usuário não criará senha local; acessará `https://vitrunexus.com` e fará autenticação corporativa com o mesmo e-mail cadastrado.

## Configuração necessária

1. Registrar uma aplicação no Microsoft Entra ID.
2. Adicionar a permissão de **aplicação** `Mail.Send` no Microsoft Graph.
3. Obter consentimento administrativo do tenant.
4. Autorizar a aplicação a enviar somente pela caixa remetente definida, aplicando política de acesso à aplicação ou RBAC para Applications no Exchange Online.
5. Configurar no NEXUS `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` e `MICROSOFT_SENDER_EMAIL`.

## Fluxo técnico

O backend solicitará um token no endpoint do tenant pelo fluxo client credentials, usando o escopo `https://graph.microsoft.com/.default`. O envio usará `POST /v1.0/users/{sender}/sendMail`. Uma resposta HTTP `202 Accepted` significa que a solicitação foi aceita pelo Graph; o NEXUS registrará esse estado como `accepted`, sem tratá-lo como confirmação de entrega final.

O fluxo client credentials exige permissões de aplicação previamente configuradas e consentidas por um administrador. Para aplicar menor privilégio, o Exchange Online deve usar **RBAC for Applications** com um resource scope limitado à caixa remetente do NEXUS. A Microsoft informa que esse modelo substitui Application Access Policies e permite restringir quais mailboxes o aplicativo pode acessar.

O cadastro de usuário continuará transacional e independente do provedor. Se o Graph estiver indisponível, o usuário permanecerá com status `invited`, a tentativa será registrada como falha e o administrador poderá reenviar.

## Referências oficiais

- [Microsoft Graph — user: sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail?view=graph-rest-1.0)
- [Microsoft Graph — Get access without a user](https://learn.microsoft.com/en-us/graph/auth-v2-service)
- [Exchange Online — Role Based Access Control for Applications](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac)
