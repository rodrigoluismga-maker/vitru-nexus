# Vitru Nexus V1 — Arquitetura de Fundação

## Tese do produto

O Vitru Nexus será o sistema de governança do portfólio estratégico. A V1 combina duas experiências sobre a mesma base: um **cockpit executivo**, orientado a exceções, riscos, decisões e entregas, e um **núcleo administrativo**, responsável pelos cadastros, permissões e objetos reutilizados por todos os projetos.

O produto não duplicará estruturas para projetos específicos. “Planejamento Orçamentário 2027” e “Expansão Presencial 2027” serão instâncias do mesmo modelo, com o mesmo workspace de 13 seções e sem números operacionais inventados.

## Direção de marca e experiência

O brandbook Vitru V02, de abril de 2026, define a marca como desbravadora, inspiradora, perspicaz, transparente e transformadora. A interface traduzirá essa personalidade por precisão, profundidade, clareza e movimento controlado.

| Elemento             | Diretriz aplicada                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Paleta primária      | Roxo `#281352`, amarelo `#FFC20E`, branco `#FFFFFF` e preto `#000000`                                |
| Paleta secundária    | Roxos `#6824D3`, `#8411CE`, lilás `#A689F7`, rosa `#EF4D7F` e cinza `#BCBEC0`                        |
| Tipografia           | Trebuchet MS como família sistêmica oficial, com fallbacks nativos; números tabulares para métricas  |
| Logo em fundo escuro | Versão negativa oficial: `/manus-storage/vitru-logo-negativa_39bed332.webp`                          |
| Logo em fundo claro  | Versão positiva oficial: `/manus-storage/vitru-logo-positiva_ffa22226.webp`                          |
| Composição           | Dark profundo, superfícies em camadas, luz roxa direcional e amarelo restrito a ação ou atenção      |
| Motion               | Transições entre 120 e 280 ms; apenas `transform` e `opacity`; respeito a `prefers-reduced-motion`   |
| Acessibilidade       | Texto e estados nunca dependerão apenas de cor; foco visível, teclado e contraste serão obrigatórios |

A intenção cinematográfica será aplicada em momentos de entrada, cabeçalhos, fundos atmosféricos e transições de contexto. Tabelas, formulários e superfícies operacionais permanecerão densos, precisos e silenciosos.

## Camadas

| Camada        | Responsabilidade                                                         |
| ------------- | ------------------------------------------------------------------------ |
| Presentation  | React, rotas, componentes, estados, acessibilidade e composição visual   |
| Application   | Casos de uso tRPC, validação, autorização e coordenação transacional     |
| Business      | Regras de projeto, ação, risco, decisão, saúde, prioridade e notificação |
| Data          | Drizzle, MySQL, queries, migrations, storage e read models               |
| Cross-cutting | Autenticação, RBAC, auditoria, observabilidade, upload e notificações    |

## Domínios e entidades

| Domínio      | Entidades centrais                                                          |
| ------------ | --------------------------------------------------------------------------- |
| Organização  | Empresas, modalidades e áreas                                               |
| Acesso       | Usuários, perfis, permissões e associações                                  |
| Portfólio    | Categorias, status, prioridades, projetos, responsáveis, tags e indicadores |
| Execução     | Ações, dependências, checklist, comentários e horas                         |
| Governança   | Riscos, decisões, marcos, entregas, histórico e auditoria                   |
| Conhecimento | Documentos, anexos, versões, vínculos e permissões                          |
| Comunicação  | Notificações, preferências e registros de envio/leitura                     |

## Regras estruturantes

Projetos, ações, riscos, decisões, marcos e documentos terão identificadores imutáveis, autoria e timestamps. Exclusões de cadastros referenciados serão lógicas por status. Percentuais serão validados entre 0 e 100. Datas serão persistidas em UTC. Documentos ficarão no storage; o banco armazenará apenas chave, URL, nome, tipo, tamanho, classificação e vínculo.

Autorização será verificada no backend. O papel da autenticação nativa continuará distinguindo usuário e administrador da plataforma; o RBAC de negócio acrescentará perfis como Administrador, Diretor, Gerente, Coordenador, Analista e Consulta. Permissões serão granulares por recurso e ação, preparadas para escopo de projeto, empresa e área.

## Notificações: opções e decisão

| Abordagem                                             | Trade-offs                                                                                                          | Custo | Complexidade |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----: | -----------: |
| Apenas notificações criadas durante alterações        | Imediata, simples e suficiente para atualizações; não detecta automaticamente itens que venceram sem nova interação | Baixo |        Baixa |
| Eventos imediatos + verificação diária determinística | Cobre alterações e vencimentos; requer endpoint idempotente e ativação após publicação                              | Baixo |        Média |

A V1 usará a segunda abordagem. Mutações importantes criarão notificações imediatamente, e um handler diário idempotente verificará ações vencidas e decisões pendentes. A rotina será ativada somente após o primeiro deploy, porque o agendador precisa chamar uma URL pública de produção.

## Workspace universal

Todo projeto terá exatamente estas seções e nesta ordem: **Visão Executiva, Dashboard, Indicadores, Resultados, Relatórios, Análises, Documentos, Cronograma, Planos de Ação, Decisões, Responsáveis, Histórico e Insights**. Cada seção consumirá os mesmos objetos do domínio; telas ainda não alimentadas apresentarão estados vazios claros, nunca números ou respostas simuladas.

## Rotas principais

| Área          | Rotas                                                                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Executivo     | `/`, `/portfolio`, `/alerts`                                                                                                                                                                                        |
| Projetos      | `/projects`, `/projects/:id/:section`                                                                                                                                                                               |
| Administração | `/admin`, `/admin/companies`, `/admin/modalities`, `/admin/areas`, `/admin/users`, `/admin/roles`, `/admin/project-categories`, `/admin/project-statuses`, `/admin/priorities`, `/admin/projects`, `/admin/actions` |
| Conhecimento  | `/documents`                                                                                                                                                                                                        |
| Conta         | `/profile`                                                                                                                                                                                                          |

## Critérios de qualidade

A entrega só será concluída após schema e migration aplicados, typecheck sem erros, testes Vitest aprovados, build de produção válido, inspeção visual desktop/mobile e auditoria de UX, arquitetura, acessibilidade, performance e responsividade. Dados de negócio não fornecidos permanecerão ausentes ou explicitamente não avaliados.
