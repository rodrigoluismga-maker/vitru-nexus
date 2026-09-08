# Evidências Visuais — Auditoria 360º

## Financeiro de Mercado

As telas de Visão Executiva, Outlook, Forecast, Variation Explorer, Lançamentos e Contexto & Qualidade foram capturadas em 1440 × 1000 no ambiente autenticado.

| ID          | Evidência                                                                                                                                                                          | Classificação preliminar                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| AUD-FIN-001 | KPIs padrão exibem R$ 195,3 mi em Real Jan–Jul/25, R$ 197,8 mi em Real Jan–Jul/26 e +1,3% YoY, coerentes com fonte e banco após arredondamento                                     | OK                                                                      |
| AUD-FIN-002 | Outlook exibe R$ 314,8 mi em FY25, R$ 339,2 mi em FY26 e +7,7% YoY, coerentes com fonte e banco após arredondamento                                                                | OK                                                                      |
| AUD-FIN-003 | Forecast isolado exibe R$ 141,4 mi, 375 lançamentos e YoY “Não aplicável”                                                                                                          | OK                                                                      |
| AUD-FIN-004 | Na captura automatizada, as cinco barras de Forecast parecem deslocadas para posições anteriores a Ago–Dez; o código mantém 12 categorias e associa Forecast apenas aos meses 8–12 | NÃO VALIDADO — possível artefato da animação SVG congelada pela captura |
| AUD-FIN-005 | Nas capturas Real e Outlook, as barras parecem comprimidas no início do eixo; testes da função temporal comprovam 12 posições e separação Jan–Jul/Ago–Dez                          | NÃO VALIDADO — requer confirmação manual no navegador vivo              |
| AUD-FIN-006 | Variation Explorer mostra ordenação, sinal, cores de direção, Mix 26, relevância e ação de aprofundamento                                                                          | OK                                                                      |
| AUD-FIN-007 | Lançamentos preservam cenário, valor gerencial, valor contábil, lote e linha de origem, mas a página completa é muito extensa em desktop                                           | P3                                                                      |
| AUD-FIN-008 | Contexto & Qualidade mostra 39.554 fatos, 7 rejeições, 9 possíveis duplicidades, 24 pontos de atenção, Glossário e issues por linha                                                | OK                                                                      |

## Interpretação

As capturas automatizadas congelam animações e podem registrar barras do Recharts durante sua transição de entrada. A inspeção do código comprovou que a interface cria exatamente 12 pontos, um para cada mês, e a suíte de frontend comprova Realizado em janeiro e Forecast em dezembro. Como a evidência visual e a evidência programática divergem, o item não será classificado como defeito sem confirmação manual no navegador vivo. Nenhum total de KPI foi afetado.

## Portfólio, workspaces e administração

| ID          | Evidência                                                                                                                                    | Classificação preliminar                                                      |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| AUD-PRJ-001 | Home e Gestão de Projetos reconciliam com dois projetos ativos no banco                                                                      | OK                                                                            |
| AUD-PRJ-002 | Ambos os projetos aparecem com 0% de progresso, sem responsáveis e sem indicadores; o banco possui zero ações, riscos e decisões             | P1 para demonstração executiva fora do Financeiro                             |
| AUD-PRJ-003 | O CTA financeiro no hero do Planejamento Orçamentário aparece cortado no limite direito em 1440px                                            | P2                                                                            |
| AUD-EXP-001 | Expansão Presencial possui estrutura completa, mas zero cidades, ofertas, cenários, concorrentes, mídia, força comercial e métricas no banco | P1 para demonstração de conteúdo; funcionalidade não validada com dados reais |
| AUD-EXP-002 | A aba Insights renderiza checklists como itens preparados, porém não existem dados operacionais para gerar insights                          | P2 — risco de percepção de prontidão maior que a evidência                    |
| AUD-DOC-001 | Central de Documentos exibe estado vazio coerente com zero documentos no banco                                                               | OK, mas CRUD com arquivo real não foi validado nesta auditoria                |
| AUD-ADM-001 | Empresas mostra cinco registros, reconciliando com o banco; quatro ativos e um inativo                                                       | OK                                                                            |
| AUD-ADM-002 | Gestão de Projetos mostra dois registros, reconciliando com o banco                                                                          | OK                                                                            |
| AUD-ADM-003 | Usuários mostra três registros, reconciliando com o banco; um convite permanece com falha de integração Microsoft 365                        | P2 operacional                                                                |
| AUD-ADM-004 | Perfis e permissões oferece 12 perfis ativos com sobreposição conceitual relevante entre papéis financeiros e gerais                         | P2 de governança                                                              |
| AUD-PLH-001 | Intelligence, Análises e Configurações são placeholders explicitamente rotulados como estrutura preparada                                    | P2 para demonstração; não apresentar como módulos funcionais                  |
| AUD-FUT-001 | Futuro da Alocação separa corretamente o que existe do que não possui fonte e não simula Budget, Comprometido, Saldo ou Eficiência           | OK                                                                            |

## Leitura executiva preliminar

O módulo Financeiro pode ser demonstrado com ressalvas metodológicas visíveis. O portfólio e a Expansão não devem ser apresentados como operações preenchidas: hoje demonstram arquitetura, não execução. Intelligence, Análises e Configurações devem ser tratados como roadmap, e não como capacidades disponíveis.

## Responsividade e experiência por persona

Foram auditadas as jornadas prioritárias em 390 × 844, 1024 × 768 e 1440 × 1000.

| ID         | Evidência                                                                                                                                                                  | Classificação preliminar                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| AUD-UX-001 | Home mantém KPIs, portfólio, entregas, atividade e qualidade legíveis nos três viewports                                                                                   | OK                                            |
| AUD-UX-002 | No mobile, o Financeiro exige percorrer hero, navegação e painel completo de filtros antes de alcançar a primeira resposta executiva                                       | P2 — excesso de profundidade antes do insight |
| AUD-UX-003 | Variation Explorer preserva ponte e tabela no mobile, mas as colunas analíticas dependem de rolagem horizontal e não mantêm dimensão/driver visível                        | P2                                            |
| AUD-UX-004 | Em 1024px, a tabela de Usuários corta as colunas finais e ações; o usuário não recebe uma indicação visual clara de rolagem horizontal                                     | P1 operacional                                |
| AUD-UX-005 | Perfis e permissões mantém hierarquia e leitura adequadas em tablet                                                                                                        | OK                                            |
| AUD-UX-006 | O CTA do Planejamento Orçamentário não apresentou corte em 1024px; o achado anterior em 1440px não foi reproduzido de forma consistente                                    | NÃO VALIDADO                                  |
| AUD-UX-007 | A ausência de entregas, riscos, decisões e ações é comunicada com estados vazios claros e sem preenchimento fictício                                                       | OK                                            |
| AUD-UX-008 | As telas financeiras respondem bem ao Gestor e ao Analista; a Home responde ao CEO em menos de uma dobra, mas revela que o portfólio ainda não possui conteúdo operacional | OK com ressalva de prontidão de dados         |
