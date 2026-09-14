# Claude Code + GitHub no Windows — Vitru Nexus

## Caminho recomendado

Para o Vitru Nexus, o fluxo mais simples e seguro é usar **GitHub Desktop** para clonar e gerenciar
branches, e o **Claude Desktop — aba Code** para programar na pasta local. O Claude Code também pode
ser iniciado pelo terminal com o comando `claude`.[1]

> Pasta local recomendada: `C:\Dev\vitru-nexus`. Evite desenvolver dentro do OneDrive, porque
> `node_modules`, builds e alterações frequentes geram sincronização desnecessária.

## 1. Clonar o repositório

No GitHub Desktop, acesse **File → Clone repository → URL** e informe:

```text
https://github.com/rodrigoluismga-maker/vitru-nexus.git
```

Use como destino:

```text
C:\Dev\vitru-nexus
```

Depois do clone, confirme que a branch atual é `main` e que o arquivo `CLAUDE.md` aparece na raiz.

## 2. Criar a branch de homologação

No GitHub Desktop, selecione **Current branch → New branch**.

| Campo | Valor     |
| ----- | --------- |
| Nome  | `develop` |
| Base  | `main`    |

Clique em **Publish branch**. Claude não deve trabalhar diretamente em `main` ou `develop`.

## 3. Instalar e abrir o Claude Code

O instalador nativo recomendado pela Anthropic para Windows pode ser executado no PowerShell:[1]

```powershell
irm https://claude.ai/install.ps1 | iex
```

Alternativamente, instale pelo WinGet:[1]

```powershell
winget install Anthropic.ClaudeCode
```

Valide a instalação:

```powershell
claude --version
claude doctor
```

Na primeira execução de `claude`, conclua o login no navegador. A Anthropic informa que Claude Code
requer uma conta compatível com o produto.[1]

## 4. Abrir o projeto no Claude

No PowerShell:

```powershell
cd C:\Dev\vitru-nexus
git switch develop
git pull
claude
```

Se estiver usando Claude Desktop, abra a aba **Code** e selecione `C:\Dev\vitru-nexus`.

## 5. Iniciar cada tarefa

Antes de escrever código, crie uma branch nova a partir de `develop`:

```powershell
git switch develop
git pull
git switch -c claude/123-descricao-curta
```

Use este prompt inicial no Claude:

```text
Leia CLAUDE.md, CONTRIBUTING.md, todo.md e a documentação da área antes de alterar qualquer arquivo.
Trabalhe somente nesta branch. Não execute migrations, SQL, deploy ou publicação. Não invente dados.
Ao terminar, execute pnpm quality e entregue resumo do diff, riscos, evidências e rollback.
```

## 6. Entregar para revisão

Claude pode preparar o commit, mas o usuário deve revisar o diff antes do push. Depois:

```powershell
git status
git diff --check
git push -u origin HEAD
gh pr create --base develop --fill
```

O GitHub CLI pode ser autenticado com `gh auth login`; quando HTTPS é escolhido, ele também pode
configurar as credenciais usadas por `git push` e `git pull`.[2]

Envie o link do pull request ao Manus. O Manus revisará o código, executará testes completos no
ambiente oficial, reconciliará os dados e publicará somente após aprovação.

## 7. O que não fazer

Não trabalhar diretamente em `main`. Não colocar `.env`, tokens, planilhas oficiais ou dumps no Git.
Não permitir que Claude execute SQL, migrations ou publicação. Não copiar a pasta `node_modules` para
o OneDrive. Não aceitar alterações de Realizado, Forecast, Outlook, sinal financeiro ou RBAC sem uma
revisão separada.

## References

[1]: https://code.claude.com/docs/en/setup "Claude Code — Advanced setup"
[2]: https://docs.github.com/github-cli/github-cli/quickstart "GitHub CLI quickstart"
