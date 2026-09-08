import type { TrpcContext } from "../server/_core/context";
import { appRouter } from "../server/routers";

const filters = {
  brands: [],
  businessUnits: [],
  modalities: [],
  products: [],
  categories: [],
  accounts: [],
  costCenters: [],
  months: [],
  entryTypes: [],
};

const context: TrpcContext = {
  user: {
    id: 999997,
    openId: "audit-performance",
    email: "audit-performance@test.local",
    name: "Audit Performance",
    loginMethod: "test",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
};

const caller = appRouter.createCaller(context);

async function measure<T>(name: string, operation: () => Promise<T>) {
  const startedAt = performance.now();
  const result = await operation();
  return { name, milliseconds: Number((performance.now() - startedAt).toFixed(1)), result };
}

const results = [];
results.push(await measure("marketFinance.context", () => caller.marketFinance.context()));
results.push(
  await measure("marketFinance.overview.actual", () =>
    caller.marketFinance.overview({ filters, compositionBy: "brand" })
  )
);
results.push(
  await measure("marketFinance.overview.outlook", () =>
    caller.marketFinance.overview({
      filters,
      compositionBy: "brand",
      analysis: { scenarioMode: "outlook", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    })
  )
);
results.push(
  await measure("marketFinance.variation.brand", () =>
    caller.marketFinance.variation({ filters, by: "brand" })
  )
);
results.push(
  await measure("marketFinance.transactions", () =>
    caller.marketFinance.transactions({
      filters,
      scenario: "actual",
      year: 2026,
      search: "",
      page: 1,
      pageSize: 50,
    })
  )
);
results.push(await measure("marketFinance.quality", () => caller.marketFinance.quality()));
results.push(await measure("dashboard.summary", () => caller.dashboard.summary()));

console.log(
  JSON.stringify(
    results.map(item => ({
      name: item.name,
      milliseconds: item.milliseconds,
      payloadBytes: Buffer.byteLength(JSON.stringify(item.result), "utf8"),
    })),
    null,
    2
  )
);

process.exit(0);
