import { CircleAlert } from "lucide-react";

export function FormValidationSummary({ errors }: { errors: string[] }) {
  if (!errors.length) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-[var(--status-negative)]/15 bg-[var(--status-negative)]/[0.055] p-3"
    >
      <div className="flex gap-2">
        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-negative)]" />
        <div>
          <p className="text-xs font-semibold text-[var(--status-negative)]">
            Revise os campos obrigatórios
          </p>
          <ul className="mt-1 space-y-1 text-[11px] text-content-tertiary">
            {errors.map(error => (
              <li key={error}>• {error}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
