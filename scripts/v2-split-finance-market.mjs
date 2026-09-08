import fs from "node:fs";
import path from "node:path";

const directory = path.resolve("client/src/pages/finance");
const sourcePath = path.join(directory, "FinanceMarket.tsx");
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

const originalImports = source.slice(0, source.indexOf("type View")).trim();
const utilityBody = [
  between("type View", "function LoadingGrid"),
  between("type MonthlyPoint", "function TemporalChart"),
  between("type VariationSort", "function SortHeader"),
]
  .map(exportTopLevel)
  .join("\n\n");

fs.writeFileSync(
  path.join(directory, "FinanceMarketUtils.ts"),
  `import type { MarketFilters } from "./FinanceLayout";\n\n${utilityBody}\n`
);

const componentBody = [
  between("function LoadingGrid", "type MonthlyPoint"),
  between("function SortHeader", "function Overview"),
  between("function EmptyState", "function ChartTooltip"),
  between("function NarrativeCard", "export default function FinanceMarket"),
]
  .map(exportTopLevel)
  .join("\n\n");

fs.writeFileSync(
  path.join(directory, "FinanceMarketComponents.tsx"),
  `import { Skeleton } from "@/components/ui/skeleton";\nimport { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronDown, ChevronUp, CircleDashed, TrendingUp } from "lucide-react";\nimport { money, percent, type VariationSort } from "./FinanceMarketUtils";\n\n${componentBody}\n`
);

const chartBody = [
  between("function TemporalChart", "type VariationSort"),
  between("function ChartTooltip", "function NarrativeCard"),
]
  .map(exportTopLevel)
  .join("\n\n");

fs.writeFileSync(
  path.join(directory, "FinanceMarketCharts.tsx"),
  `import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";\nimport { money, scenarioLabel, type TemporalPoint } from "./FinanceMarketUtils";\n\n${chartBody}\n`
);

const sharedImports = `${originalImports}\nimport { aggregateTemporal, clean, dimensionFilterKeys, dimensionLabels, integer, money, monthNames, percent, periodLabel, scenarioLabel, type VariationSort } from "./FinanceMarketUtils";\nimport { ComparisonBridge, EmptyState, Legend, LoadingGrid, MetricCard, NarrativeCard, RelevanceBeacon, RoadmapStep, ScenarioBadge, SortHeader } from "./FinanceMarketComponents";\nimport { TemporalChart } from "./FinanceMarketCharts";`;

const views = [
  ["Overview", "function Overview", "function Variation"],
  ["Variation", "function Variation", "function Transactions"],
  ["Transactions", "function Transactions", "function ContextQuality"],
  ["ContextQuality", "function ContextQuality", "function Future"],
  ["Future", "function Future", "function EmptyState"],
];

for (const [name, start, end] of views) {
  const body = exportTopLevel(between(start, end));
  fs.writeFileSync(
    path.join(directory, `FinanceMarket${name}.tsx`),
    `${sharedImports}\n\n${body}\n`
  );
}

const entryBody = between("export default function FinanceMarket", null);
fs.writeFileSync(
  sourcePath,
  `import FinanceLayout from "./FinanceLayout";\nimport { ContextQuality } from "./FinanceMarketContextQuality";\nimport { Future } from "./FinanceMarketFuture";\nimport { Overview } from "./FinanceMarketOverview";\nimport { Transactions } from "./FinanceMarketTransactions";\nimport { Variation } from "./FinanceMarketVariation";\nimport type { View } from "./FinanceMarketUtils";\n\n${entryBody}\n`
);

console.log("FinanceMarket decomposto em 9 arquivos.");
