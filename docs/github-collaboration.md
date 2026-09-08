# Governança GitHub — Vitru Nexus

## Modelo operacional

Claude escreve código em branches isoladas e abre pull requests para `develop`. O Manus revisa o
diff, reconcilia regras de negócio, executa testes completos no ambiente governado e decide a
integração. A branch `main` representa a última versão aprovada; a publicação ocorre somente por
checkpoint do Manus.

## Responsabilidades

| Etapa                        | Responsável primário | Evidência                           |
| ---------------------------- | -------------------- | ----------------------------------- |
| Definição da tarefa          | Produto + Manus      | Issue e critérios de aceite         |
| Implementação                | Claude               | Branch e pull request               |
| Revisão técnica e financeira | Manus                | Comentários, testes e reconciliação |
| Aprovação de negócio         | Rodrigo Mattjie      | Aprovação do PR                     |
| Publicação                   | Manus                | Checkpoint e versão publicada       |

## Política de merge

PRs de trabalho entram em `develop` por squash merge. Releases entram em `main` por PR explícito,
depois da validação completa. Push direto, force push e exclusão de branches protegidas devem ficar
bloqueados. O branch deve estar atualizado e o check `Lint, types, tests and build` precisa estar
verde antes do merge.

## Rollback

No GitHub, reverta o pull request responsável. No ambiente publicado, use o checkpoint estável
anterior. Não use `git reset --hard` no projeto gerenciado e não reverta migrations destrutivamente.
