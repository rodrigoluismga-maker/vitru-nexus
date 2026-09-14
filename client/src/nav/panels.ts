import {
  BadgeDollarSign,
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  Compass,
  FileText,
  FolderKanban,
  Gauge,
  History,
  KeyRound,
  Landmark,
  Sparkles,
  Tag,
  UsersRound,
  Building2,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavTab {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavPanel {
  id: string;
  label: string;
  icon: LucideIcon;
  /** When set, the panel is only visible to users cleared for that domain. */
  access?: "finance" | "admin";
  tabs: NavTab[];
}

/**
 * Fonte única da navegação do Nexus: painel macro + abas internas.
 * Adicionar um painel ou uma aba é editar esta lista — nada mais precisa mudar.
 */
export const NAV_PANELS: NavPanel[] = [
  {
    id: "strategic",
    label: "Estratégico",
    icon: Compass,
    tabs: [
      { label: "Visão Geral", path: "/", icon: Gauge },
      { label: "Documentos", path: "/documents", icon: FileText },
      { label: "Análises", path: "/analytics", icon: ChartNoAxesCombined },
      { label: "Agenda", path: "/agenda", icon: CalendarDays },
      { label: "Novidades", path: "/changelog", icon: History },
    ],
  },
  {
    id: "projects",
    label: "Projetos",
    icon: FolderKanban,
    tabs: [{ label: "Portfólio", path: "/projects", icon: FolderKanban }],
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: BadgeDollarSign,
    access: "finance",
    tabs: [{ label: "Financeiro de Mercado", path: "/finance", icon: BadgeDollarSign }],
  },
  {
    id: "intelligence",
    label: "Inteligência",
    icon: Sparkles,
    tabs: [{ label: "Perguntas", path: "/intelligence", icon: Sparkles }],
  },
  {
    id: "pricing",
    label: "Pricing",
    icon: Tag,
    tabs: [{ label: "A definir", path: "/pricing", icon: Tag }],
  },
  {
    id: "catalog",
    label: "Cadastros",
    icon: Boxes,
    access: "admin",
    tabs: [
      { label: "Visão", path: "/admin", icon: Boxes },
      { label: "Empresas", path: "/admin/companies", icon: Building2 },
      { label: "Modalidades", path: "/admin/modalities", icon: Landmark },
      { label: "Áreas", path: "/admin/areas", icon: Landmark },
      { label: "Config. Projetos", path: "/admin/project-config", icon: Workflow },
    ],
  },
  {
    id: "management",
    label: "Gestão",
    icon: KeyRound,
    access: "admin",
    tabs: [
      { label: "Usuários", path: "/admin/users", icon: UsersRound },
      { label: "Perfis e acessos", path: "/admin/roles", icon: ShieldCheck },
    ],
  },
];

export function isRouteActive(location: string, path: string) {
  return path === "/" ? location === "/" : location === path || location.startsWith(`${path}/`);
}
