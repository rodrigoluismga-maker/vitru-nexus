import fs from "node:fs";
import path from "node:path";

const directory = path.resolve("client/src/pages/project/expansion");
const sourcePath = path.join(directory, "ExpansionWorkspace.tsx");
const source = fs.readFileSync(sourcePath, "utf8");

function between(start, end) {
  const from = source.indexOf(start);
  const to = end ? source.indexOf(end, from) : source.length;
  if (from < 0 || to < 0) throw new Error(`Marcador não encontrado: ${start} -> ${end}`);
  return source.slice(from, to).trim();
}

function exportTopLevel(value) {
  return value
    .replace(/^type /gm, "export type ")
    .replace(/^const /gm, "export const ")
    .replace(/^function /gm, "export function ");
}

const imports = source.slice(0, source.indexOf("type SectionKey")).trim();
const utilities = [
  between("type SectionKey", "export function ExpansionWorkspace"),
  between("type RouterOutputs", null),
]
  .map(exportTopLevel)
  .join("\n\n");

fs.writeFileSync(
  path.join(directory, "ExpansionWorkspaceUtils.ts"),
  `import type { inferRouterOutputs } from "@trpc/server";\nimport type { AppRouter } from "../../../../../server/routers";\n\n${utilities}\n`
);

const shared = `import { Activity, BarChart3, BookOpenCheck, Building2, CalendarRange, ChartNoAxesCombined, CircleDollarSign, ClipboardCheck, Compass, FileChartColumn, FileSearch, FileText, Flag, Gauge, GraduationCap, History, Landmark, Lightbulb, MapPin, Megaphone, Scale, ShieldAlert, Target, TrendingUp, UserRoundCog, UsersRound } from "lucide-react";\nimport { Button } from "@/components/ui/button";\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { EmptyState } from "@/components/nexus/EmptyState";\nimport { ExecutiveCanvas } from "@/components/nexus/ExecutiveCanvas";\nimport { MetricCard } from "@/components/nexus/MetricCard";\nimport { StatusBadge } from "@/components/nexus/StatusBadge";\nimport { Section } from "../WorkspaceIndicators";\nimport { ExpansionCreateDialog } from "./ExpansionCreateDialog";\nimport { formatDate, formatMetric, money, numberOrNull, offerStatusLabel, readinessLabel, scenarioLabel, stageLabel, sumNullable, unique, uniqueObjects, type CommonProps, type Context, type Enriched, type ExpansionData, type Governance, type Person, type Project } from "./ExpansionWorkspaceUtils";`;

const components = exportTopLevel(between("function PersonCard", "type RouterOutputs"));
fs.writeFileSync(
  path.join(directory, "ExpansionWorkspaceComponents.tsx"),
  `${shared}\n\n${components}\n`
);

const panels = exportTopLevel(between("function ScenarioPanel", "function PersonCard"));
fs.writeFileSync(
  path.join(directory, "ExpansionWorkspacePanels.tsx"),
  `${shared}\nimport { CompactRow, Mini, StatusPill } from "./ExpansionWorkspaceComponents";\n\n${panels}\n`
);

const viewImports = `${shared}\nimport { CanvasBlock, CityRow, FilterBar, Mini, PersonCard, ResultsMetrics, SimpleMetric } from "./ExpansionWorkspaceComponents";\nimport { LaunchPhases, MediaPanel, OffersPanel, SalesPanel, ScenarioCard, ScenarioPanel } from "./ExpansionWorkspacePanels";`;
const viewGroups = [
  ["Executive", "function ExecutiveView", "function IndicatorsView"],
  ["Performance", "function IndicatorsView", "function AnalysesView"],
  ["Governance", "function AnalysesView", "function ScenarioPanel"],
];
for (const [name, start, end] of viewGroups) {
  fs.writeFileSync(
    path.join(directory, `ExpansionWorkspace${name}.tsx`),
    `${viewImports}\n\n${exportTopLevel(between(start, end))}\n`
  );
}

const main = between("export function ExpansionWorkspace", "function ExecutiveView");
fs.writeFileSync(
  sourcePath,
  `${imports}\nimport { ExecutiveView, ExpansionDashboard } from "./ExpansionWorkspaceExecutive";\nimport { IndicatorsView, ReportsView, ResultsView } from "./ExpansionWorkspacePerformance";\nimport { AnalysesView, HistoryView, OwnersView } from "./ExpansionWorkspaceGovernance";\nimport { LaunchPhases } from "./ExpansionWorkspacePanels";\nimport type { SectionKey } from "./ExpansionWorkspaceUtils";\n\n${main}\n`
);

console.log("ExpansionWorkspace decomposto em 7 arquivos.");
