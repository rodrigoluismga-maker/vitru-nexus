# Segurança

## Reporte responsável

Não registre vulnerabilidades com tokens, dados pessoais ou evidências sensíveis em issues públicas.
Comunique o proprietário do repositório de forma privada e preserve os logs necessários para a
investigação.

## Controles mínimos

Pull requests não podem adicionar arquivos `.env`, credenciais, URLs assinadas, dumps, planilhas
oficiais ou conteúdo de storage. Mudanças em autenticação, autorização, documentos, uploads, schema,
migrations e rotas financeiras exigem revisão explícita do CODEOWNER.

## Dependências

Atualizações de dependências devem ser isoladas em pull request próprio, com avaliação de impacto,
testes e plano de rollback. Correções automáticas não devem alterar versões maiores sem revisão.
