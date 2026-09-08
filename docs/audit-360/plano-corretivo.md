# Plano Corretivo Priorizado — Vitru Nexus

## Onda 1 — Bloqueadores de confiabilidade e demonstração

**Prazo recomendado:** 7 dias úteis.

| Ordem | Entrega                             | Aceite objetivo                                                                  |
| ----: | ----------------------------------- | -------------------------------------------------------------------------------- |
|     1 | Estado de erro financeiro explícito | Falha de API nunca renderiza “sem dados”; tela mostra erro, retry e timestamp    |
|     2 | Remoção do debug em produção        | Build sem referência a `debug-collector`; teste automatizado do artefato         |
|     3 | Responsividade de Usuários          | Todas as colunas e ações acessíveis em 1024px e 390px                            |
|     4 | Higiene do radar executivo          | Health checks e bots não aparecem como incidente humano na Home                  |
|     5 | Lifecycle mínimo                    | Documentos, riscos, decisões, marcos e entregas com editar, arquivar e histórico |
|     6 | Testes E2E críticos                 | Login, RBAC, filtros, drill-down, upload e administração cobertos                |
|     7 | Roteiro honesto de demonstração     | Financeiro liberado; módulos vazios identificados como arquitetura/roadmap       |

## Onda 2 — Governança de dados e acesso

**Prazo recomendado:** 15 a 30 dias.

| Ordem | Entrega                                 | Aceite objetivo                                                             |
| ----: | --------------------------------------- | --------------------------------------------------------------------------- |
|     1 | Pipeline de carga de Mercado no produto | Upload, hash, staging, validação, aprovação, ativação e rollback auditáveis |
|     2 | De-para organizacional oficial          | Marca/BU relacionadas a empresa e área com owner e vigência                 |
|     3 | Escopos granulares                      | Usuários restritos enxergam somente fatos autorizados e reconciliados       |
|     4 | Política de qualidade                   | SLAs para usuário, verba, sublote, descrições e duplicidades                |
|     5 | Consolidação de perfis                  | Matriz papel × permissão × escopo aprovada; perfis redundantes removidos    |
|     6 | Retenção e minimização de auditoria     | Allowlist, mascaramento e prazo por categoria de evento                     |
|     7 | Hardening de uploads                    | Magic bytes em mídia e MIME canônico no storage                             |

## Onda 3 — Escala, performance e maturidade

**Prazo recomendado:** 30 a 60 dias.

| Ordem | Entrega                        | Aceite objetivo                                                       |
| ----: | ------------------------------ | --------------------------------------------------------------------- |
|     1 | Cache de metadados financeiros | `marketFinance.context` abaixo de 400 ms no p95 interno               |
|     2 | Otimização de notificações     | Consulta abaixo de 500 ms e polling controlado                        |
|     3 | Redução de bundles             | Charts e workspace carregados somente nas rotas necessárias           |
|     4 | Observabilidade                | Erros com correlation ID, métricas de latência e alertas por SLA      |
|     5 | Atualização de dependências    | `pnpm audit --prod` sem vulnerabilidades moderadas ou superiores      |
|     6 | Conteúdo oficial de projetos   | Owners, cronogramas, ações, riscos, decisões e indicadores carregados |
|     7 | Dados oficiais de Expansão     | Cidades, ofertas, cenários, metas e investimentos reconciliados       |

## Sequência de decisão

O produto não precisa ser reconstruído. A arquitetura atual suporta evolução. A prioridade deve ser **confiabilidade percebida e operacional**: primeiro impedir interpretação errada de erro ou ausência, depois fechar segurança e lifecycle, em seguida ampliar dados, escopos e automação.
