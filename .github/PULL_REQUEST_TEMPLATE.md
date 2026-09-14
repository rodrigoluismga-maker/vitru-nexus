<!--
Preencha todas as seções. PRs incompletos ou sem evidência de `pnpm quality` serão devolvidos.
Consulte CLAUDE.md e CONTRIBUTING.md antes de abrir este pull request.
-->

## Resumo executivo

<!-- O que muda e por quê, em 2-3 frases. Sem jargão de implementação. -->

## Arquivos alterados

<!-- Liste os caminhos alterados/criados/removidos. -->

## Critérios de aceite

<!-- O que precisa ser verdade para este PR ser aceito. -->

- [ ]
- [ ]

## Evidências

<!-- Saída de `pnpm quality`, screenshots, ou resultado de testes relevantes. -->

## Riscos

<!-- O que pode dar errado e o que foi feito para mitigar. Se nenhum risco foi identificado, declare isso explicitamente. -->

## Rollback

<!-- Como reverter esta mudança caso algo saia errado após o merge. -->

## Checklist de conformidade

- [ ] Não inclui SQL executado, migration aplicada, carga de dados, deploy ou publicação.
- [ ] Não inclui secrets, planilhas oficiais, dumps, arquivos de usuários ou dados pessoais.
- [ ] Não mistura Realizado e Forecast, nem inventa Budget, Comprometido, ROI ou indicadores.
- [ ] Não altera autenticação, RBAC, autorização por objeto, storage, schema ou migration sem revisão específica destacada acima.
- [ ] Frontend usa tRPC (sem fetch/Axios customizado para APIs internas).
- [ ] `pnpm quality` executado localmente com sucesso (evidência anexada).
- [ ] Base é `develop` (branches `claude/<id>-<slug>`, `fix/<id>-<slug>`) ou `main` (apenas `hotfix/<id>-<slug>`).
