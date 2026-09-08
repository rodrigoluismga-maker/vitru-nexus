# Vitru Nexus — Módulo de Gestão Financeira

## Conclusão executiva

O módulo financeiro foi implementado como **domínio autônomo dentro do Vitru Nexus**, vinculado ao projeto **Planejamento Orçamentário 2027**, mas separado das 13 seções universais. A solução centraliza planejamento, realizado, compromissos, forecast, rateios, responsabilidade financeira e governança de cargas, mantendo autenticação, usuários, empresas, áreas, auditoria e experiência visual compartilhadas com o NEXUS.

Nenhum número financeiro foi criado para demonstração. Enquanto não houver lotes oficiais aprovados, o cockpit apresenta estados vazios, indicadores indisponíveis e orientações para a carga inicial.

## Estrutura entregue

| Área                  | Finalidade                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Cockpit               | KPIs, evolução mensal, qualidade da base, alertas determinísticos, composição por dimensão e decisões pendentes. |
| Orçamento x Realizado | Comparação por 12 dimensões gerenciais, com orçamento, realizado, comprometido, forecast e desvios.              |
| Comprometimentos      | Acompanhamento de valores originais, realizados, em aberto, datas e documentos.                                  |
| Investimentos         | Leitura de execução por natureza de investimento e dimensões associadas.                                         |
| Responsabilidade      | Visão de orçamento, execução e pressão financeira por owner.                                                     |
| Fornecedores          | Consulta governada de fornecedores e contratos.                                                                  |
| Rateios               | Regras, destinos, execuções, lançamentos e reconciliação Casa e Condomínio.                                      |
| Central de Dados      | Templates, upload XLSX/CSV, staging, validação, de-para, submissão, aprovação, rejeição, reversão e histórico.   |
| Configurações         | Ciclos, versões, dimensões, status, escopos e alçadas.                                                           |

## Modelo de dados e governança

O domínio financeiro possui 17 tabelas próprias, quatro fatos separados — orçamento, realizado, comprometido e forecast —, dimensões compartilhadas e específicas, lotes de importação, staging, erros, regras de mapeamento, aprovações, rateios e escopos por usuário. O schema publicado foi conferido contra 121 chaves estrangeiras e 29 índices nomeados.

As versões financeiras são independentes dos lotes. Uma versão de orçamento ou forecast pode ser criada, aprovada e referenciada por múltiplas cargas. A substituição de escopo desativa os fatos anteriores sem apagá-los; a reversão desativa os fatos do lote revertido e restaura os registros que ele havia substituído.

## Fluxo recomendado de carga

1. Selecione o tipo de carga na Central de Dados e baixe o template XLSX ou CSV correspondente.
2. Preencha somente dados oficiais, preservando cabeçalhos, códigos e competência no padrão `AAAA-MM`.
3. Envie o arquivo e escolha entre **acréscimo** e **substituição de escopo**.
4. Revise a prévia, os erros estruturais, os códigos não reconhecidos e a reconciliação estimada.
5. Crie regras de de-para quando a origem utilizar códigos diferentes do cadastro oficial e revalide o lote.
6. Submeta o lote para aprovação. Apenas perfis com alçada podem persistir ou rejeitar a carga.
7. Após a persistência, acompanhe a reconciliação e, se necessário, execute a reversão governada com justificativa.

## Alçadas

| Perfil              | Capacidades principais                                                             |
| ------------------- | ---------------------------------------------------------------------------------- |
| Finance Viewer      | Consulta de cockpit e análises dentro do escopo atribuído.                         |
| Finance Contributor | Consulta, importação, mapeamento e submissão de lotes.                             |
| Finance Approver    | Consulta, revisão, aprovação ou rejeição de lotes e versões.                       |
| Finance Admin       | Administração integral, incluindo dimensões, ciclos, versões, escopos e reversões. |

A interface oculta navegação e ações incompatíveis com o perfil, enquanto o backend mantém a validação definitiva de cada permissão. Os escopos de empresa, área e responsável são aplicados às consultas de fatos e comparações.

## Limites operacionais do MVP

Cada arquivo pode ter até **20 MB** e **100 mil linhas**. A validação e a persistência usam blocos de 500 registros. Um benchmark isolado de 100 mil linhas sem erros estruturais concluiu a validação em aproximadamente 205 ms e utilizou cerca de 65 MB de heap no ambiente de desenvolvimento; o resultado não substitui monitoramento de produção nem mede upload, storage, consultas ao banco ou aprovação transacional.

## Critérios para entrada em operação

Antes do primeiro fechamento, a área financeira deve validar os cadastros de empresas, áreas, centros de custo, contas gerenciais, naturezas, owners, fornecedores e contratos; criar e aprovar as versões de orçamento e forecast; atribuir os perfis financeiros; e executar uma carga piloto de pequeno volume. A abertura ampla deve ocorrer somente após reconciliação do lote piloto com a fonte oficial.

## Riscos residuais

| Risco                                                           | Encaminhamento                                                                                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquivos grandes processados dentro de uma requisição           | Monitorar tempo e memória das primeiras cargas. Se o volume real exceder o orçamento operacional, mover parsing e commit para processamento assíncrono persistente. |
| Ausência de dados oficiais no ambiente atual                    | Validar o fluxo com um arquivo real controlado antes de usar os indicadores em decisão executiva.                                                                   |
| Testes de UI não automatizados                                  | Manter a inspeção visual e adicionar E2E para carga, aprovação e reversão antes de ampliar o número de operadores.                                                  |
| Taxonomia financeira governada por tipos definidos no Blueprint | Novos tipos de dimensão exigem evolução controlada do schema e dos contratos; registros dentro dos tipos existentes são parametrizáveis.                            |
