# Auditoria 360º do Vitru Nexus

**Autor:** Manus AI  
**Data:** 4 de setembro de 2026  
**Escopo:** aplicação completa, banco ativo, fonte financeira oficial, APIs, telas, filtros, segurança, performance e experiência executiva.

## Veredito executivo

**O Vitru Nexus é confiável no núcleo financeiro auditado, mas ainda não está pronto para ser apresentado como plataforma corporativa integral.** A base de Mercado, os principais cálculos, o Outlook, a separação Realizado/Forecast e o drill-down transacional reconciliam. Não foi encontrado P0. Entretanto, existem nove P1 que afetam prontidão operacional, segurança do artefato, tratamento de erros, governança e demonstração dos módulos ainda vazios.

> **Recomendação:** liberar demonstração controlada do Financeiro de Mercado; não declarar Expansão, governança de projetos, Intelligence, Análises ou Configurações como módulos operacionais até concluir a Onda 1.

| Dimensão              | Veredito               | Evidência principal                                                                                     |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Dados financeiros     | Verde                  | 39.554 fatos válidos, 7 rejeições e 9 duplicidades preservadas                                          |
| Cálculos              | Verde                  | 57 testes; invariâncias total = marcas = categorias aprovadas                                           |
| Realizado × Forecast  | Verde                  | Forecast restrito a Ago–Dez/26 e Outlook reconciliado                                                   |
| Qualidade da fonte    | Verde com ressalvas    | Data Quality Score de 96,21; rastreabilidade de 80,75                                                   |
| Portfólio e Expansão  | Vermelho para operação | Estrutura existe, mas não há dados executivos, owners, ações, riscos ou métricas                        |
| Segurança             | Amarelo                | RBAC e arquivos privados são fortes; debug no artefato, uploads de mídia e dependências exigem correção |
| UX e responsividade   | Amarelo                | Financeiro é forte; administração em notebook e mobile analítico exigem ajustes                         |
| Performance           | Amarelo                | APIs principais entre 108 ms e 942 ms; bundles compartilhados são pesados                               |
| Operação e manutenção | Amarelo                | Carga de Mercado é técnica; ciclos de vida de documentos e governança são incompletos                   |

## O que está comprovadamente confiável

Os totais de Real Jan–Jul/25, Real Jan–Jul/26, Forecast Ago–Dez/26 e Outlook FY26 são iguais na fonte auditada, no banco ativo e na API. A tela apresenta os mesmos valores arredondados. A soma das marcas reconcilia com o total, cada marca reconcilia com suas categorias e o Outlook FY26 é exatamente Realizado YTD mais Forecast restante.[1] [2]

Não há números falsos de Budget, Comprometido, Saldo, ROI, Resultado ou Eficiência no módulo oficial de Mercado. O produto mantém esses recursos como futuros e identifica a inexistência de fonte.[3]

## Principais riscos

| Prioridade | Risco                                                       | Decisão recomendada                               |
| ---------: | ----------------------------------------------------------- | ------------------------------------------------- |
|          1 | Erro de API pode parecer ausência de dados                  | Corrigir antes de uso executivo recorrente        |
|          2 | Debug permanece referenciado no HTML de produção            | Remover e comprovar no artefato publicado         |
|          3 | Portfólio e Expansão estão vazios                           | Não demonstrar como operação real                 |
|          4 | Carga de Mercado depende de script técnico                  | Criar processo governado de atualização           |
|          5 | Escopo granular não é representável na fonte de Mercado     | Definir de-para oficial antes de ampliar usuários |
|          6 | Ciclo de vida de documentos, riscos e decisões é incompleto | Implementar manutenção e arquivamento lógico      |
|          7 | Tabela de usuários perde ações em notebook                  | Corrigir antes de delegar administração           |
|          8 | Não existe E2E dos fluxos críticos                          | Adicionar testes de navegador antes de escalar    |
|          9 | Radar executivo mistura sinal com tentativas técnicas       | Separar eventos operacionais de incidentes reais  |

## Decisão de apresentação

| Situação                               | Decisão                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| Financeiro de Mercado para liderança   | **Pode demonstrar**, com foco em valores, comparáveis, Outlook, drivers e lançamentos |
| Contexto & Qualidade                   | **Pode demonstrar**, incluindo duplicidades e lacunas explicitamente                  |
| Futuro da Alocação                     | **Pode demonstrar como roadmap**, sem prometer disponibilidade                        |
| Portfólio e Planejamento Orçamentário  | **Demonstrar apenas arquitetura**, pois conteúdo operacional está vazio               |
| Expansão Presencial                    | **Não demonstrar como módulo preenchido**                                             |
| Intelligence, Análises e Configurações | **Apresentar somente como visão futura**                                              |
| Uso corporativo ampliado               | **Não liberar ainda**; depende da Onda 1                                              |

## Próximo passo recomendado

Executar a **Onda 1 em sete dias**, fechando P1s técnicos e de demonstração. Na sequência, carregar dados oficiais mínimos de projetos e Expansão, formalizar escopos e automatizar o pipeline financeiro. O plano detalhado está em [plano-corretivo.md](./plano-corretivo.md).

## Referências

[1]: ./matriz-reconciliacao.md "Matriz Fonte × Banco × API × Tela"
[2]: ../../server/audit360.invariance.test.ts "Testes de invariância"
[3]: ../finance-v1-source-contract.md "Contrato da fonte financeira"
[4]: ./findings-register.md "Registro completo de achados"
[5]: ./visual-findings.md "Evidências visuais"
