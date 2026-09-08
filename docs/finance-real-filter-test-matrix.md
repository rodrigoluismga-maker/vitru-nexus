# Financeiro de Mercado — Matriz de Testes com Filtros Reais

## Conclusão executiva

O novo layout foi testado com valores canônicos da carga ativa, cobrindo filtros isolados, combinados, multisseleção, cenários, períodos, zero resultado e persistência do contexto. **Onze cenários automatizados e seis jornadas visuais foram aprovados.**

Durante a validação, foram encontradas e corrigidas duas divergências de apresentação: a tabela mensal não respeitava o cenário/período selecionado e uma combinação sem fatos podia ser rotulada como Forecast. Nenhuma divergência foi encontrada nos totais da API ou do banco.

## Matriz de validação

| Cenário                      | Contexto real                            | Evidência verificada                                            | Resultado |
| ---------------------------- | ---------------------------------------- | --------------------------------------------------------------- | --------- |
| Marca isolada — Uniasselvi   | Outlook FY26                             | KPI = soma dos 12 meses = soma dos drivers                      | Aprovado  |
| Marca isolada — Unicesumar   | Real Jan–Jul                             | KPI = meses = categorias; tela mostrou R$ 83,4 mi → R$ 86,9 mi  | Aprovado  |
| Interseção dimensional       | Unicesumar + EAD Unicesumar + Branding   | AND entre dimensões, sem vazamento de outras categorias         | Aprovado  |
| Conta de maior materialidade | Código `5242120107`                      | KPI, meses e drivers reconciliados                              | Aprovado  |
| Centro de custo material     | Código `12010309`                        | KPI, meses e drivers reconciliados                              | Aprovado  |
| Forecast isolado             | Ago–Dez/26                               | R$ 141.369.177,04; 375 lançamentos; somente meses 8–12          | Aprovado  |
| Primeiro trimestre           | Jan–Mar                                  | Soma mensal = granularidade trimestral                          | Aprovado  |
| Primeiro semestre Outlook    | Jan–Jun                                  | Somente Realizado disponível; Forecast não criado               | Aprovado  |
| Zero resultado               | Uniasselvi + EAD Unicesumar              | KPIs zerados, drivers vazios, tabela vazia e mensagem explícita | Aprovado  |
| Multisseleção                | Duas contas e dois centros de custo      | União dentro da dimensão e interseção entre dimensões           | Aprovado  |
| Persistência entre páginas   | Visão Executiva → Explorer → Lançamentos | Query string preservada no roteamento e filtros reaplicados     | Aprovado  |

## Reconciliação visual

No contexto **Unicesumar + Realizado + Jan–Jul**, o gráfico exibiu Real 2025 em cinza e Realizado 2026 em amarelo. A tabela foi limitada aos sete meses selecionados e apresentou, para cada linha, Real 2025, Realizado 2026, Delta, YoY e cenário Realizado.

No contexto **Forecast + Ago–Dez**, o gráfico exibiu exclusivamente as cinco barras violetas. A tabela foi limitada a agosto–dezembro, sem valores residuais de Realizado, e mostrou o Forecast total de R$ 141,4 milhões.

Na combinação sem interseção, KPIs, gráfico, tabela e drivers ficaram vazios de forma coerente. O sistema exibiu “Nenhum lançamento encontrado” e não classificou ausência de dados como Forecast.

## Correções realizadas

| Divergência                               | Correção                                                                              | Proteção contra regressão      |
| ----------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------ |
| Tabela mensal ignorava cenário e janela   | Linhas filtradas pelos meses ativos; Realizado ou Forecast removidos conforme cenário | Teste estático e matriz visual |
| Ausência de fatos parecia Forecast        | Estado “Sem dado 2026” e empty states explícitos para tabela e drivers                | Teste de zero resultado        |
| Legenda exibia Forecast no modo Realizado | Legenda agora é condicional para Realizado, Forecast ou Outlook                       | Teste de interface             |

## Validação técnica final

| Verificação                             | Resultado                          |
| --------------------------------------- | ---------------------------------- |
| Matriz de filtros reais                 | 11 testes aprovados                |
| Suíte completa                          | 76 testes aprovados em 15 arquivos |
| Lint                                    | Aprovado                           |
| TypeScript                              | Aprovado                           |
| Build de produção                       | Aprovado                           |
| Console, rede e servidor após correções | Sem erros na janela atual          |

## Conclusão

Os filtros atualizam corretamente KPIs, gráfico, tabela e drivers. A soma mensal reconcilia com os indicadores e a seleção de cenário não deixa dados de outro cenário na tabela. A lógica de multisseleção permanece: valores dentro da mesma dimensão são tratados como união; dimensões diferentes são combinadas por interseção.
