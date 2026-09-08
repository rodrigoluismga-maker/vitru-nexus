# Vitru Nexus V1 — Auditoria de entrega

## Conclusão executiva

A V1 estabelece uma fundação funcional para governança de portfólio: cockpit executivo, administração organizacional, RBAC, projetos, workspace universal de 13 seções, riscos, marcos, entregas, decisões, ações, indicadores, responsáveis, documentos, auditoria e notificações. A aplicação usa dados reais do banco e apresenta lacunas como **não avaliadas**, sem fabricar indicadores ou resultados.

## Controles validados

| Dimensão        | Situação                          | Evidência                                                                                                                                                          |
| --------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Arquitetura     | Aprovada para V1                  | Camadas de apresentação, routers, serviços e repositório administrativo separadas; contratos tRPC tipados de ponta a ponta.                                        |
| Segurança       | Aprovada com ressalva operacional | Autenticação da plataforma, autorização no backend, navegação administrativa condicionada ao papel e documentos com nível de acesso persistido.                    |
| Dados           | Aprovada                          | Schema relacional migrado; dois projetos iniciais cadastrados com nomes exatos; anexos mantidos fora do banco.                                                     |
| UX/UI           | Aprovada                          | Dark theme Vitru, shell responsivo, hierarquia executiva, estados vazios honestos, foco visível e motion reduzido.                                                 |
| Responsividade  | Aprovada                          | Rotas prioritárias revisadas em desktop 1440 px, notebook 1280 px, tablet 768 px e celular 390 px; navegação e tabelas usam adaptação ou rolagem contextual.       |
| Qualidade       | Aprovada                          | TypeScript sem erros, dezesseis testes Vitest aprovados e build de produção concluído.                                                                             |
| Performance     | Aprovada para V1                  | Rotas carregadas sob demanda e dependências divididas em chunks de framework, UI, dados e ícones, sem alerta de chunk superior a 500 kB.                           |
| Rastreabilidade | Aprovada                          | Eventos de auditoria por projeto e ação, histórico contextual e chaves idempotentes de notificação.                                                                |
| Acessibilidade  | Aprovada para V1                  | Foco visível global, labels nos formulários, `aria-invalid`, resumo de erros com `role=alert`, controles icônicos rotulados e respeito a `prefers-reduced-motion`. |
| Manutenção      | Aprovada para V1                  | Componentes de formulário, listagem, arquivamento, documentos e mídia reutilizáveis; repositório administrativo separado dos routers.                              |

## Decisões arquiteturais

1. A V1 usa um **monólito modular** com React, TypeScript, Express, tRPC, Drizzle e MySQL. A escolha reduz complexidade operacional sem impedir a futura extração de domínios.
2. O banco é a fonte transacional de governança. Arquivos e imagens são armazenados em S3; o banco guarda somente chaves, URLs e metadados.
3. A autorização é executada no backend. A interface oculta áreas incompatíveis com o papel do usuário, mas não substitui o controle do servidor.
4. O workspace mantém exatamente 13 seções universais para qualquer projeto. Seções futuras permanecem visíveis com placeholders identificados, preservando o contrato do produto.
5. Alertas recorrentes usam endpoint Heartbeat idempotente, nunca temporizadores dentro do processo.
6. Arquivamentos são lógicos e passam por bloqueio de integridade quando empresas, áreas, modalidades, categorias, status ou prioridades ainda possuem vínculos.

## Riscos residuais e limites da V1

| Ponto                                             | Impacto                                                                                                                                                                                                            | Encaminhamento                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Agendamento ainda não ativado                     | A geração automática de alertas vencidos não ocorrerá até a publicação.                                                                                                                                            | Publicar o checkpoint e, depois, criar o Heartbeat do projeto para `/api/scheduled/governance-alerts`. |
| Intelligence sem respostas geradas                | Evita respostas falsas nesta fase, mas não entrega copiloto de IA.                                                                                                                                                 | Implementar RAG com fontes, permissões e citações em versão posterior.                                 |
| Relatórios, análises e resultados sem integrações | As seções estão estruturadas, porém dependem das fontes corporativas.                                                                                                                                              | Priorizar Power BI, SharePoint/OneDrive e pipelines aprovados pela governança de dados.                |
| Segurança documental por metadado                 | O nível de acesso está persistido; políticas mais finas por projeto e objeto podem evoluir.                                                                                                                        | Adicionar ACL por projeto e testes de autorização por cenário antes da ampliação de usuários.          |
| Testes focados na fundação                        | Validações, APIs críticas, RBAC administrativo, serviços de notificação, cálculos de paginação, documentos, arquivamento e idempotência estão cobertos; fluxos completos de UI ainda não possuem E2E automatizado. | Incluir suíte E2E para cadastros, ação, decisão e upload antes de uma abertura ampla.                  |
| Bundle base de framework                          | O maior chunk é o runtime React compartilhado, embora as páginas estejam separadas.                                                                                                                                | Monitorar Web Vitals em produção e otimizar somente com evidência de impacto.                          |

## Próximo gate recomendado

Publicar a V1 em ambiente controlado, ativar o Heartbeat, validar com um grupo reduzido de administradores e líderes e medir: tempo para localizar uma pendência, completude cadastral, decisões em atraso, ações vencidas e qualidade dos registros. A próxima versão deve priorizar integrações corporativas e não ampliar a interface antes de validar o ritual real de governança.

## Evolução — Expansão Presencial 2027

### Conclusão executiva

O projeto **Expansão Presencial 2027** passou a operar sobre um template especializado sem romper o contrato universal de 13 seções. A evolução acrescentou um domínio relacional próprio para praças, ofertas, cenários, concorrência, mídia, força comercial e indicadores, mantendo riscos, marcos, entregas, ações, decisões, responsáveis, histórico e documentos no núcleo comum de governança.

### Evidências de auditoria

| Dimensão       | Situação                 | Evidência                                                                                                                                                                                     |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX             | Aprovada                 | Visão por exceção, filtros executivos por cidade, marca, curso, cenário e período, formulários contextuais e estados vazios que orientam o próximo passo.                                     |
| Dados          | Aprovada                 | Sete tabelas específicas migradas; projeto `EP-2027` associado ao template `expansion`; nenhum dado operacional, indicador, cidade ou resultado foi fabricado.                                |
| Segurança      | Aprovada                 | Leituras exigem `projects.view`; mutações exigem `governance.manage`; todas as gravações validam que o projeto pertence ao template de expansão.                                              |
| Consistência   | Aprovada                 | As 13 seções permanecem idênticas na navegação; os objetos universais são reutilizados e os dados específicos ficam isolados no domínio de expansão.                                          |
| Performance    | Aprovada para a evolução | Workspace permanece carregado sob demanda; chunk da rota ficou em 254,82 kB bruto e 30,40 kB gzip, sem alerta superior a 500 kB.                                                              |
| Responsividade | Aprovada                 | Rotas da expansão revisadas após as mudanças em desktop 1440 px, notebook 1280 px, tablet 768 px e celular 390 px. O canvas usa proporção 16:9 em desktop e altura fluida em telas estreitas. |
| Qualidade      | Aprovada                 | Typecheck sem erros, 16 testes em três arquivos aprovados e build de produção concluído. Foram adicionados testes de autenticação e validação do domínio de expansão.                         |

### Riscos residuais e próximos passos

| Ponto                                         | Impacto                                                                                                           | Encaminhamento                                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Fonte visual de referência ainda não recebida | O canvas já possui padrão 16:9 reutilizável, mas ainda não incorpora o layout específico mencionado pelo usuário. | Aplicar a referência quando o arquivo for enviado, preservando o componente reutilizável.          |
| Ausência de dados oficiais                    | As seções mostram estrutura e governança, mas não permitem conclusão sobre potencial, metas ou viabilidade.       | Carregar cidades, cursos, premissas e fontes oficiais antes de qualquer recomendação executiva.    |
| Cronograma usa marcos e entregas universais   | Evita duplicação, mas a disciplina de fase depende do título e do uso correto dos marcos.                         | Validar o ritual operacional antes de criar uma entidade adicional de fase por praça.              |
| Documentos usam vínculos universais           | Arquivos podem ser vinculados ao projeto, ação ou decisão, mas não diretamente a uma cidade ou oferta.            | Só ampliar os vínculos depois de validar volume documental e necessidade de consulta por entidade. |

## Evolução — Convites de Usuários via Microsoft 365

### Conclusão executiva

O diretório passou a suportar o ciclo completo de convite: criação preservada mesmo sem provedor disponível, histórico por tentativa, status de envio, reenvio, auditoria e ativação automática no primeiro login com o mesmo e-mail. A integração foi preparada para Microsoft Graph, mas permanece **deliberadamente inativa** até a TI fornecer e autorizar as credenciais corporativas.

| Dimensão    | Situação           | Evidência                                                                                                                                                       |
| ----------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Segurança   | Aprovada em código | Client credentials somente no servidor; `Mail.Send` de aplicação; recomendação de RBAC for Applications limitado à caixa remetente; nenhum segredo no frontend. |
| Resiliência | Aprovada           | Falha do Graph não desfaz o cadastro; a tentativa fica registrada e pode ser reenviada.                                                                         |
| Identidade  | Aprovada           | E-mail dark Vitru, CTA para `vitrunexus.com` e orientação explícita de autenticação corporativa sem senha local.                                                |
| Governança  | Aprovada           | Tentativa, destinatário, remetente, provider, usuário solicitante, retorno, erro e ativação persistidos; eventos relevantes também entram na auditoria.         |
| Autorização | Aprovada           | Criação, reenvio, configuração e histórico exigem `users.manage`; visão resumida exige `admin.view`.                                                            |
| Qualidade   | Aprovada           | Typecheck, 25 testes e build de produção aprovados; Graph substituído por doubles nos testes, sem disparo externo.                                              |
| Operação    | Preparada          | Interface mostra alerta enquanto a configuração estiver incompleta e mantém o botão de reenvio para usuários Convidados.                                        |

### Dependência externa

A ativação real depende de aplicação no Microsoft Entra ID, permissão de aplicação `Mail.Send`, consentimento administrativo, caixa remetente Microsoft 365 e escopo de Exchange Online limitado a essa caixa. Após a TI fornecer `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` e `MICROSOFT_SENDER_EMAIL`, será necessário validar um envio real e confirmar a recepção do e-mail.

## Evolução — Gestão Financeira

### Conclusão executiva

O **Módulo de Gestão Financeira** foi implementado como domínio próprio do Vitru Nexus e associado ao Planejamento Orçamentário 2027. A solução cobre planejamento, execução, compromissos, forecast, rateios, responsabilidade, fornecedores, governança de dados e tomada de decisão sem inserir valores demonstrativos no banco.

| Dimensão               | Situação            | Evidência                                                                                                                                                                          |
| ---------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquitetura            | Aprovada            | Módulo autônomo no shell compartilhado; 17 tabelas financeiras; quatro fatos separados; contratos tRPC tipados; serviços de cálculo e importação isolados.                         |
| Integridade relacional | Aprovada            | Schema publicado comparado com 121 chaves estrangeiras e 29 índices nomeados, sem divergências.                                                                                    |
| Cálculos               | Aprovada            | Orçamento revisado, realizado YTD, comprometido, saldo disponível, forecast, desvios, YoY, consumo, run rate, composição e reconciliação de rateios testados.                      |
| Governança de cargas   | Aprovada            | XLSX/CSV, templates por tipo, staging, erros, de-para, duplicidade, submissão, aprovação, rejeição, substituição de escopo, reversão e histórico.                                  |
| Segurança              | Aprovada            | Perfis Viewer, Contributor, Approver e Admin; capacidades refletidas na interface; backend valida permissões e aplica escopos de empresa, área e owner.                            |
| Rastreabilidade        | Aprovada            | Lotes, decisões, versões, ciclos, dimensões, de-paras, escopos e reversões produzem registros persistidos e eventos de auditoria.                                                  |
| Performance            | Aprovada para o MVP | Arquivos limitados a 20 MB e 100 mil linhas; updates e inserts processados em blocos de 500; benchmark estrutural de 100 mil linhas em 204,82 ms e 64,77 MB de heap.               |
| Qualidade              | Aprovada            | Typecheck sem erros, oito arquivos de teste com 36 testes aprovados e build de produção concluído em 8,33 s.                                                                       |
| Bundle                 | Aprovado para o MVP | Rotas financeiras lazy-loaded; maiores chunks: React 477,98 kB, gráficos 311,58 kB e workspace de projetos 255,53 kB, todos abaixo de 500 kB bruto.                                |
| Responsividade         | Aprovada            | Cockpit, análises, Central de Dados e configurações revisados em desktop 1440 px, tablet 768 px e celular 390 px; tablets passaram a usar drawer para preservar largura analítica. |
| Dados                  | Aprovada            | Nenhum fato financeiro fictício foi persistido. O ciclo 2027 existe apenas como estrutura e os indicadores permanecem indisponíveis até a aprovação de arquivos oficiais.          |

### Riscos residuais e encaminhamentos

| Ponto                                   | Impacto                                                                                                     | Encaminhamento                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Primeira carga real ainda não executada | A reconciliação está comprovada por testes integrados, mas não por arquivo corporativo.                     | Executar piloto pequeno, comparar com a fonte e liberar o fluxo após aceite financeiro.               |
| Processamento síncrono no MVP           | Arquivos próximos ao limite podem pressionar o timeout dependendo da complexidade de mapeamento e do banco. | Monitorar as primeiras cargas e migrar para job assíncrono persistente se o tempo operacional exigir. |
| Ausência de E2E automatizado            | Regressões de interação dependem de teste manual e inspeção visual.                                         | Automatizar upload, correção, submissão, aprovação e reversão antes de ampliar operadores.            |
| Fontes corporativas ainda manuais       | O valor analítico depende da disciplina dos arquivos e dos cadastros.                                       | Priorizar integração com ERP, planejamento e Power BI após estabilizar o ritual de fechamento.        |
