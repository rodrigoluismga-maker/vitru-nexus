# Vitru Nexus V2 — Correções e Evidências

## Conclusão executiva

A ordem de serviço V2 foi aplicada preservando regras de negócio, cálculos financeiros, permissões, schema e dados oficiais. O Financeiro passou a comparar mês a mês o **Real 2025** com **Realizado Jan–Jul/26** e **Forecast Ago–Dez/26**, mantendo amarelo e violeta como cenários distintos no mesmo Outlook anual.

| Indicador                                     |              Antes |            Depois |
| --------------------------------------------- | -----------------: | ----------------: |
| Textos `text-white/10–40`                     |                212 |                 0 |
| Fontes arbitrárias de 8–10px                  |                130 |                 0 |
| Bloqueio `maximum-scale`                      |                  1 |                 0 |
| Hexadecimais literais fora de `components/ui` | 365 em 28 arquivos |                 0 |
| Arquivos de código com caminho `/home/ubuntu` |                  3 |                 0 |
| Linhas acima de 140 caracteres                |                928 |                 0 |
| Testes automatizados                          |  46 em 10 arquivos | 51 em 12 arquivos |

## Entregas por bloco

| Bloco          | Resultado                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| Bugs críticos  | Insights compartilhado nos dois workspaces; fallback explícito para seção desconhecida                   |
| Acessibilidade | Contraste semântico, mínimo de 11px e zoom mobile liberado                                               |
| Tokens         | Marca, superfícies, texto, status e direção centralizados em CSS variables                               |
| Legibilidade   | Prettier em 100 colunas, lint permanente e zero linhas acima de 140 caracteres                           |
| Decomposição   | Financeiro separado em nove arquivos; Expansão em sete; Document Center em três                          |
| Testes         | Testes de frontend para Outlook, granularidade, Insights, fallback, contraste e zoom                     |
| Portabilidade  | Carregador financeiro configurável por ambiente; caminhos absolutos eliminados                           |
| Produção       | Analytics condicionado a produção e variáveis válidas; debug não é injetado em produção                  |
| Código sem uso | `AIChatBox`, `ComponentShowcase` e `ManusDialog` removidos após confirmação de ausência de uso funcional |

## Preservação funcional

Nenhuma migration, tabela ou permissão foi alterada. As condições e agregações SQL financeiras foram preservadas; apenas a formatação interna das templates foi quebrada em múltiplas linhas. Os totais oficiais permanecem protegidos pelos sete testes de integração do Financeiro de Mercado.

> A comparação anual mantém Realizado e Forecast como séries distintas. Forecast nunca é apresentado como Realizado, e YoY continua bloqueado quando a janela não é metodologicamente comparável.

## Evidências finais

| Comando          | Resultado                                                               |
| ---------------- | ----------------------------------------------------------------------- |
| `pnpm lint`      | Aprovado                                                                |
| `pnpm check`     | Aprovado; zero imports ausentes                                         |
| `pnpm test`      | 51 testes aprovados em 12 arquivos                                      |
| `pnpm build`     | Aprovado; 2.465 módulos transformados                                   |
| Auditoria visual | Financeiro, Variation Explorer e Insights validados em desktop e mobile |

## Estrutura resultante

`FinanceMarket.tsx` possui 25 linhas, `ExpansionWorkspace.tsx` possui 162 linhas e `DocumentCenter.tsx` possui 252 linhas. As responsabilidades foram distribuídas em componentes nomeados no mesmo diretório, mantendo os imports relativos e os contratos originais.
