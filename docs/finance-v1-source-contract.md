# Financeiro V1 — Contrato da fonte oficial

## Conclusão executiva

A `BASE_REAL_MKTv2.xlsx` é a fonte oficial da V1 analítica. A camada de fatos deve carregar **39.554 linhas válidas** da aba `BASE_REAL_MKT`, preservar os valores contábeis assinados e criar uma medida gerencial de investimento com sinal invertido. Sete linhas físicas no final da planilha não possuem origem, competência ou valor; quatro estão vazias e três contêm apenas resíduos textuais. Elas não são fatos financeiros e serão registradas como ocorrências de qualidade, sem exclusão silenciosa.

## Hash e inventário

| Item                  | Regra oficial                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Arquivo               | `BASE_REAL_MKTv2.xlsx`                                                                                                 |
| SHA-256               | `ef6a1a16d4f6b839b7d3d282a9cbffed0d51e32451885a4697416c39d514ef71`                                                     |
| Abas                  | `BASE_REAL_MKT`, `GLOSSÁRIO DE CATEGORIAS`, `PONTOS DE ATENÇÃO E IMPRECISÃO`, `MIDIA_ON_VERIFICAR` e `DIN_CONFERENCIA` |
| Fatos válidos         | 39.554                                                                                                                 |
| Rejeições registradas | 7                                                                                                                      |
| Período da fonte      | jan/2024 a dez/2026                                                                                                    |
| Moeda                 | BRL                                                                                                                    |

As abas ocultas `MIDIA_ON_VERIFICAR` e `DIN_CONFERENCIA` são estruturas de conferência e não devem ser somadas novamente à base transacional. A primeira contém detalhamento usado na verificação de mídia; a segunda registra tabelas e observações de ajuste metodológico. Ambas são auditadas, mas não geram fatos adicionais.

## Separação Realizado e Forecast

> **Realizado** é todo registro com origem operacional de 2024, 2025 ou 2026. **Forecast** é exclusivamente o registro cuja origem oficial é `FCST`.

| Lente             | Regra                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| Real x Real       | Realizado de jan–jul/2025 contra Realizado de jan–jul/2026             |
| Outlook           | Realizado FY2025 contra Realizado jan–jul/2026 + Forecast ago–dez/2026 |
| Forecast restante | Somente registros `FCST` de ago–dez/2026                               |
| Proibição         | Forecast nunca compõe Realizado YTD e nunca recebe rótulo de realizado |

## Sinal contábil e leitura gerencial

O campo `VALOR` será mantido sem alteração como `amountSigned`. Para a experiência executiva, `managementAmount = -amountSigned`. Dessa forma, uma despesa contábil negativa aparece como investimento positivo; créditos, estornos e reversões aparecem como redução do investimento. O lançamento original, seu sinal e sua classificação permanecem acessíveis no detalhe.

## Duplicidades

A fonte possui nove linhas cujo conteúdo transacional é idêntico a uma linha anterior. Elas **não serão removidas**, pois não existe chave corporativa suficiente para afirmar duplicidade indevida. Cada registro recebe `sourceExcelRow` e `sourceRecordId`; ocorrências idênticas recebem `isExactDuplicate = true` e ficam disponíveis em Qualidade & Contexto.

## Glossário e observações

O Glossário contém 13 categorias e reconcilia integralmente com as categorias da base. As 24 linhas por marca da aba de Pontos de Atenção reconciliam sem diferença com a base quando aplicadas ao escopo correto: `EAD Uniasselvi` ou `EAD Unicesumar`. Essas observações não são causalidades calculadas pelo sistema; são contexto metodológico fornecido pelo analista e devem aparecer com fonte e status próprios.

## Mapeamento canônico

| Campo da fonte                                        | Papel na V1                                                             |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `ORIGEM`                                              | Lineage e regra de cenário                                              |
| `COMPETENCIA_DRE`, `COMPETENCIA`, `DIA`, `MES`, `ANO` | Tempo contábil e data de lançamento                                     |
| `MARCA`, `BU_DRE`, `MODALIDADE`, `PRODUTO`            | Hierarquia organizacional e de oferta                                   |
| `GRUPO_DRE`, `LINHA_DRE`                              | Hierarquia da DRE                                                       |
| `CT2_FILIAL`                                          | Filial contábil                                                         |
| `CCUSTO`, `DESCCC`                                    | Centro de custo e descrição                                             |
| `CONTA`, `CONTA_DESCRI`                               | Conta contábil e descrição                                              |
| `VERBA`, `VERBA_DESCRI`                               | Verba gerencial e descrição                                             |
| `HISTORICO`                                           | Evidência textual do lançamento, restrita à camada analítica autorizada |
| `USUARIO`                                             | Usuário operacional da origem; não representa owner financeiro do NEXUS |
| `CT2_LOTE`, `CT2_SBLOTE`                              | Lineage contábil                                                        |
| `VALOR`                                               | Valor contábil assinado                                                 |
| `LANCAMENTO_MANUAL`                                   | Sinalizador de controle e qualidade                                     |
| `TIPO_LANCAMENTO`                                     | Classificação CAC, VCM ou Ex-CAC                                        |
| `CATEGORIZACAO_VF`                                    | Categoria gerencial principal                                           |

## Estrutura de persistência

A fonte será carregada em tabelas próprias da primeira camada analítica, sem forçar os campos operacionais em dimensões futuras de Budget e Owner. O modelo terá carga oficial versionada, fatos de Mercado, Glossário, Pontos de Atenção e Ocorrências de Qualidade. O módulo orçamentário existente permanece preparado para Budget, Comprometido e revisões futuras, mas esses fatos não serão preenchidos por esta fonte.

## Limitações metodológicas visíveis no produto

Os campos `USUARIO`, `VERBA`, descrições de conta e centro de custo possuem lacunas relevantes. Códigos podem possuir mais de uma descrição ao longo da fonte. Algumas comparações de categorias exigem leitura conjunta ou refletem reclassificações, mudanças de escopo, erros de alocação e forecast sem baseline equivalente. A interface deve sinalizar esses casos em vez de atribuir causalidade automática.
