import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "violet",
  delay = 0,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone?: "violet" | "yellow" | "red" | "green" | "blue";
  delay?: number;
}) {
  const tones = {
    violet:
      "text-[var(--brand-violet)] bg-[var(--brand-violet)]/10 border-[var(--brand-violet)]/15",
    yellow:
      "text-[var(--brand-accent)] bg-[var(--brand-accent)]/10 border-[var(--brand-accent)]/15",
    red: "text-[var(--status-negative)] bg-[var(--status-negative)]/10 border-[var(--status-negative)]/15",
    green:
      "text-[var(--status-positive)] bg-[var(--status-positive)]/10 border-[var(--status-positive)]/15",
    blue: "text-[var(--status-info)] bg-[var(--status-info)]/10 border-[var(--status-info)]/15",
  };
  return (
    <article
      className="nexus-surface nexus-card-hover nexus-enter rounded-2xl p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.14em] text-content-tertiary">
            {label}
          </p>
          <p className="nexus-number mt-3 text-3xl font-bold text-white">{value}</p>
        </div>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-4 text-xs text-content-tertiary">{helper}</p>
    </article>
  );
}
