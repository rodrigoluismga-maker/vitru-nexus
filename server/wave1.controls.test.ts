import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

function context(): TrpcContext {
  return {
    user: {
      id: 999998,
      openId: "wave-1",
      email: "wave-1@test.local",
      name: "Wave 1",
      loginMethod: "test",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Onda 1 — controles críticos", () => {
  const caller = appRouter.createCaller(context());

  it("mantém carga ativa e catálogo de escopos derivados da fonte oficial", async () => {
    const [loads, catalog] = await Promise.all([
      caller.marketFinance.loads.list(),
      caller.marketFinance.scopes.catalog(),
    ]);
    expect(loads.some(load => load.status === "active")).toBe(true);
    expect(catalog.some(item => item.dimensionType === "market_brand" && item.code)).toBe(true);
    expect(catalog.some(item => item.dimensionType === "market_business_unit" && item.code)).toBe(
      true
    );
  });

  it("expõe retry e timestamp em todas as superfícies financeiras críticas", () => {
    const files = [
      "client/src/pages/finance/FinanceMarketOverview.tsx",
      "client/src/pages/finance/FinanceMarketVariation.tsx",
      "client/src/pages/finance/FinanceMarketTransactions.tsx",
      "client/src/pages/finance/FinanceMarketContextQuality.tsx",
    ];
    for (const file of files) expect(read(file)).toContain("QueryErrorState");
    expect(read("client/src/pages/finance/FinanceMarketComponents.tsx")).toContain(
      "Tentar novamente"
    );
  });

  it("protege o build contra debug e mantém analytics condicionado", () => {
    const vite = read("vite.config.ts");
    expect(vite).not.toContain("debug-collector");
    expect(read("client/index.html")).not.toContain("debug-collector.js");
    expect(read("client/src/main.tsx")).toContain("import.meta.env.PROD");
  });

  it("mantém ciclos de vida, radar higienizado e prontidão honesta", () => {
    expect(read("server/routers/governance.ts")).toContain("archiveLifecycle");
    expect(read("server/routers/documents.ts")).toContain("archive:");
    expect(read("server/routers/dashboard.ts")).toContain('ne(auditEvents.entityType, "auth")');
    expect(read("client/src/pages/project/expansion/ExpansionWorkspaceExecutive.tsx")).toContain(
      "aguardando dados oficiais"
    );
  });
});
