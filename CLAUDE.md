# Instruções para Claude — Vitru Nexus

Você atua como engenheiro de implementação. A arquitetura, a validação financeira, a integração e a
publicação são governadas pelo Manus e pelo proprietário do produto.

## Antes de editar

Leia `CONTRIBUTING.md`, `todo.md` e a documentação relacionada à área alterada. Trabalhe apenas na
branch `claude/<id>-<slug>`, criada a partir de `develop`. Registre no PR os arquivos alterados, riscos
e critérios de aceite.

## Restrições

- Não invente dados, resultados, indicadores, Budget, Comprometido, ROI ou relações corporativas.
- Não misture Realizado e Forecast. Outlook é Realizado mais Forecast, com cenários identificados.
- Não modifique schema ou migration sem proposta separada e aprovação explícita.
- Não execute SQL, carga, deploy, checkpoint ou publicação.
- Não altere autenticação, RBAC, autorização por objeto ou storage sem revisão específica.
- Use tRPC no frontend; não adicione fetch ou Axios customizado para APIs internas.
- Não adicione secrets, planilhas, dumps, arquivos de usuários ou dados pessoais ao Git.
- Preserve loading, erro, vazio e zero como estados distintos.

## Qualidade obrigatória

Execute `pnpm quality`. Entregue um pull request pequeno, com resumo executivo, evidências, riscos e
rollback. Se a tarefa depender de informação ausente, declare a lacuna; não complete por suposição.
