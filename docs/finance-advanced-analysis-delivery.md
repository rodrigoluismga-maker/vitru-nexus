# Vitru Nexus — Entrega Final da Análise Financeira Avançada

## Conclusão executiva

O Financeiro de Mercado evoluiu de uma comparação fixa para um ambiente analítico controlável. O usuário pode combinar dimensões, cenários e janelas temporais, alternar a forma de visualização e ordenar os drivers por qualquer indicador relevante, sem misturar Realizado e Forecast.

| Capacidade         | Implementação final                                                            |
| ------------------ | ------------------------------------------------------------------------------ |
| Filtros principais | Marca, BU, modalidade, produto e categoria                                     |
| Filtros avançados  | Conta contábil, centro de custo e tipo de lançamento                           |
| Seleção            | Multisseleção com busca, contador e limpeza individual                         |
| Cenário            | Realizado, Forecast e Outlook                                                  |
| Período            | Jan–Jul, Ago–Dez, trimestre, semestre, ano completo e meses personalizados     |
| Granularidade      | Mês, trimestre e semestre                                                      |
| Visuais            | Barras comparativas, waterfall de variação e evolução acumulada                |
| Ordenação          | Dimensão, Real 25, cenário 26, delta, YoY, Mix 26 e relevância                 |
| Cores              | YoY positivo em vermelho e negativo em verde; direção do gasto, não desempenho |
| Drill-down         | Contexto propagado até o lançamento e a linha de origem                        |

## Regras metodológicas protegidas

Realizado 2026 só recebe YoY quando todos os meses selecionados possuem fechamento na fonte oficial. Forecast é exibido como valor e composição, sem percentual YoY realizado. Outlook combina Realizado e Forecast exclusivamente quando esse cenário é selecionado e compara a mesma janela de 2025.

O gráfico temporal mantém janeiro a dezembro visíveis. Os períodos selecionados recebem destaque, enquanto os demais permanecem como contexto anual. Meses sem dado não são preenchidos artificialmente.

> A temperatura verde ou vermelha indica a direção da variação de investimento. Ela não classifica eficiência, retorno ou qualidade, pois esses indicadores não existem na fonte atual.

## Filtros e rastreabilidade

Conta e centro de custo exibem código e descrição, mas enviam o código canônico ao backend. Cenário, meses, granularidade e dimensões ficam persistidos na URL e acompanham a navegação entre Visão Executiva, Variation Explorer e Lançamentos.

## Validação final

| Critério                 | Resultado                           |
| ------------------------ | ----------------------------------- |
| Totais oficiais padrão   | Reconciliados                       |
| Forecast Ago–Dez/26      | R$ 141.369.177,04 e 375 lançamentos |
| Outlook FY26             | R$ 339.167.677,52                   |
| YoY Realizado incompleto | Bloqueado                           |
| Cenários de integração   | 7 testes financeiros aprovados      |
| Suíte completa           | 46 testes aprovados em 10 arquivos  |
| TypeScript               | Aprovado                            |
| Build de produção        | Aprovado                            |
| Console final            | Sem erros                           |
| Desktop                  | Validado em 1440 × 1000             |
| Mobile                   | Validado em 390 × 844               |

## Resultado de produto

A análise agora responde tanto à leitura executiva quanto à investigação operacional. É possível partir do consolidado anual, mudar para trimestre ou semestre, selecionar meses específicos, isolar Forecast, ordenar por valor ou YoY, localizar os principais drivers e chegar ao lançamento que sustenta o movimento.
