# Vitru Nexus — Relatório de Hardening Onda 0

## Conclusão executiva

A Onda 0 fechou os três riscos confirmados de maior impacto no código: **identidade aberta**, **documentos acessíveis por chave** e **dependências críticas de runtime**. O domínio técnico permanece disponível com TLS válido e HSTS, mas `vitrunexus.com` e `www.vitrunexus.com` ainda falham no handshake TLS e continuam como bloqueador externo de infraestrutura.

## Controles implementados

| Frente            | Antes                                                                       | Depois                                                                                               |
| ----------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Identidade        | Uma identidade aceita pelo provedor podia ser provisionada automaticamente. | Apenas usuário ativo, convite válido ou owner configurado pode concluir autenticação.                |
| Status do usuário | Sessão válida não consultava o status atual em todas as requisições.        | Usuário inativo ou bloqueado é negado pelo backend, inclusive com cookie ainda presente.             |
| Documentos        | URLs `/manus-storage/{key}` liberavam o arquivo pela posse da chave.        | A listagem omite chave e URL; a abertura usa ID do documento, autorização por objeto e URL assinada. |
| Vínculos          | Projeto, ação e decisão podiam ser informados sem prova de coerência.       | O backend resolve o projeto canônico e rejeita vínculos ausentes ou cruzados.                        |
| Upload            | O MIME declarado pelo navegador era aceito.                                 | Tipos permitidos, tamanho e assinatura mágica são verificados antes do storage.                      |
| Proxy legado      | Qualquer chave era encaminhada ao presign.                                  | Somente logos e imagens públicas em prefixos explícitos permanecem no proxy.                         |
| Supply chain      | 1 crítica, 25 altas, 51 moderadas e 10 baixas em produção.                  | 0 críticas, 0 altas, 4 moderadas e 0 baixas.                                                         |

## Atualizações de supply chain

Foram atualizados tRPC, Drizzle ORM, MySQL2, Axios, Nanoid, AWS SDK, Express e Streamdown. O pacote `xlsx`, sem correção disponível no snapshot inicial, foi removido e substituído por **ExcelJS**. Parser, templates, router e testes financeiros foram convertidos para operações assíncronas e permaneceram aprovados.

As quatro ocorrências moderadas restantes estão em `mdast-util-to-hast`, `qs` e `uuid`, todas transitivas. Elas permanecem registradas para acompanhamento e não bloqueiam a conclusão da Onda 0, que tinha gate explícito de zero vulnerabilidades críticas ou altas de runtime.

## Evidências técnicas

| Evidência                | Resultado                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| TypeScript               | Sem erros                                                                                                   |
| Testes                   | 9 arquivos e 39 testes aprovados                                                                            |
| Build                    | Produção concluída em 9,63 s                                                                                |
| SCA de produção          | 0 críticas, 0 altas, 4 moderadas, 0 baixas                                                                  |
| Banco                    | TiDB Serverless 8.5.3, `require_secure_transport=ON`                                                        |
| TLS suportado pelo banco | O servidor reporta TLS 1.0, 1.1 e 1.2; a política mínima do cliente/provedor precisa de evidência adicional |
| Domínio técnico          | HTTP 200, certificado Google Trust Services válido e HSTS com preload                                       |
| Domínio oficial          | Handshake TLS falhou em `vitrunexus.com` e `www.vitrunexus.com` durante a coleta                            |

## Infraestrutura sem evidência suficiente

Região física, residência de dados, criptografia em repouso, rotação de chaves, retenção de backup, teste de restauração, private endpoint, WAF, DDoS, destino externo de logs e lista formal de suboperadores não são demonstráveis pelo repositório ou pelas interfaces disponíveis. Esses pontos não foram declarados conformes; permanecem no checklist de homologação para comprovação pela TI e pelo provedor.

## Riscos residuais

O hardening documental protege os documentos governados do NEXUS. Imagens institucionais e capas continuam públicas por desenho. O sistema ainda não possui sessão server-side para revogar um JWT individual, mas a consulta de status em cada requisição produz revogação efetiva de acesso para usuários inativos ou bloqueados. A política de expiração absoluta e inatividade permanece na Onda 1.

## Critério de saída

A Onda 0 pode ser publicada porque os testes de regressão passaram e o SCA ficou sem vulnerabilidades críticas ou altas. A homologação corporativa, contudo, continua bloqueada até a correção do TLS do domínio oficial e a apresentação das evidências de infraestrutura listadas acima.
