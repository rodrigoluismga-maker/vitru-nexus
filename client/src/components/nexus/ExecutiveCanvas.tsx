import { Maximize2 } from "lucide-react";
import type { ReactNode } from "react";
export function ExecutiveCanvas({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  accent = "var(--brand-accent)",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: string;
  accent?: string;
}) {
  return (
    <div
      className={
        "group relative overflow-hidden rounded-[1.35rem] border " +
        "border-white/[0.08] bg-[var(--surface-0)] " +
        "shadow-[0_30px_100px_rgba(0,0,0,.32)]"
      }
    >
      <div
        className={
          "aspect-auto min-h-[560px] w-full " +
          "bg-[radial-gradient(circle_at_85%_5%,rgba(104,36,211,.24),transparent_35%)," +
          "linear-gradient(145deg,var(--surface-1)_0%,var(--surface-0)_58%," +
          "var(--surface-0)_100%)] " +
          "p-[clamp(1.35rem,3vw,3rem)] sm:min-h-[600px] lg:aspect-video lg:min-h-[360px]"
        }
      >
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-6">
            <div className="max-w-[76%]">
              <p
                className="text-[clamp(.5rem,.8vw,.7rem)] font-bold uppercase tracking-[.2em]"
                style={{ color: accent }}
              >
                {eyebrow}
              </p>
              <h2
                className={
                  "mt-2 text-[clamp(1.35rem,2.6vw,2.65rem)] " +
                  "font-bold leading-[1.05] tracking-[-.035em] text-white"
                }
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  className={
                    "mt-2 max-w-3xl text-[clamp(.65rem,1vw,.9rem)] " +
                    "leading-relaxed text-content-tertiary"
                  }
                >
                  {subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-bold tracking-[.18em] text-content-secondary">
                  NEXUS
                </p>
                <p className="mt-1 text-[7px] uppercase tracking-[.16em] text-content-tertiary">
                  Vitru Strategy
                </p>
              </div>
              <span
                className={
                  "flex h-9 w-9 items-center justify-center " +
                  "rounded-xl border border-white/[0.08] bg-white/[0.035]"
                }
              >
                <Maximize2 className="h-3.5 w-3.5 text-content-tertiary" />
              </span>
            </div>
          </header>
          <div
            className={
              "my-[clamp(1rem,2vw,2rem)] h-px bg-gradient-to-r " +
              "from-transparent via-white/[0.1] to-transparent"
            }
          />
          <div className="min-h-0 flex-1">{children}</div>
          <footer
            className={
              "mt-auto flex items-center justify-between " +
              "gap-4 border-t border-white/[0.06] pt-3 " +
              "text-[clamp(.45rem,.65vw,.6rem)] " +
              "uppercase tracking-[.14em] text-content-tertiary"
            }
          >
            <span>{footer ?? "Vitru Nexus · Governança estratégica"}</span>
            <span>16:9 · 1920 × 1080</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
