import { DatabaseZap } from "lucide-react";
import type { ReactNode } from "react";
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={
        "flex min-h-48 flex-col items-center justify-center rounded-2xl border " +
        "border-dashed border-white/10 bg-white/[0.018] px-6 py-10 text-center"
      }
    >
      <span
        className={
          "flex h-11 w-11 items-center justify-center " +
          "rounded-2xl border border-white/[0.07] bg-white/[0.035]"
        }
      >
        <DatabaseZap className="h-5 w-5 text-content-tertiary" />
      </span>
      <h3 className="mt-4 text-sm font-semibold text-content-secondary">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-content-tertiary">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
