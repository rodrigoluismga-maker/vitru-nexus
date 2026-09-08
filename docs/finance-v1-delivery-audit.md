# Vitru Nexus — Auditoria de Entrega da V1 Financeiro de Mercado

## Conclusão executiva

A V1 transforma a `BASE_REAL_MKTv2.xlsx` em uma camada analítica oficial, governada e navegável dentro do Vitru Nexus. A experiência responde ao fluxo **macro → causa → lançamento**, mantém **Realizado** e **Forecast** separados e não apresenta Budget, Comprometido, Saldo, ROI, Resultado ou Eficiência como situação atual.

| Critério          | Evidência                                                                  | Resultado                             |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------- |
| Fonte oficial     | SHA-256 `ef6a1a16d4f6b839b7d3d282a9cbffed0d51e32451885a4697416c39d514ef71` | Validado                              |
| Fatos persistidos | 39.554 linhas válidas                                                      | Reconciliado                          |
| Cenários          | 39.179 Realizado e 375 Forecast                                            | Separados                             |
| Qualidade         | 7 rejeições e 9 possíveis duplicidades                                     | Visíveis, sem exclusão silenciosa     |
| Glossário         | 13 categorias                                                              | Integrado ao produto                  |
| Pontos de Atenção | 24 observações                                                             | Integrados como contexto metodológico |
| Regressão         | 44 testes em 10 arquivos                                                   | Aprovada                              |
| TypeScript        | `pnpm check`                                                               | Aprovado                              |
| Produção          | `pnpm build`                                                               | Aprovado                              |

## Reconciliação executiva

| Indicador            |     Valor oficial |
| -------------------- | ----------------: |
| Real Jan–Jul/25      | R$ 195.309.704,02 |
| Real Jan–Jul/26      | R$ 197.798.500,48 |
| Delta comparável     |   R$ 2.488.796,46 |
| YoY comparável       |         1,274282% |
| Real FY25            | R$ 314.834.184,20 |
| Forecast Ago–Dez/26  | R$ 141.369.177,04 |
| Outlook FY26         | R$ 339.167.677,52 |
| Delta Outlook × FY25 |  R$ 24.333.493,32 |
| YoY Outlook          |         7,728987% |

O teste de integração bloqueia regressões nesses totais e comprova que o Forecast está exclusivamente entre agosto e dezembro de 2026. A soma da decomposição por marca reconcilia com o delta macro.

## Experiência implementada

| Superfície           | Decisão suportada                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Visão Executiva      | Quanto foi investido, comparação comparável, Outlook, distribuição do capital e principais drivers             |
| Variation Explorer   | Quais marcas, BUs, modalidades, produtos, categorias, contas, centros de custo, meses e tipos explicam o delta |
| Lançamentos          | Qual evidência sustenta o número, com sinal gerencial, sinal contábil, origem, lote e linha Excel              |
| Contexto & Qualidade | Como interpretar categorias, observações da fonte, rejeições, duplicidades e lacunas                           |
| Futuro da Alocação   | O que já existe e o que depende de novas fontes oficiais, sem números simulados                                |

Os filtros de marca, BU, modalidade, produto e categoria ficam persistidos na URL e acompanham a navegação. Cliques em mês, composição, driver, Glossário e Pontos de Atenção atualizam o contexto compartilhado. Conta, centro de custo e tipo de lançamento são aplicados pelo Variation Explorer e preservados entre rotas.

## Auditoria por persona

| Persona  | Pergunta de aceite                                 | Resultado                                                                            |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ |
| CEO      | A situação pode ser entendida em 30 segundos?      | Sim. KPIs, períodos e cenários aparecem no primeiro viewport com rótulos inequívocos |
| VP       | É possível identificar onde olhar e decidir?       | Sim. Drivers de delta, Outlook e Pontos de Atenção formam uma sequência de decisão   |
| Gestor   | É possível descobrir a causa de uma variação?      | Sim. A decomposição alterna entre nove dimensões e aplica contexto ao módulo         |
| Analista | É possível chegar à evidência e à linha de origem? | Sim. O drill-down mostra lançamento, sinal, lote, sublote, origem e linha Excel      |

## Segurança e governança

Todas as consultas exigem `finance.view`. Administradores e usuários com escopo financeiro global recebem os fatos. Como a fonte não contém uma dimensão corporativa reconciliada aos cadastros de empresa/área do Nexus, escopos menores não são inferidos: o backend aplica **menor privilégio** e retorna conjunto vazio. Essa decisão evita fabricar relações organizacionais.

O domínio analítico permanece isolado das tabelas futuras de Budget e Comprometido. A carga é versionada, hash-validada, ativada por lote e registrada na auditoria. A planilha original permanece imutável.

## Performance e responsividade

A chamada agregada da Visão Executiva foi observada com status 200, sem erro e duração de aproximadamente **1,16 segundo** no ambiente de desenvolvimento. O bundle da tela financeira é carregado sob demanda e possui aproximadamente 13,4 kB compactados, além do bundle compartilhado de gráficos.

As superfícies prioritárias foram verificadas em 1440×1000, 1024×768 e 390×844. O shell, hero, navegação, filtros e títulos permanecem legíveis; menus contextuais usam rolagem horizontal e a tabela transacional usa rolagem própria no mobile.

## Limitações explícitas

> Pontos de Atenção são observações da planilha e não conclusões causais automáticas.

Budget, Comprometido, Saldo, Revisão, Resultado, Eficiência e Realocação continuam marcados como **Em construção** e sem valores. As nove duplicidades exatas foram mantidas porque a fonte não oferece chave corporativa suficiente para afirmar duplicidade indevida. As sete linhas rejeitadas permanecem no registro de qualidade. Contas e centros de custo são agrupados pelo código canônico; alterações de descrição não dividem o driver nem eliminam fatos.

## Critérios de aceite concluídos

1. Fidelidade aos dados e regras de sinal.
2. Separação visual e lógica entre Realizado e Forecast.
3. Comparações obrigatórias reconciliadas.
4. Navegação macro → causa → lançamento.
5. Glossário e Pontos de Atenção transformados em produto.
6. Futuro do produto apresentado sem dados falsos.
7. RBAC, menor privilégio e lineage preservados.
8. Typecheck, testes, build e matriz responsiva aprovados.
