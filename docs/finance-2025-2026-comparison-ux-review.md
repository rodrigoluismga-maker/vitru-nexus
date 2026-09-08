# Avaliação UX — Comparação Real Jan–Jul/25 × Real Jan–Jul/26

## Conclusão executiva

**A percepção do usuário está correta.** Os números estão reconciliados, mas a comparação 2025 × 2026 ainda exige esforço mental maior do que deveria. A tela privilegia o valor de 2026 e o percentual YoY, enquanto o valor-base de 2025 aparece apenas como referência textual. Para uma liderança, a leitura ideal precisa mostrar em uma única linha visual: **de onde partimos, quanto mudou, onde chegamos e o que explica a mudança**.

Hoje a tela responde bem “quanto investimos em 2026?” e “qual é o Outlook?”. Ela responde com menos eficiência “quanto era em 2025?”, “qual foi a ponte entre os dois anos?” e “qual driver compensou qual?”.

## Principais fricções encontradas

| Fricção                                                                                       | Efeito na leitura executiva                                                    | Prioridade |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| O Real Jan–Jul/25 não possui o mesmo peso visual do Real Jan–Jul/26                           | O usuário precisa reconstruir mentalmente a base da comparação                 | Crítica    |
| YTD comparável e Outlook anual aparecem na mesma sequência de cinco KPIs                      | Mistura duas perguntas metodologicamente diferentes                            | Crítica    |
| O YoY mostra 1,3% e R$ 2,5 mi, mas não forma uma ponte visual entre R$ 195,3 mi e R$ 197,8 mi | A variação parece abstrata                                                     | Alta       |
| O gráfico de linhas sobrepostas exige comparar distância entre curvas                         | A leitura mês a mês é menos imediata do que barras pareadas                    | Alta       |
| Os drivers usam vermelho para aumento e verde para redução                                    | Sugere julgamento de bom ou ruim sem Budget ou resultado                       | Alta       |
| O Variation Explorer mostra valores e delta, mas não contribuição para a variação total       | Não fica claro quanto cada driver explica do movimento líquido                 | Alta       |
| O primeiro KPI associa 39.554 lançamentos ao Real Jan–Jul/26                                  | A contagem representa o contexto total da base, não apenas esse recorte        | Crítica    |
| A leitura executiva factual está abaixo dos gráficos                                          | A conclusão aparece depois da exploração, quando deveria orientar a exploração | Média      |

## O que eu faria diferente

### 1. Criaria uma faixa comparativa dominante

O primeiro bloco após os filtros deveria ser uma ponte simples e impossível de interpretar errado:

> **Real Jan–Jul/25 — R$ 195,3 mi** → **+R$ 2,5 mi | +1,3%** → **Real Jan–Jul/26 — R$ 197,8 mi**

Essa faixa deve ocupar a largura principal da tela. O valor de 2025 e o valor de 2026 precisam ter o mesmo peso tipográfico. A variação fica no centro, com rótulo “maior investimento” ou “menor investimento”, sem indicar melhora ou piora.

### 2. Separaria comparação realizada de Outlook

A tela deveria possuir dois capítulos visuais:

| Capítulo                   | Pergunta respondida                                                  |
| -------------------------- | -------------------------------------------------------------------- |
| **Comparação realizada**   | Como Jan–Jul/26 se compara ao mesmo período de 2025?                 |
| **Visão anual de Outlook** | Como FY26, combinando Realizado e Forecast, se compara ao Real FY25? |

O Forecast continuaria em violeta e nunca dividiria o mesmo card ou gráfico com o Realizado sem uma legenda explícita.

### 3. Trocaría a evolução principal por barras mensais pareadas

Para Jan–Jul, barras lado a lado de 2025 e 2026 são mais rápidas para comparação do que duas linhas. Cada mês deveria permitir identificar o delta, com destaque apenas nos meses que mais explicam o movimento acumulado.

O Forecast de agosto a dezembro deve aparecer em um segundo visual, menor e claramente rotulado como **Outlook**, evitando que a linha tracejada pareça continuidade do Realizado.

### 4. Adicionaria contribuição para o delta

O Variation Explorer deveria mostrar, além de Real 25, Real 26, delta e YoY:

| Campo                           | Utilidade                                                   |
| ------------------------------- | ----------------------------------------------------------- |
| Contribuição para o delta bruto | Mostra o peso do driver entre todos os aumentos ou reduções |
| Efeito no delta líquido         | Mostra quanto o driver explica do movimento consolidado     |
| Participação no Real 2026       | Evita supervalorizar drivers pequenos com YoY elevado       |

Como o delta líquido pode ser pequeno devido a compensações, a contribuição não deve ser apresentada apenas como percentual do delta líquido. O produto deve distinguir **aumentos brutos**, **reduções brutas** e **efeito líquido**.

### 5. Criaria uma ponte de drivers

No recorte por marca, a leitura factual atual é:

> **Unicesumar adiciona aproximadamente R$ 3,5 mi de investimento, enquanto Uniasselvi reduz aproximadamente R$ 1,0 mi. O efeito líquido é aumento de R$ 2,5 mi.**

Essa ponte explica a compensação imediatamente. O mesmo padrão deve funcionar para categoria, produto, conta e centro de custo.

### 6. Neutralizaria a semântica de cor

Sem Budget, eficiência ou resultado, “mais investimento” não é automaticamente ruim e “menos investimento” não é automaticamente bom. A recomendação é:

| Estado                  | Cor sugerida          |
| ----------------------- | --------------------- |
| Real 2025               | Cinza frio            |
| Real 2026               | Amarelo Vitru         |
| Forecast 2026           | Violeta               |
| Aumento de investimento | Âmbar ou coral neutro |
| Redução de investimento | Ciano ou azul frio    |
| Risco validado          | Vermelho              |
| Eficiência validada     | Verde                 |

### 7. Anteciparia a leitura executiva

Logo abaixo da ponte comparativa, o Nexus deveria gerar uma frase factual e auditável, sem inferir causalidade:

> **O investimento realizado permaneceu praticamente estável no comparável, com aumento líquido de R$ 2,5 mi. O movimento resulta de compensação entre marcas, liderada pelo aumento em Unicesumar e parcialmente neutralizada pela redução em Uniasselvi.**

Essa leitura deve responder aos filtros e nunca usar termos como eficiência, retorno ou desempenho sem fonte correspondente.

## Estrutura recomendada da primeira tela

| Ordem | Bloco                             | Função                                                   |
| ----: | --------------------------------- | -------------------------------------------------------- |
|     1 | Ponte Real 25 → Delta → Real 26   | Responder a comparação em cinco segundos                 |
|     2 | Leitura executiva factual         | Explicar o movimento sem causalidade inventada           |
|     3 | Barras mensais pareadas Jan–Jul   | Mostrar em quais meses a diferença nasceu                |
|     4 | Ponte de drivers por dimensão     | Mostrar quem aumentou e quem compensou                   |
|     5 | Outlook FY26 em capítulo separado | Responder a visão anual sem contaminar o realizado       |
|     6 | Pontos de Atenção                 | Informar limitações metodológicas e observações da fonte |

## Variation Explorer recomendado

O Explorer deve iniciar com um resumo de reconciliação:

> **R$ 195,3 mi em 2025 + R$ 8,2 mi de aumentos − R$ 5,7 mi de reduções = R$ 197,8 mi em 2026.**

Os valores de aumentos e reduções devem ser calculados dinamicamente no contexto selecionado. Abaixo, uma lista ordenada deve permitir alternar entre **maiores aumentos**, **maiores reduções** e **todos os drivers**, com colunas de Real 25, Real 26, delta absoluto, YoY, participação no Real 26 e efeito no movimento.

## Recomendação final

Eu manteria a arquitetura, os dados e a navegação atual, mas redesenharia a primeira dobra e o topo do Variation Explorer. Não é necessário reconstruir o módulo. O ganho está em **mudar a hierarquia da comparação**, separar os dois horizontes temporais e transformar o delta em uma ponte visual reconciliada.

Essa evolução é de alta prioridade porque melhora a demonstração para liderança sem exigir nova fonte de dados e sem alterar a metodologia oficial.
