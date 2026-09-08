# Vitru Nexus — Onda 1 do Plano Corretivo

## Conclusão executiva

Os nove achados P1 receberam controles verificáveis. A Onda 1 não alterou cálculos financeiros nem os fatos da carga oficial: permanece uma carga ativa com **39.554 fatos**, dos quais **39.179 são Realizado** e **375 são Forecast**. O valor gerencial ativo permanece em **R$ 891.662.669,07**.

| P1                       | Correção executada                                                                                                                | Evidência                                                | Status                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------- |
| Confiabilidade percebida | Erro, loading e vazio passaram a ser estados distintos; falhas exibem mensagem, retry e horário                                   | `QueryErrorState` em quatro jornadas financeiras         | Resolvido                             |
| Debug em produção        | Coletor removido da configuração e do bundle                                                                                      | `debug_artifact_refs=0` após build                       | Resolvido                             |
| Usuários responsivo      | Tabela sticky em notebook e cards completos no celular                                                                            | Capturas em 1440×1000 e 390×844                          | Resolvido                             |
| Radar executivo          | Eventos de autenticação saíram do radar, mas continuam na auditoria técnica                                                       | Filtro por `entityType != auth`                          | Resolvido                             |
| Ciclos de vida           | Riscos, decisões, marcos, entregas e documentos ganharam arquivamento lógico; governança ganhou atualização de status e histórico | Migration `0008`, APIs, UI e `audit_events`              | Resolvido                             |
| Pipeline de Mercado      | Histórico, validação reconciliada, aprovação segregada, ativação transacional e rollback agora estão no produto                   | `marketFinance.loads.*` e painel em Contexto & Qualidade | Resolvido com dependência operacional |
| Escopos granulares       | Catálogo é derivado da carga ativa; atribuição só aceita valor oficial; ausência de relação continua deny-by-default              | `marketFinance.scopes.*` e painel administrativo         | Resolvido                             |
| Prontidão honesta        | Expansão distingue estrutura pronta de dados conectados; Home rotula progresso e status como reportados                           | Banner e cópia revisados                                 | Resolvido                             |
| Cobertura E2E            | Jornadas críticas receberam provas integradas de API, banco, artefato e renderização responsiva                                   | 61 testes e matriz de capturas                           | Resolvido                             |

## Governança de cargas

Uma carga não pode ser ativada diretamente. O fluxo obrigatório é **processamento → validação → aprovação → ativação**. A validação recalcula quantidade de fatos, totais assinado e gerencial e possíveis duplicidades; a aprovação requer `finance.approve`; a ativação desativa transacionalmente a carga anterior. O rollback restaura somente uma carga previamente ativa e superseded.

> A ingestão física continua sendo produzida pelo carregador oficial e hash-validado. A Onda 1 trouxe para o produto todas as decisões de promoção e reversão. A eventual substituição do parser por um serviço corporativo permanece uma evolução de automação, não uma lacuna de governança.

## Escopos financeiros

O sistema agora aceita escopos de **Marca, BU, Modalidade, Produto e Categoria**. O administrador escolhe exclusivamente valores presentes na carga ativa; não há correspondência automática por similaridade textual. Sem escopo `all` ou dimensão oficial atribuída, o backend retorna conjunto vazio.

Na publicação desta Onda, há **zero escopos dimensionais configurados**, porque nenhuma relação usuário–dimensão foi presumida. A capacidade está disponível na área **Contexto & Qualidade** para configuração autorizada.

## Integridade do banco

| Controle                        |         Resultado |
| ------------------------------- | ----------------: |
| Cargas ativas                   |                 1 |
| Fatos ativos                    |            39.554 |
| Realizado                       |            39.179 |
| Forecast                        |               375 |
| Valor gerencial ativo           | R$ 891.662.669,07 |
| Entidades com `archivedAt`      |            5 de 5 |
| Escopos dimensionais inventados |                 0 |

## Qualidade técnica

| Verificação                        | Resultado                   |
| ---------------------------------- | --------------------------- |
| Lint                               | Aprovado                    |
| TypeScript                         | Aprovado                    |
| Testes                             | 61 aprovados em 14 arquivos |
| Build                              | Aprovado                    |
| Referências ao coletor no artefato | 0                           |
| Desktop e mobile                   | Validados                   |

## Riscos residuais reclassificados

Os dois itens que dependem de operação humana não permanecem como P1 técnico. O primeiro é atribuir os escopos dimensionais aos usuários corretos; o segundo é alimentar Portfólio e Expansão com fontes corporativas oficiais. Ambos permanecem bloqueados contra inferência e dados simulados.
