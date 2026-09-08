# Vitru Nexus — Entrega Final da Comparação 2025 × 2026

## Conclusão executiva

A comparação entre **Real Jan–Jul/25** e **Real Jan–Jul/26** foi redesenhada para responder, em sequência única: **de onde partimos, quais aumentos e reduções ocorreram, onde chegamos e quais drivers explicam o movimento**. A evolução preserva integralmente a base oficial e mantém Forecast fora do comparável realizado.

| Componente           | Implementação final                                                         |
| -------------------- | --------------------------------------------------------------------------- |
| Ponte reconciliada   | Real 2025 + aumentos − reduções = Real 2026                                 |
| Comparação principal | R$ 195,3 mi → +R$ 3,5 mi − R$ 1,0 mi → R$ 197,8 mi                          |
| Resultado líquido    | +R$ 2,5 mi e +1,3% YoY                                                      |
| Evolução mensal      | Barras pareadas de Real 2025 e Real 2026, exclusivamente de janeiro a julho |
| Outlook              | Capítulo visual separado, com Real FY25, Forecast restante e Outlook FY26   |
| Base comparável      | 11.696 lançamentos de Real Jan–Jul/26, em vez da contagem total da base     |

## Variation Explorer

O Explorer agora utiliza **coral para aumento de investimento**, **ciano para redução**, **amarelo Vitru para seleção** e **violeta exclusivamente para Forecast**. As cores indicam direção, não desempenho, pois a fonte atual não contém Budget, ROI ou resultado.

| Recurso               | Decisão suportada                                                              |
| --------------------- | ------------------------------------------------------------------------------ |
| Setas direcionais     | Identificar imediatamente aumento, redução ou estabilidade                     |
| Barras divergentes    | Visualizar aumentos à direita e reduções à esquerda do eixo central            |
| Faróis de relevância  | Classificar impacto alto, médio ou baixo pelo peso absoluto no movimento bruto |
| Mix 2026              | Contextualizar o tamanho do driver no investimento realizado de 2026           |
| Modos de ordenação    | Alternar entre maior impacto, aumentos e reduções                              |
| Aprofundamento guiado | Marca → categoria → conta → centro de custo → lançamento                       |

## Fidelidade e método

Os aumentos e as reduções são calculados pela decomposição da dimensão ativa. A diferença entre ambos reconcilia com o delta total. A soma das participações no movimento bruto e a soma do mix de 2026 são validadas por teste. Nenhuma cor ou farol classifica um movimento como bom ou ruim.

> Pontos de Atenção continuam sendo observações da fonte, sem inferência causal automática. Forecast continua fora do comparável Jan–Jul e aparece somente no capítulo anual explicitamente identificado.

## Validação final

| Validação              | Resultado                                                            |
| ---------------------- | -------------------------------------------------------------------- |
| TypeScript             | Aprovado                                                             |
| Testes                 | 44 testes aprovados em 10 arquivos                                   |
| Build de produção      | Aprovado                                                             |
| Reconciliação da ponte | Aprovada                                                             |
| Contagem comparável    | 11.696 lançamentos validados                                         |
| Desktop                | Validado em 1440 × 1000                                              |
| Tablet/notebook        | Estrutura responsiva preservada                                      |
| Mobile                 | Validado em 390 × 844, com hero compactado e filtros em duas colunas |
| Console após correção  | Sem erros na janela final de validação                               |

## Resultado de produto

A primeira tela deixou de tratar 2025 como referência secundária. Os dois anos agora possuem peso visual equivalente e o delta virou uma ponte explicável. O Explorer deixou de funcionar apenas como tabela e passou a orientar a investigação por direção, relevância e próxima causa disponível.
