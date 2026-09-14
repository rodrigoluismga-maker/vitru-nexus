export type ChangelogArea =
  | "governanca"
  | "seguranca"
  | "financeiro"
  | "produto"
  | "infraestrutura";

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  area: ChangelogArea;
  highlights: string[];
  reference?: string;
}

export interface LegacyCheckpoint {
  hash: string;
  summary: string;
}

/**
 * Entradas com data e evidência confirmadas (commits/PRs reais neste repositório).
 * Cada entrega real deve ser adicionada aqui pelo agente que a implementou, na mesma
 * mudança que a introduz.
 */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: "2026-09-14-github-sync",
    date: "2026-09-14",
    title: "Sincronização GitHub e governança de pull requests",
    summary:
      "Concluído o fluxo Claude Code → GitHub → revisão que estava pendente desde a primeira importação do projeto.",
    area: "governanca",
    highlights: [
      "Workflow de CI (lint, tipos, testes e build) validando cada pull request para develop e main",
      "Template de pull request com checklist de conformidade obrigatório",
      ".gitignore bloqueando planilhas, dumps e backups oficiais",
      "Branches main e develop protegidas contra push direto e exclusão",
    ],
    reference: "PR #1",
  },
];

/**
 * Checkpoints anteriores à sincronização GitHub, registrados na memória do projeto (Manus).
 * As datas exatas de cada checkpoint não foram registradas nessa fonte — por isso não são
 * exibidas aqui, em vez de serem inventadas.
 */
export const LEGACY_MANUS_CHECKPOINTS: LegacyCheckpoint[] = [
  { hash: "0578296d", summary: "Governança inicial GitHub/Claude" },
  { hash: "67c6f247", summary: "Testes de filtros reais, correções e 76 testes" },
  { hash: "dd49b1d8", summary: "Cirurgia da primeira tela financeira" },
  { hash: "8b527bb3", summary: "Onda 1 corretiva dos nove P1" },
  { hash: "7f8d0564", summary: "Auditoria 360º independente" },
  { hash: "2f4346fa", summary: "V2 estrutural, acessibilidade, tokens e decomposição" },
  { hash: "0b557434", summary: "Filtros avançados, cenários, períodos e novos visuais" },
  { hash: "6cd1c975", summary: "Evolução da comparação Real Jan–Jul/25 × Jan–Jul/26" },
  { hash: "77f3e5cb", summary: "V1 do Financeiro de Mercado com fonte oficial" },
  { hash: "2de256ab", summary: "Hardening Onda 0" },
  { hash: "4f850cb3", summary: "Auditoria de segurança e Blueprint de hardening" },
  { hash: "d567c30e", summary: "Fechamento funcional do módulo financeiro e Central de Dados" },
  { hash: "9b70d9e5", summary: "Domínio autônomo de Gestão Financeira implementado" },
  { hash: "a7254a18", summary: "Convites Microsoft 365 preparados, resilientes e auditáveis" },
  { hash: "60074019", summary: "Hotfix do diretório de usuários e fluxo de cadastro" },
];
