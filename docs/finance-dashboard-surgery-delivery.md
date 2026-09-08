# Financeiro de Mercado — Cirurgia Executiva da Primeira Tela

## Conclusão executiva

A primeira tela foi reorganizada sem alterar fonte, tabelas analíticas, regras de sinal, endpoints, permissões ou drill-down. A experiência agora separa duas perguntas: **como o Realizado comparável evoluiu** e **qual é o Outlook anual**.

| Capítulo             | Valores reconciliados                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| Realizado comparável | R$ 195,3 mi em Jan–Jul/25 → +R$ 2,5 mi / +1,3% → R$ 197,8 mi em Jan–Jul/26 |
| Outlook anual        | R$ 197,8 mi de Realizado + R$ 141,4 mi de Forecast = R$ 339,2 mi           |

## Mudanças de experiência

| Elemento       | Resultado                                                                           |
| -------------- | ----------------------------------------------------------------------------------- |
| Estado inicial | Outlook anual, sem sobrescrever escolhas persistidas na URL                         |
| Gráfico mensal | Real 2025 em cinza; Realizado Jan–Jul/26 em amarelo; Forecast Ago–Dez/26 em violeta |
| Tooltip        | Valor por série, delta absoluto e YoY quando comparável                             |
| Tabela mensal  | Real 2025, Realizado 2026, Forecast 2026, Outlook 2026, Delta, YoY e cenário        |
| Ordenação      | Mês, valores, Delta e YoY                                                           |
| Drivers        | Real 2025, Atual 2026, Delta, YoY, Mix e relevância, com ordenação                  |
| Interação      | Clique em mês ou driver mantém o contexto global e o caminho até o lançamento       |

## Proteções de veracidade

O capítulo Realizado comparável usa sempre janeiro a julho e preserva todos os filtros dimensionais, mas não herda um filtro mensal que tornaria o rótulo fixo enganoso. A análise temporal abaixo continua respondendo integralmente ao cenário, período, granularidade e filtros selecionados.

Forecast permanece identificado como projeção. Cores de Delta e YoY indicam direção do investimento, não eficiência ou desempenho. Nenhum valor foi simulado.

## Validação

| Verificação                   | Resultado                                                     |
| ----------------------------- | ------------------------------------------------------------- |
| Reconciliação mensal no banco | 12 meses confirmados; Realizado Jan–Jul e Forecast Ago–Dez    |
| TypeScript                    | Aprovado                                                      |
| Testes                        | 63 aprovados em 14 arquivos                                   |
| Build de produção             | Aprovado                                                      |
| Desktop                       | Gráfico, capítulos, tabela e drivers validados                |
| Mobile                        | Hierarquia, rolagem horizontal e cores validadas em 390 × 844 |
