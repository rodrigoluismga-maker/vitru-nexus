# Avaliação criteriosa — Dashboard Financeiro

## Conclusão executiva

**Os dados estão presentes e os principais totais estão corretos, mas a experiência atual não comunica isso com segurança.** O dashboard mistura três perguntas diferentes — Realizado comparável, Realizado acumulado e Outlook anual — dentro da mesma sequência visual. O resultado é uma tela metodologicamente defensiva, porém pouco intuitiva: o usuário vê R$ 197,8 milhões com o rótulo “ano completo”, um YoY bloqueado e um gráfico quase monocromático.

## O que está correto

| Indicador                                    | Valor validado | Avaliação                 |
| -------------------------------------------- | -------------: | ------------------------- |
| Realizado Jan–Jul/26                         |    R$ 197,8 mi | Correto                   |
| Lançamentos Real Jan–Jul/26                  |         11.696 | Correto                   |
| Real Jan–Jul/25                              |    R$ 195,3 mi | Correto                   |
| Delta comparável                             |     +R$ 2,5 mi | Correto                   |
| YoY comparável                               |          +1,3% | Correto                   |
| Forecast Ago–Dez/26                          |    R$ 141,4 mi | Correto                   |
| Outlook FY26                                 |    R$ 339,2 mi | Correto                   |
| Real FY25                                    |    R$ 314,8 mi | Correto                   |
| Bloqueio de YoY do Realizado FY26 incompleto |  Não aplicável | Metodologicamente correto |

O banco confirma Realizado em todos os meses de janeiro a julho de 2026 e Forecast em todos os meses de agosto a dezembro. Portanto, **o problema do gráfico não é ausência de dados**.

## O que está errado ou enganoso

| Problema                                                                    | Por que prejudica a análise                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| “Realizado 2026 · ano completo” mostra R$ 197,8 mi                          | O valor é Jan–Jul, não ano completo. O rótulo induz leitura incorreta            |
| Cenário Realizado selecionado, mas título do gráfico inclui Forecast        | Controle, título e conteúdo não contam a mesma história                          |
| Real 2025 domina visualmente e as séries de 2026 quase desaparecem          | O usuário não consegue confirmar mês a mês o realizado ou o Forecast             |
| YoY bloqueado ocupa um card principal                                       | A proteção está correta, mas o estado selecionado é ruim para a primeira leitura |
| “Drivers do valor” aparece ao lado de “quem explica o movimento”            | Participação no valor não é explicação da variação                               |
| Cards de marca mostram composição, mas não Real 25, Real/Outlook 26 e delta | Não ajudam a entender causa da mudança                                           |
| Outlook aparece novamente em capítulo inferior                              | A narrativa fica repetitiva e fragmentada                                        |

## Melhor caminho

Eu **não substituiria o gráfico por uma tabela**. Usaria os dois, com funções diferentes:

> **O gráfico mostra o padrão; a tabela dá precisão, confiança e auditabilidade.**

### Primeira dobra recomendada

1. **Real comparável:** R$ 195,3 mi em Jan–Jul/25 → +R$ 2,5 mi / +1,3% → R$ 197,8 mi em Jan–Jul/26.
2. **Outlook anual:** R$ 197,8 mi de Realizado + R$ 141,4 mi de Forecast = R$ 339,2 mi; comparação com Real FY25 de R$ 314,8 mi.
3. Remover o card principal “YoY não aplicável”. A restrição metodológica deve virar uma nota contextual apenas quando o usuário escolher uma janela inválida.

### Gráfico recomendado

Usar barras agrupadas por mês, sempre com duas posições:

| Série      | Tratamento visual                                        |
| ---------- | -------------------------------------------------------- |
| Real 2025  | Barra cinza à esquerda                                   |
| Atual 2026 | Barra à direita, amarela de Jan–Jul e violeta de Ago–Dez |

O Forecast não deve ser empilhado sobre o Realizado, pois eles ocupam meses diferentes. Cada tooltip deve mostrar Real 2025, cenário 2026, valor 2026, delta absoluto e percentual. Acima de cada mês, um pequeno marcador pode indicar `R` ou `F`.

### Tabela mensal recomendada

Logo abaixo do gráfico, incluir uma tabela ordenável:

| Mês | Real 2025 | Realizado 2026 | Forecast 2026 | Outlook 2026 | Delta | YoY | Cenário |
| --- | --------: | -------------: | ------------: | -----------: | ----: | --: | ------- |

Essa tabela deve permitir ordenar por mês, valor, delta e YoY; usar vermelho para aumento de investimento e verde para redução, com legenda explícita de que cor representa **direção**, não qualidade.

### Drivers recomendados

Substituir os dois cards atuais por uma tabela curta de decomposição:

| Marca | Real 2025 | Atual 2026 | Delta | YoY | Mix 2026 | Relevância |
| ----- | --------: | ---------: | ----: | --: | -------: | ---------- |

Quando não houver comparação válida, o título deve ser **“Onde está o valor”**. Quando houver base equivalente, deve ser **“O que explica a variação”**. São perguntas diferentes e não podem compartilhar a mesma semântica.

## Recomendação final

O melhor caminho é redesenhar a página em dois capítulos fixos — **Realizado comparável** e **Outlook anual** — e deixar cenário/período como recursos de aprofundamento, não como responsáveis por montar a narrativa inicial. O gráfico deve continuar, mas acompanhado de tabela mensal e drivers tabulares. A arquitetura e os cálculos podem ser preservados; o problema central está na hierarquia, nos rótulos e na codificação visual.
