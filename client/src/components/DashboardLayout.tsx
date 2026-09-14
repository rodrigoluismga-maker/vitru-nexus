import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import { isRouteActive, NAV_PANELS, type NavPanel } from "@/nav/panels";
import { Bell, ChevronRight, LogOut, Settings2, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";
import { useLocation } from "wouter";
import { GlobalSearch } from "./GlobalSearch";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <LoginExperience />;
  return <NexusShell>{children}</NexusShell>;
}

function LoginExperience() {
  return (
    <div
      className={
        "nexus-grid nexus-glow flex min-h-screen " +
        "items-center justify-center overflow-hidden px-5"
      }
    >
      <div
        className={
          "nexus-enter relative w-full max-w-md " +
          "overflow-hidden rounded-[2rem] border border-white/10 " +
          "bg-[var(--surface-2)]/80 p-8 shadow-[0_40px_140px_rgba(0,0,0,.55)] " +
          "backdrop-blur-2xl sm:p-10"
        }
      >
        <div
          className={
            "absolute right-0 top-0 h-36 w-36 " +
            "rounded-full bg-[var(--brand-violet-deep)]/25 blur-3xl"
          }
        />
        <img
          src="/manus-storage/vitru-logo-negativa_39bed332.webp"
          alt="Vitru Educação"
          className="relative h-auto w-40 object-contain object-left"
        />
        <div
          className={
            "my-8 h-px bg-gradient-to-r from-[var(--brand-accent)]/70 " +
            "via-white/10 to-transparent"
          }
        />
        <p className="nexus-kicker">Strategic operating system</p>
        <h1 className="nexus-heading mt-3 text-4xl font-bold text-white">Vitru Nexus</h1>
        <p className="mt-4 text-sm leading-6 text-content-tertiary">
          Governança integrada para transformar estratégia em decisões, responsabilidades e
          execução.
        </p>
        <Button
          onClick={() => startLogin()}
          size="lg"
          className={
            "mt-8 h-12 w-full rounded-xl bg-[var(--brand-accent)] font-bold " +
            "text-[var(--ink-strong)] shadow-[0_12px_36px_rgba(255,194,14,.18)] " +
            "hover:bg-[var(--brand-accent-hover)]"
          }
        >
          Entrar com segurança <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <div className="mt-7 flex items-center gap-2 text-[11px] text-content-tertiary">
          <ShieldCheck className="h-3.5 w-3.5" />
          Acesso restrito e auditado
        </div>
      </div>
    </div>
  );
}

function useVisiblePanels() {
  const { user } = useAuth();
  const financeAccess = trpc.finance.access.useQuery(undefined, { retry: false });
  const canAdminister = user?.role === "admin";
  return NAV_PANELS.filter(panel => {
    if (panel.access === "finance") return Boolean(financeAccess.data?.allowed);
    if (panel.access === "admin") return canAdminister;
    return true;
  });
}

function NexusShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const mobile = useIsMobile();
  const notifications = trpc.notifications.list.useQuery(
    { unreadOnly: true },
    { refetchInterval: 60000 }
  );
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => notifications.refetch(),
  });
  const visiblePanels = useVisiblePanels();
  const activePanel =
    visiblePanels.find(panel => panel.tabs.some(tab => isRouteActive(location, tab.path))) ??
    visiblePanels[0];
  const activeTabPath =
    activePanel?.tabs.find(tab => isRouteActive(location, tab.path))?.path ??
    activePanel?.tabs[0]?.path;

  return (
    <div className="flex min-h-screen flex-col bg-transparent">
      <header
        className={
          "sticky top-0 z-40 flex h-[68px] shrink-0 items-center gap-3 border-b " +
          "border-white/[0.055] bg-[var(--surface-0)]/85 px-4 backdrop-blur-2xl lg:px-6"
        }
      >
        <button
          onClick={() => navigate("/")}
          aria-label="Ir para a Visão Geral"
          className={
            "flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:ring-2 " +
            "focus-visible:ring-[var(--brand-accent)]"
          }
        >
          <div
            className={
              "flex h-9 w-9 items-center justify-center rounded-xl border " +
              "border-[var(--brand-violet)]/20 bg-gradient-to-br " +
              "from-[var(--brand-violet-deep)]/45 to-[var(--brand-violet-deep)]/75"
            }
          >
            <span className="text-sm font-black text-[var(--brand-accent)]">N</span>
          </div>
          <span className="hidden text-[11px] font-bold tracking-[.18em] text-white sm:inline">
            NEXUS
          </span>
        </button>
        <span className="hidden h-6 w-px shrink-0 bg-white/[0.08] sm:inline" />
        <div className="hidden min-w-0 items-center gap-2 text-xs text-content-tertiary sm:flex">
          <span className="truncate text-content-secondary">{activePanel?.label ?? "Nexus"}</span>
          {activeTabPath && (
            <>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {activePanel?.tabs.find(t => t.path === activeTabPath)?.label}
              </span>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GlobalSearch compact={mobile} />
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={
                  "relative flex h-9 w-9 items-center justify-center rounded-xl border " +
                  "border-white/[0.07] bg-white/[0.03] " +
                  "text-content-tertiary transition-colors hover:text-white"
                }
                aria-label="Notificações"
              >
                <Bell className="h-4 w-4" />
                {Boolean(notifications.data?.length) && (
                  <span
                    className={
                      "absolute right-2 top-2 h-1.5 w-1.5 rounded-full " +
                      "bg-[var(--brand-accent)] shadow-[0_0_10px_var(--brand-accent)]"
                    }
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[340px] border-white/10 bg-[var(--surface-2)]/96 p-0 backdrop-blur-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.07] p-4">
                <div>
                  <p className="text-sm font-semibold">Notificações</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {notifications.data?.length ?? 0} não lidas
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllRead.mutate()}
                  disabled={!notifications.data?.length}
                >
                  Marcar como lidas
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {notifications.data?.length ? (
                  notifications.data.map(note => (
                    <div key={note.id} className="rounded-xl p-3 hover:bg-white/[0.04]">
                      <div className="flex items-start gap-3">
                        <span
                          className={
                            "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " +
                            (note.severity === "critical"
                              ? "bg-red-400"
                              : note.severity === "attention"
                                ? "bg-[var(--brand-accent)]"
                                : "bg-[var(--brand-violet)]")
                          }
                        />
                        <div>
                          <p className="text-xs font-semibold">{note.title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-content-tertiary">
                            {note.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-content-tertiary">
                    Nenhuma pendência nova.
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <span
            className={
              "hidden rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] " +
              "px-2.5 py-1 text-[11px] font-semibold text-emerald-300 md:inline-flex"
            }
          >
            Sistema operacional
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                  "border border-white/[0.07] transition-colors hover:bg-white/[0.05]"
                }
                aria-label="Minha conta"
              >
                <Avatar className="h-7 w-7 border border-white/10">
                  <AvatarFallback className="bg-[var(--brand-violet-deep)] text-[10px] font-bold text-[var(--brand-accent)]">
                    {user?.name?.slice(0, 2).toUpperCase() || "VN"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[var(--surface-2)]">
              <DropdownMenuLabel>
                <p className="truncate text-xs font-semibold text-content-primary">
                  {user?.name || "Usuário Nexus"}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-normal text-content-tertiary">
                  {user?.role === "admin" ? "Administrador" : "Usuário"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings2 className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="flex flex-1 flex-col lg:flex-row">
        <PanelSubnav
          panel={activePanel}
          activePath={activeTabPath}
          location={location}
          navigate={navigate}
        />
        <main className="min-h-[calc(100vh-68px)] min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
        <PanelRail panels={visiblePanels} activePanelId={activePanel?.id} navigate={navigate} />
      </div>
    </div>
  );
}

function PanelRail({
  panels,
  activePanelId,
  navigate,
}: {
  panels: NavPanel[];
  activePanelId?: string;
  navigate: (path: string) => void;
}) {
  return (
    <nav
      aria-label="Painéis"
      className={
        "fixed inset-x-0 bottom-0 z-40 flex h-16 w-full shrink-0 items-center " +
        "justify-around border-t border-white/[0.055] bg-[var(--surface-1)]/97 " +
        "px-1 backdrop-blur-xl lg:static lg:h-auto lg:w-[76px] lg:flex-col " +
        "lg:justify-start lg:gap-1 lg:border-l lg:border-t-0 lg:py-4"
      }
    >
      {panels.map(panel => {
        const active = panel.id === activePanelId;
        return (
          <button
            key={panel.id}
            onClick={() => navigate(panel.tabs[0].path)}
            aria-current={active}
            className={
              "group relative flex h-12 w-16 flex-col items-center justify-center gap-1 " +
              "rounded-xl border border-transparent text-content-tertiary transition-all lg:h-[54px] lg:w-[58px] " +
              (active
                ? "border-[var(--brand-accent)]/20 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                : "hover:bg-white/[0.045] hover:text-content-primary")
            }
          >
            <panel.icon className="h-[18px] w-[18px]" />
            <span className="text-[9.5px] font-semibold leading-none">{panel.label}</span>
            {active && (
              <span
                className={
                  "absolute left-1/2 top-0 h-[3px] w-6 -translate-x-1/2 rounded-full " +
                  "bg-[var(--brand-accent)] lg:left-0 lg:top-1/2 lg:h-6 lg:w-[3px] " +
                  "lg:-translate-x-0 lg:-translate-y-1/2"
                }
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function PanelSubnav({
  panel,
  activePath,
  location,
  navigate,
}: {
  panel?: NavPanel;
  activePath?: string;
  location: string;
  navigate: (path: string) => void;
}) {
  if (!panel) return null;
  return (
    <aside
      className={
        "shrink-0 border-b border-white/[0.055] bg-[var(--surface-1)]/60 px-4 py-3 " +
        "lg:w-[248px] lg:border-b-0 lg:border-r lg:px-4 lg:py-6"
      }
    >
      <p className="hidden text-[11px] font-bold uppercase tracking-[.2em] text-content-tertiary lg:block">
        Painel
      </p>
      <h2 className="hidden text-xl font-bold text-white lg:mt-1.5 lg:block">{panel.label}</h2>
      <div className="flex gap-1.5 overflow-x-auto lg:mt-5 lg:flex-col lg:gap-1 lg:overflow-visible">
        {panel.tabs.map(tab => {
          const active = tab.path === activePath || isRouteActive(location, tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={active}
              className={
                "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 " +
                "text-[13px] font-semibold transition-all lg:whitespace-normal " +
                (active
                  ? "bg-white/[0.075] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]"
                  : "text-content-tertiary hover:bg-white/[0.045] hover:text-content-primary")
              }
            >
              <tab.icon
                className={`h-4 w-4 shrink-0 ${active ? "text-[var(--brand-accent)]" : "text-content-tertiary"}`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
