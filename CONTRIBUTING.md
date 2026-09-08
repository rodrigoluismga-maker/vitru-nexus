# Contribuição no Vitru Nexus

O Vitru Nexus utiliza GitHub para colaboração e revisão, enquanto a publicação permanece governada
pelo Manus. Nenhuma mudança é publicada diretamente por um agente de implementação.

## Branches

| Branch               | Finalidade                     | Regra                                              |
| -------------------- | ------------------------------ | -------------------------------------------------- |
| `main`               | Código aprovado e publicado    | Protegida; recebe apenas PR de release             |
| `develop`            | Integração e homologação       | Protegida; recebe PR de trabalho                   |
| `claude/<id>-<slug>` | Implementação feita com Claude | Nasce de `develop`; PR para `develop`              |
| `fix/<id>-<slug>`    | Correção não urgente           | Nasce de `develop`; PR para `develop`              |
| `hotfix/<id>-<slug>` | Incidente de produção          | Nasce de `main`; revisão e publicação prioritárias |

## Fluxo de trabalho

1. Registre o objetivo e os critérios de aceite em uma issue.
2. Crie uma branch curta a partir de `develop`.
3. Restrinja a alteração aos arquivos autorizados na tarefa.
4. Execute `pnpm quality` antes de abrir o pull request.
5. Abra o PR usando o template e anexe evidências.
6. Aguarde revisão do proprietário e validação independente no Manus.
7. Depois da homologação, abra PR de `develop` para `main`.
8. O Manus sincroniza, reexecuta a validação completa e publica um checkpoint.

## Regras inegociáveis

Não envie secrets, planilhas oficiais, arquivos de usuários, dumps de banco ou dados pessoais. Não
execute migrations diretamente. Não altere RBAC, autenticação, regras financeiras ou contratos de
API sem destacar o impacto no PR. Nunca represente Forecast como Realizado e nunca preencha lacunas
com dados simulados.

## Validação local

```bash
pnpm install
pnpm quality
```

Os testes de integração com banco oficial são executados no ambiente governado do Manus antes da
publicação. O GitHub Actions executa apenas validações que não dependem de banco ou secrets de
produção.
