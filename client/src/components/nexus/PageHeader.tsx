import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="nexus-enter flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span
              className={
                "flex h-8 w-8 items-center justify-center rounded-lg border " +
                "border-[var(--brand-violet)]/15 bg-[var(--brand-violet-deep)]/10"
              }
            >
              <Icon className="h-4 w-4 text-[var(--brand-violet)]" />
            </span>
          )}
          <p className="nexus-kicker">{eyebrow}</p>
        </div>
        <h1 className="nexus-heading mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h1>
        {description && (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-content-tertiary">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
