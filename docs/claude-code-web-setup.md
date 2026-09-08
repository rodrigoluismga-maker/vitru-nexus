# Claude Code na web — fluxo recomendado para o Vitru Nexus

## Recomendação

Para o Vitru Nexus, **Claude Code na web** é o caminho mais simples: não exige instalação local, clona
o repositório privado em uma máquina virtual isolada, cria uma branch própria e permite abrir o pull
request no GitHub para revisão.[1]

## Configuração inicial

1. Acesse [claude.ai/code](https://claude.ai/code).
2. Entre com sua conta Claude.
3. Escolha **Continue on web**.
4. Conecte sua conta GitHub quando solicitado.
5. Autorize o repositório `rodrigoluismga-maker/vitru-nexus`.
6. Use o ambiente **Default** na primeira configuração.

## Primeira tarefa

Selecione o repositório `rodrigoluismga-maker/vitru-nexus` e a branch `develop`. Use inicialmente o
modo **Plan** para que Claude apresente a estratégia antes de editar.[1]

Prompt recomendado:

```text
Leia CLAUDE.md, CONTRIBUTING.md, todo.md e a documentação da área antes de alterar qualquer arquivo.
Trabalhe em uma branch nova no padrão claude/<id>-<slug>. Não execute migrations, SQL, deploy ou
publicação. Não invente dados. Preserve Realizado, Forecast, Outlook, RBAC e contratos tRPC. Ao
terminar, execute pnpm quality e entregue resumo do diff, riscos, evidências e rollback.
```

## Entrega

Quando Claude concluir, revise o diff e use **Create PR**. O pull request deve apontar para `develop`.
Envie o link ao Manus, que revisará o código, executará a suíte completa no ambiente oficial e
publicará somente após aprovação.[1]

## Limite deliberado

Não configuramos a automação `@claude` em GitHub Actions nesta etapa. Ela exige um segredo de
autenticação específico e permissões adicionais. O fluxo web já atende à necessidade de programar
com Claude sem colocar chaves no repositório.[2]

## References

[1]: https://code.claude.com/docs/en/web-quickstart "Get started with Claude Code on the web"
[2]: https://code.claude.com/docs/en/github-actions "Claude Code GitHub Actions"
