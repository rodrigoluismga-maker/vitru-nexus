import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  FileText,
  FolderKanban,
  Gauge,
  Search,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
const destinations = [
  { label: "Visão geral", path: "/", icon: Gauge },
  { label: "Projetos", path: "/projects", icon: FolderKanban },
  { label: "Documentos", path: "/documents", icon: FileText },
  { label: "Intelligence", path: "/intelligence", icon: Sparkles },
  { label: "Administração", path: "/admin", icon: Settings2 },
  { label: "Empresas", path: "/admin/companies", icon: Building2 },
];
export function GlobalSearch({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const projects = trpc.projects.list.useQuery(undefined, { enabled: open });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(value => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          "group flex items-center rounded-xl " +
          "border border-white/[0.07] bg-white/[0.035] " +
          "text-muted-foreground transition-all " +
          "hover:border-white/[0.14] hover:bg-white/[0.06] " +
          (compact ? "h-9 w-9 justify-center" : "h-10 min-w-64 gap-3 px-3")
        }
        aria-label="Abrir busca global"
      >
        <Search className="h-4 w-4" />
        {!compact && (
          <>
            <span className="flex-1 text-left text-sm">Buscar no Nexus</span>
            <kbd
              className={
                "rounded-md border border-white/10 bg-black/20 " +
                "px-1.5 py-0.5 text-[11px] text-content-tertiary"
              }
            >
              ⌘ K
            </kbd>
          </>
        )}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={
            "overflow-hidden border-white/10 " +
            "bg-[var(--surface-1)]/95 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-2xl"
          }
        >
          <DialogTitle className="sr-only">Busca global</DialogTitle>
          <Command className="bg-transparent">
            <CommandInput placeholder="Busque páginas, projetos ou documentos..." />
            <CommandList className="max-h-[460px]">
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup heading="Navegação">
                {destinations.map(item => (
                  <CommandItem key={item.path} onSelect={() => go(item.path)} className="gap-3">
                    <item.icon className="h-4 w-4 text-[var(--brand-violet)]" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Projetos">
                {projects.data?.map(project => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => go(`/projects/${project.id}/executive`)}
                    className="gap-3"
                  >
                    <FolderKanban className="h-4 w-4" style={{ color: project.color }} />
                    <span>{project.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{project.code}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
