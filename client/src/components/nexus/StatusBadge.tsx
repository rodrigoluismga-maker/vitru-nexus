const labels: Record<string, string> = {
  healthy: "Saudável",
  attention: "Atenção",
  critical: "Crítico",
  unassessed: "Não avaliado",
  planned: "Planejado",
  in_progress: "Em andamento",
  at_risk: "Em risco",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
  active: "Ativo",
  inactive: "Inativo",
  invited: "Convidado",
  blocked: "Bloqueado",
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  deferred: "Postergada",
  open: "Aberto",
  mitigating: "Em mitigação",
  closed: "Encerrado",
};
const tones: Record<string, string> = {
  healthy: "text-emerald-300 bg-emerald-400/[0.08] border-emerald-400/15",
  completed: "text-emerald-300 bg-emerald-400/[0.08] border-emerald-400/15",
  active: "text-emerald-300 bg-emerald-400/[0.08] border-emerald-400/15",
  approved: "text-emerald-300 bg-emerald-400/[0.08] border-emerald-400/15",
  attention:
    "text-[var(--brand-accent-soft)] " +
    "bg-[var(--brand-accent)]/[0.08] border-[var(--brand-accent)]/15",
  pending:
    "text-[var(--brand-accent-soft)] " +
    "bg-[var(--brand-accent)]/[0.08] border-[var(--brand-accent)]/15",
  critical: "text-red-300 bg-red-400/[0.08] border-red-400/15",
  at_risk: "text-red-300 bg-red-400/[0.08] border-red-400/15",
  blocked: "text-red-300 bg-red-400/[0.08] border-red-400/15",
  rejected: "text-red-300 bg-red-400/[0.08] border-red-400/15",
  in_progress: "text-blue-300 bg-blue-400/[0.08] border-blue-400/15",
  planned:
    "text-[var(--brand-violet-soft)] " +
    "bg-[var(--brand-violet)]/[0.08] border-[var(--brand-violet)]/15",
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full " +
        "border px-2.5 py-1 text-[11px] font-semibold " +
        (tones[status] ?? "border-white/10 bg-white/[0.04] text-content-tertiary")
      }
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label ?? labels[status] ?? status}
    </span>
  );
}
