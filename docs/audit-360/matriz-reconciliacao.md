# Matriz de Reconciliação — Fonte × Banco × API × Tela

## Critério

**OK** significa igualdade na precisão disponível. **OK arredondado** significa que a interface apresenta corretamente o valor em milhões ou percentual com uma casa. **Não validado** significa ausência de fonte oficial ou de dados reais para confronto.

| Indicador                        |       Fonte oficial |                Banco ativo |                                 API |                  Tela | Status                                  |
| -------------------------------- | ------------------: | -------------------------: | ----------------------------------: | --------------------: | --------------------------------------- |
| Linhas físicas                   |              39.561 |                          — |                                   — |                     — | OK                                      |
| Fatos válidos                    |              39.554 |                     39.554 |                              39.554 |                39.554 | OK                                      |
| Linhas rejeitadas                |                   7 |                          7 |                                   7 |                     7 | OK                                      |
| Possíveis duplicidades           |                   9 |                          9 |                                   9 |                     9 | OK                                      |
| Fatos Realizado                  |              39.179 |                     39.179 |                                   — |                     — | OK                                      |
| Fatos Forecast                   |                 375 |                        375 |                      375 no recorte |                   375 | OK                                      |
| Real Jan–Jul/25                  |   R$ 195.309.704,02 |          R$ 195.309.704,02 |                   R$ 195.309.704,02 |           R$ 195,3 mi | OK arredondado                          |
| Real Jan–Jul/26                  |   R$ 197.798.500,48 |          R$ 197.798.500,48 |                   R$ 197.798.500,48 |           R$ 197,8 mi | OK arredondado                          |
| Delta comparável                 |     R$ 2.488.796,46 |            R$ 2.488.796,46 |                     R$ 2.488.796,46 |             R$ 2,5 mi | OK arredondado                          |
| YoY comparável                   |           1,274282% |                  1,274282% |                           1,274282% |                  1,3% | OK arredondado                          |
| Real FY25                        |   R$ 314.834.184,20 |          R$ 314.834.184,20 |                   R$ 314.834.184,20 |           R$ 314,8 mi | OK arredondado                          |
| Forecast Ago–Dez/26              |   R$ 141.369.177,04 |          R$ 141.369.177,04 |                   R$ 141.369.177,04 |           R$ 141,4 mi | OK arredondado                          |
| Outlook FY26                     |   R$ 339.167.677,52 |          R$ 339.167.677,52 |                   R$ 339.167.677,52 |           R$ 339,2 mi | OK arredondado                          |
| Delta Outlook × FY25             |    R$ 24.333.493,32 |           R$ 24.333.493,32 |                    R$ 24.333.493,32 |            R$ 24,3 mi | OK arredondado                          |
| YoY Outlook                      |           7,728987% |                  7,728987% |                           7,728987% |                  7,7% | OK arredondado                          |
| Total = soma das marcas          |                   — |                          — |                      Teste aprovado | Drivers reconciliados | OK                                      |
| Marca = soma das categorias      |                   — |                          — | Teste aprovado para todas as marcas | Drill-down disponível | OK                                      |
| Outlook = Real YTD + Forecast    |                   — |                          — |                      Teste aprovado |         Ponte exibida | OK                                      |
| Forecast fora de Ago–Dez/26      |                Zero |                       Zero |                                Zero |           Não exibido | OK                                      |
| Budget oficial de Mercado        |             Ausente | Ausente no domínio oficial |                       Não retornado |   Marcado como futuro | OK metodológico                         |
| Comprometido/Saldo/ROI/Resultado |             Ausente | Ausente no domínio oficial |                       Não retornado |   Marcado como futuro | OK metodológico                         |
| Progresso de projetos            |   Sem fonte externa |       0% nos dois projetos |                                  0% |                    0% | Não validado como indicador de execução |
| KPIs de Expansão                 | Sem fonte carregada |             Zero registros |                                Zero |        Estados vazios | Não validado                            |

## Validações automáticas

A suíte `audit360.invariance.test.ts` prova total por marca, marca por categoria, Outlook, fórmula de delta/YoY, filtro combinado e zero resultado. Em conjunto com a suíte anterior, foram aprovados **57 testes em 13 arquivos**.

## Limitação visual

As capturas automatizadas podem congelar a animação SVG do Recharts. A posição final das barras mensais foi comprovada por teste da transformação temporal, mas deve ser confirmada manualmente no navegador vivo antes da apresentação.
