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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { trpc } from "@/lib/trpc";
import {
  BadgeDollarSign,
  Bell,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  FileText,
  FolderKanban,
  Gauge,
  History,
  Landmark,
  LayoutGrid,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import { CSSProperties, ReactNode } from "react";
import { useLocation } from "wouter";
import { GlobalSearch } from "./GlobalSearch";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
const mainNavigation = [
  { icon: Gauge, label: "Visão Geral", path: "/" },
  { icon: FolderKanban, label: "Projetos", path: "/projects" },
  { icon: Sparkles, label: "Intelligence", path: "/intelligence" },
  { icon: FileText, label: "Documentos", path: "/documents" },
  { icon: ChartNoAxesCombined, label: "Análises", path: "/analytics" },
  { icon: CalendarDays, label: "Agenda", path: "/agenda" },
];
const adminNavigation = [
  { icon: LayoutGrid, label: "Painel Admin", path: "/admin" },
  { icon: Building2, label: "Empresas", path: "/admin/companies" },
  { icon: Landmark, label: "Estrutura", path: "/admin/structure" },
  { icon: UsersRound, label: "Usuários", path: "/admin/users" },
  { icon: ShieldCheck, label: "Perfis", path: "/admin/roles" },
  { icon: Workflow, label: "Config. Projetos", path: "/admin/project-config" },
  { icon: Settings2, label: "Configurações", path: "/settings" },
];
const financeNavigation = [{ icon: BadgeDollarSign, label: "Gestão Financeira", path: "/finance" }];
function isRouteActive(location: string, path: string) {
  return path === "/" ? location === "/" : location === path || location.startsWith(`${path}/`);
}
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <LoginExperience />;
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "268px", "--sidebar-width-icon": "72px" } as CSSProperties}
    >
      <NexusShell>{children}</NexusShell>
    </SidebarProvider>
  );
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
function NexusShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { state } = useSidebar();
  const mobile = useIsMobile();
  const notifications = trpc.notifications.list.useQuery(
    { unreadOnly: true },
    { refetchInterval: 60000 }
  );
  const financeAccess = trpc.finance.access.useQuery(undefined, { retry: false });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => notifications.refetch(),
  });
  const collapsed = state === "collapsed";
  const canAdminister = user?.role === "admin";
  const current = [
    ...mainNavigation,
    ...(financeAccess.data?.allowed ? financeNavigation : []),
    ...(canAdminister ? adminNavigation : []),
  ].find(item => isRouteActive(location, item.path));
  const renderItems = (items: typeof mainNavigation) =>
    items.map(item => {
      const active = isRouteActive(location, item.path);
      return (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton
            tooltip={item.label}
            isActive={active}
            onClick={() => navigate(item.path)}
            className={
              "relative h-10 rounded-xl px-3 text-[13px] transition-all " +
              (active
                ? "bg-white/[0.075] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]"
                : "text-content-tertiary hover:bg-white/[0.045] hover:text-content-primary")
            }
          >
            <item.icon
              className={`h-[17px] w-[17px] ${active ? "text-[var(--brand-accent)]" : "text-content-tertiary"}`}
            />
            <span>{item.label}</span>
            {active && (
              <span
                className={
                  "absolute right-2 h-1 w-1 rounded-full " +
                  "bg-[var(--brand-accent)] shadow-[0_0_10px_var(--brand-accent)]"
                }
              />
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });
  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-white/[0.055] bg-[var(--surface-1)]/95 backdrop-blur-xl"
      >
        <SidebarHeader className="h-[82px] justify-center border-b border-white/[0.05] px-3">
          <button
            onClick={() => navigate("/")}
            aria-label="Ir para a Visão Geral"
            className={
              "flex w-full items-center gap-2.5 overflow-hidden rounded-xl " +
              "text-left focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            }
          >
            {collapsed ? (
              <div
                className={
                  "flex h-10 w-10 shrink-0 items-center justify-center " +
                  "rounded-xl border border-[var(--brand-violet)]/20 " +
                  "bg-gradient-to-br from-[var(--brand-violet-deep)]/35 " +
                  "to-[var(--brand-violet-deep)]/60 shadow-[0_10px_30px_rgba(104,36,211,.2)]"
                }
              >
                <span className="text-lg font-black text-[var(--brand-accent)]">N</span>
              </div>
            ) : (
              <>
                <div
                  className="relative h-11 w-[126px] shrink-0 overflow-hidden"
                  aria-hidden="true"
                >
                  <img
                    src="/manus-storage/vitru-logo-negativa_39bed332.webp"
                    alt=""
                    className={
                      "absolute left-1/2 top-1/2 h-auto w-[184px] " +
                      "max-w-none -translate-x-1/2 -translate-y-[47%]"
                    }
                  />
                </div>
                <span className="h-7 w-px shrink-0 bg-white/[0.08]" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold tracking-[.18em] text-white">NEXUS</div>
                  <div className="mt-1 text-[7px] uppercase tracking-[.16em] text-content-tertiary">
                    Strategy OS
                  </div>
                </div>
              </>
            )}
          </button>
        </SidebarHeader>
        <SidebarContent className="gap-3 px-2 py-4">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[.2em] text-content-tertiary">
              Portfólio
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(mainNavigation)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          {financeAccess.data?.allowed && (
            <>
              <div className="mx-3 h-px bg-white/[0.055]" />
              <SidebarGroup className="p-0">
                <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[.2em] text-content-tertiary">
                  Domínios
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(financeNavigation)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
          {canAdminister && (
            <>
              <div className="mx-3 h-px bg-white/[0.055]" />
              <SidebarGroup className="p-0">
                <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[.2em] text-content-tertiary">
                  Administração
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>{renderItems(adminNavigation)}</SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
        <SidebarFooter className="border-t border-white/[0.05] p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={
                  "flex w-full items-center gap-3 rounded-xl p-2 " +
                  "text-left transition-colors hover:bg-white/[0.05]"
                }
              >
                <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                  <AvatarFallback className="bg-[var(--brand-violet-deep)] text-xs font-bold text-[var(--brand-accent)]">
                    {user?.name?.slice(0, 2).toUpperCase() || "VN"}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-content-primary">
                      {user?.name || "Usuário Nexus"}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-content-tertiary">
                      {user?.role === "admin" ? "Administrador" : "Usuário"}
                    </p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[var(--surface-2)]">
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-300">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-0 bg-transparent">
        <header
          className={
            "sticky top-0 z-40 flex h-[72px] items-center gap-3 border-b " +
            "border-white/[0.055] bg-[var(--surface-0)]/76 px-4 backdrop-blur-2xl lg:px-6"
          }
        >
          <SidebarTrigger
            className={
              "h-9 w-9 rounded-xl border border-white/[0.07] " +
              "bg-white/[0.03] text-content-secondary"
            }
          >
            <Menu className="h-4 w-4" />
          </SidebarTrigger>
          <div className="hidden min-w-0 items-center gap-2 text-xs text-content-tertiary sm:flex">
            <span>Nexus</span>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-content-secondary">{current?.label ?? "Workspace"}</span>
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
          </div>
        </header>
        <main className="min-h-[calc(100vh-72px)]">{children}</main>
      </SidebarInset>
    </>
  );
}
