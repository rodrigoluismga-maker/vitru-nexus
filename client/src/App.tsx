import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BarChart3, CalendarDays, FileText, Settings2, Sparkles } from "lucide-react";

const Home = lazy(() => import("./pages/Home"));
const Documents = lazy(() => import("./pages/Documents"));
const Projects = lazy(() => import("./pages/Projects"));
const Placeholder = lazy(() => import("./pages/Placeholder"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const CatalogManager = lazy(() => import("./pages/admin/CatalogManager"));
const ProjectConfig = lazy(() => import("./pages/admin/ProjectConfig"));
const Roles = lazy(() => import("./pages/admin/Roles"));
const Structure = lazy(() => import("./pages/admin/Structure"));
const Users = lazy(() => import("./pages/admin/Users"));
const ProjectWorkspace = lazy(() => import("./pages/project/ProjectWorkspace"));
const FinanceMarket = lazy(() => import("./pages/finance/FinanceMarket"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0)]">
          <div className="flex items-center gap-3 text-sm text-content-tertiary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--brand-accent)]" />
            Preparando contexto...
          </div>
        </div>
      }
    >
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/projects"} component={() => <Projects />} />
        <Route path={"/projects/:id/:section"} component={ProjectWorkspace} />
        <Route
          path={"/intelligence"}
          component={() => (
            <Placeholder
              eyebrow="Nexus Intelligence"
              title="Intelligence"
              description="Perguntas executivas, evidências e insights assistidos por IA."
              icon={Sparkles}
            />
          )}
        />
        <Route path={"/documents"} component={Documents} />
        <Route
          path={"/analytics"}
          component={() => (
            <Placeholder
              eyebrow="Análises"
              title="Análises estratégicas"
              description="Investigações, hipóteses e leituras executivas conectadas ao portfólio."
              icon={BarChart3}
            />
          )}
        />
        <Route
          path={"/agenda"}
          component={() => (
            <Placeholder
              eyebrow="Agenda"
              title="Agenda executiva"
              description="Marcos, entregas, decisões e ritos organizados no tempo."
              icon={CalendarDays}
            />
          )}
        />
        <Route path={"/finance"} component={() => <FinanceMarket view="overview" />} />
        <Route path={"/finance/variation"} component={() => <FinanceMarket view="variation" />} />
        <Route
          path={"/finance/transactions"}
          component={() => <FinanceMarket view="transactions" />}
        />
        <Route path={"/finance/context"} component={() => <FinanceMarket view="context" />} />
        <Route path={"/finance/future"} component={() => <FinanceMarket view="future" />} />
        <Route
          path={"/settings"}
          component={() => (
            <Placeholder
              eyebrow="Preferências"
              title="Configurações"
              description="Preferências pessoais, notificações e parâmetros de experiência."
              icon={Settings2}
            />
          )}
        />
        <Route path={"/admin"} component={AdminOverview} />
        <Route path={"/admin/companies"} component={() => <CatalogManager kind="companies" />} />
        <Route path={"/admin/structure"} component={Structure} />
        <Route path={"/admin/modalities"} component={() => <CatalogManager kind="modalities" />} />
        <Route path={"/admin/areas"} component={() => <CatalogManager kind="areas" />} />
        <Route path={"/admin/users"} component={Users} />
        <Route path={"/admin/roles"} component={Roles} />
        <Route path={"/admin/project-config"} component={ProjectConfig} />
        <Route path={"/admin/projects"} component={() => <Projects admin />} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
