import { and, eq, inArray } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  areas,
  auditEvents,
  companies,
  decisions,
  financeActualEntries,
  financeAllocationDestinations,
  financeAllocationEntries,
  financeAllocationRules,
  financeAllocationRuns,
  financeBatchApprovals,
  financeCycles,
  financeDimensions,
  financeImportBatches,
  financeImportErrors,
  financeImportStagingRows,
  financeMappingRules,
  projects,
  users,
} from "../drizzle/schema";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { appRouter } from "./routers";

describe.sequential("finance allocation import integration", () => {
  it("persists rules, destinations, runs and entries when an allocation batch is approved", async () => {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_URL is required for this integration test");
    const [admin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
    const [company] = await db
      .select({ id: companies.id, code: companies.acronym })
      .from(companies)
      .limit(1);
    const [area] = await db.select({ id: areas.id, code: areas.name }).from(areas).limit(1);
    const [linkedProject] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.name, "Planejamento Orçamentário 2027"))
      .limit(1);
    if (!admin || !company || !area || !linkedProject)
      throw new Error("Base administrativa incompleta para o teste financeiro");
    const context: TrpcContext = {
      user: admin,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(context);
    const token = Date.now().toString(36).toUpperCase();
    const occupiedYears = new Set(
      (await db.select({ fiscalYear: financeCycles.fiscalYear }).from(financeCycles)).map(
        item => item.fiscalYear
      )
    );
    const fiscalYear = Array.from({ length: 1_000 }, (_, index) => 9_999 - index).find(
      value => !occupiedYears.has(value)
    );
    if (!fiscalYear)
      throw new Error("No free fiscal year available for the finance integration test");
    const period = `${fiscalYear}-01`;
    let cycleId: number | undefined;
    let actualBatchId: number | undefined;
    let allocationBatchId: number | undefined;
    let duplicateBatchId: number | undefined;
    let replacementBatchId: number | undefined;
    let replacementActualId: number | undefined;
    let actualId: number | undefined;
    let ruleId: number | undefined;
    let runId: number | undefined;
    let decisionId: number | undefined;
    const dimensionIds: number[] = [];
    try {
      const [cycle] = await db
        .insert(financeCycles)
        .values({
          fiscalYear,
          code: `TEST-${token}`,
          name: `Teste Financeiro ${token}`,
          startPeriod: period,
          endPeriod: `${fiscalYear}-12`,
          status: "open",
          currency: "BRL",
          linkedProjectId: linkedProject.id,
          createdBy: admin.id,
        })
        .$returningId();
      cycleId = cycle.id;
      const [decision] = await db
        .insert(decisions)
        .values({
          projectId: linkedProject.id,
          title: `Decisão financeira ${token}`,
          status: "pending",
          ownerId: admin.id,
          createdBy: admin.id,
        })
        .$returningId();
      decisionId = decision.id;
      for (const [dimensionType, code] of [
        ["cost_center", "CC"],
        ["management_account", "MG"],
        ["nature", "NAT"],
        ["area", "DEST"],
      ] as const) {
        const [dimension] = await db
          .insert(financeDimensions)
          .values({
            dimensionType,
            code: `${code}-${token}`,
            name: `${code} ${token}`,
            status: "active",
            createdBy: admin.id,
          })
          .$returningId();
        dimensionIds.push(dimension.id);
      }
      const [actualBatch] = await db
        .insert(financeImportBatches)
        .values({
          cycleId,
          loadType: "actual",
          mode: "append",
          status: "committed",
          sourceSystem: "integration-test",
          fileName: `${token}-actual.csv`,
          fileKey: `test/${token}-actual.csv`,
          fileUrl: `https://example.invalid/${token}-actual.csv`,
          fileHash: `${token.padEnd(64, "0").slice(0, 64)}`,
          fileSize: 1,
          rowCount: 1,
          acceptedCount: 1,
          totalAmount: "100.00",
          createdBy: admin.id,
          approvedBy: admin.id,
          approvedAt: new Date(),
          committedAt: new Date(),
        })
        .$returningId();
      actualBatchId = actualBatch.id;
      const sourceRecordId = `SRC-${token}`;
      const [actual] = await db
        .insert(financeActualEntries)
        .values({
          cycleId,
          batchId: actualBatchId,
          sourceRecordId,
          businessKeyHash: `${token.padEnd(64, "1").slice(0, 64)}`,
          fiscalYear,
          period,
          currency: "BRL",
          companyId: company.id,
          areaId: area.id,
          ownerUserId: admin.id,
          costCenterId: dimensionIds[0],
          managementAccountId: dimensionIds[1],
          natureId: dimensionIds[2],
          ownershipType: "HOUSE",
          actualAmount: "100.00",
          isActive: true,
        })
        .$returningId();
      actualId = actual.id;
      const [allocationBatch] = await db
        .insert(financeImportBatches)
        .values({
          cycleId,
          loadType: "allocation",
          mode: "append",
          status: "approval_pending",
          sourceSystem: "integration-test",
          fileName: `${token}-allocation.csv`,
          fileKey: `test/${token}-allocation.csv`,
          fileUrl: `https://example.invalid/${token}-allocation.csv`,
          fileHash: `${token.padEnd(64, "2").slice(0, 64)}`,
          fileSize: 1,
          rowCount: 1,
          acceptedCount: 1,
          totalAmount: "100.00",
          createdBy: admin.id,
        })
        .$returningId();
      allocationBatchId = allocationBatch.id;
      const destinationAlias = `ALIAS-${token}`;
      await db.insert(financeMappingRules).values({
        sourceSystem: "integration-test",
        dimensionType: "area",
        sourceValue: destinationAlias,
        targetDimensionId: dimensionIds[3],
        status: "active",
        createdBy: admin.id,
      });
      const rawData = {
        rule_code: `RATEIO-${token}`,
        allocation_type: "house",
        period,
        source_fact_type: "actual",
        source_record_id: sourceRecordId,
        source_amount: 100,
        destination_type: "area",
        destination_code: destinationAlias,
        allocation_percent: 1,
        allocated_amount: 100,
      };
      await db.insert(financeImportStagingRows).values({
        batchId: allocationBatchId,
        rowNumber: 2,
        rawData,
        normalizedData: rawData,
        sourceRecordId,
        businessKeyHash: `${token.padEnd(64, "3").slice(0, 64)}`,
        amount: "100.00",
        status: "accepted",
      });
      await caller.finance.imports.approve({ batchId: allocationBatchId });
      const [rule] = await db
        .select()
        .from(financeAllocationRules)
        .where(
          and(
            eq(financeAllocationRules.cycleId, cycleId),
            eq(financeAllocationRules.code, `RATEIO-${token}`)
          )
        )
        .limit(1);
      ruleId = rule?.id;
      const [run] = await db
        .select()
        .from(financeAllocationRuns)
        .where(eq(financeAllocationRuns.batchId, allocationBatchId))
        .limit(1);
      runId = run?.id;
      const destinations = ruleId
        ? await db
            .select()
            .from(financeAllocationDestinations)
            .where(eq(financeAllocationDestinations.ruleId, ruleId))
        : [];
      const entries = runId
        ? await db
            .select()
            .from(financeAllocationEntries)
            .where(eq(financeAllocationEntries.runId, runId))
        : [];
      expect(rule).toMatchObject({ criteriaType: "fixed_percent", sourceDimensionType: "actual" });
      expect(destinations).toHaveLength(1);
      expect(run).toMatchObject({
        period,
        status: "committed",
        sourceAmount: "100.00",
        allocatedAmount: "100.00",
        differenceAmount: "0.00",
      });
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        sourceFactType: "actual",
        sourceFactId: actualId,
        destinationDimensionId: dimensionIds[3],
        allocationPercent: "1.000000",
        allocatedAmount: "100.00",
      });
      const cockpit = await caller.finance.cockpit({ cycleId, compositionDimension: "company" });
      expect(cockpit.composition).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ dimensionId: company.id, amount: 100, share: 1 }),
        ])
      );
      expect(cockpit.decisions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: decisionId, title: `Decisão financeira ${token}` }),
        ])
      );
      expect(cockpit.alerts.map(item => item.code)).toEqual(
        expect.arrayContaining(["VERSION_BUDGET_MISSING", "VERSION_FORECAST_MISSING"])
      );
      const ownerComposition = await caller.finance.cockpit({
        cycleId,
        compositionDimension: "owner",
      });
      expect(ownerComposition.composition).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ dimensionId: admin.id, amount: 100, share: 1 }),
        ])
      );
      const actualRow = {
        source_record_id: sourceRecordId,
        fiscal_year: fiscalYear,
        period,
        currency: "BRL",
        company_code: company.code,
        area_code: area.code,
        cost_center_code: `CC-${token}`,
        management_account_code: `MG-${token}`,
        nature_code: `NAT-${token}`,
        ownership_type: "HOUSE",
        owner_email: admin.email,
        amount: 100,
        source_note: "integration-test",
        posting_date: "2027-01-01",
      };
      const [duplicateBatch] = await db
        .insert(financeImportBatches)
        .values({
          cycleId,
          loadType: "actual",
          mode: "append",
          status: "uploaded",
          sourceSystem: "integration-test",
          fileName: `${token}-duplicate.csv`,
          fileKey: `test/${token}-duplicate.csv`,
          fileUrl: `https://example.invalid/${token}-duplicate.csv`,
          fileHash: `${token.padEnd(64, "4").slice(0, 64)}`,
          fileSize: 1,
          rowCount: 1,
          createdBy: admin.id,
        })
        .$returningId();
      duplicateBatchId = duplicateBatch.id;
      await db.insert(financeImportStagingRows).values({
        batchId: duplicateBatchId,
        rowNumber: 2,
        rawData: actualRow,
        sourceRecordId,
        businessKeyHash: `${token.padEnd(64, "5").slice(0, 64)}`,
        amount: "100.00",
        status: "accepted",
      });
      const duplicateValidation = await caller.finance.imports.validate({
        batchId: duplicateBatchId,
      });
      expect(duplicateValidation).toMatchObject({ status: "validation_failed", rejected: 1 });
      const duplicateDetail = await caller.finance.imports.detail({ batchId: duplicateBatchId });
      expect(duplicateDetail.errors.map(item => item.errorCode)).toContain("B_DUPLICATE_PERSISTED");
      const replacementSourceId = `REPL-${token}`;
      const replacementRow = { ...actualRow, source_record_id: replacementSourceId, amount: 120 };
      const [replacementBatch] = await db
        .insert(financeImportBatches)
        .values({
          cycleId,
          loadType: "actual",
          mode: "replace_scope",
          status: "approval_pending",
          sourceSystem: "integration-test",
          fileName: `${token}-replacement.csv`,
          fileKey: `test/${token}-replacement.csv`,
          fileUrl: `https://example.invalid/${token}-replacement.csv`,
          fileHash: `${token.padEnd(64, "6").slice(0, 64)}`,
          fileSize: 1,
          rowCount: 1,
          createdBy: admin.id,
        })
        .$returningId();
      replacementBatchId = replacementBatch.id;
      await db.insert(financeImportStagingRows).values({
        batchId: replacementBatchId,
        rowNumber: 2,
        rawData: replacementRow,
        sourceRecordId: replacementSourceId,
        businessKeyHash: `${token.padEnd(64, "7").slice(0, 64)}`,
        amount: "120.00",
        status: "accepted",
      });
      await caller.finance.imports.approve({ batchId: replacementBatchId });
      const [originalAfterReplace] = await db
        .select({
          isActive: financeActualEntries.isActive,
          deactivatedByBatchId: financeActualEntries.deactivatedByBatchId,
        })
        .from(financeActualEntries)
        .where(eq(financeActualEntries.id, actualId))
        .limit(1);
      const [replacementActual] = await db
        .select()
        .from(financeActualEntries)
        .where(eq(financeActualEntries.batchId, replacementBatchId))
        .limit(1);
      replacementActualId = replacementActual?.id;
      expect(originalAfterReplace).toMatchObject({
        isActive: false,
        deactivatedByBatchId: replacementBatchId,
      });
      expect(replacementActual).toMatchObject({ isActive: true, actualAmount: "120.00" });
      await caller.finance.imports.reverse({
        batchId: replacementBatchId,
        comment: "Reversão do teste integrado.",
      });
      const [originalAfterReverse] = await db
        .select({
          isActive: financeActualEntries.isActive,
          deactivatedByBatchId: financeActualEntries.deactivatedByBatchId,
        })
        .from(financeActualEntries)
        .where(eq(financeActualEntries.id, actualId))
        .limit(1);
      const [replacementAfterReverse] = await db
        .select({ isActive: financeActualEntries.isActive })
        .from(financeActualEntries)
        .where(eq(financeActualEntries.id, replacementActualId!))
        .limit(1);
      expect(originalAfterReverse).toMatchObject({ isActive: true, deactivatedByBatchId: null });
      expect(replacementAfterReverse).toMatchObject({ isActive: false });
    } finally {
      if (runId)
        await db.delete(financeAllocationEntries).where(eq(financeAllocationEntries.runId, runId));
      if (allocationBatchId)
        await db
          .delete(financeAllocationRuns)
          .where(eq(financeAllocationRuns.batchId, allocationBatchId));
      if (ruleId)
        await db
          .delete(financeAllocationDestinations)
          .where(eq(financeAllocationDestinations.ruleId, ruleId));
      if (ruleId)
        await db.delete(financeAllocationRules).where(eq(financeAllocationRules.id, ruleId));
      if (allocationBatchId) {
        await db
          .delete(financeImportErrors)
          .where(eq(financeImportErrors.batchId, allocationBatchId));
        await db
          .delete(financeImportStagingRows)
          .where(eq(financeImportStagingRows.batchId, allocationBatchId));
        await db
          .delete(financeBatchApprovals)
          .where(eq(financeBatchApprovals.batchId, allocationBatchId));
      }
      if (replacementActualId)
        await db
          .delete(financeActualEntries)
          .where(eq(financeActualEntries.id, replacementActualId));
      if (actualId)
        await db.delete(financeActualEntries).where(eq(financeActualEntries.id, actualId));
      if (decisionId) await db.delete(decisions).where(eq(decisions.id, decisionId));
      const cleanupBatchIds = [
        allocationBatchId,
        actualBatchId,
        duplicateBatchId,
        replacementBatchId,
      ].filter((id): id is number => Boolean(id));
      if (cleanupBatchIds.length) {
        await db
          .delete(financeImportErrors)
          .where(inArray(financeImportErrors.batchId, cleanupBatchIds));
        await db
          .delete(financeImportStagingRows)
          .where(inArray(financeImportStagingRows.batchId, cleanupBatchIds));
        await db
          .delete(financeBatchApprovals)
          .where(inArray(financeBatchApprovals.batchId, cleanupBatchIds));
        await db
          .delete(financeImportBatches)
          .where(inArray(financeImportBatches.id, cleanupBatchIds));
      }
      if (dimensionIds.length)
        await db
          .delete(financeMappingRules)
          .where(inArray(financeMappingRules.targetDimensionId, dimensionIds));
      if (dimensionIds.length)
        await db.delete(financeDimensions).where(inArray(financeDimensions.id, dimensionIds));
      if (cycleId) {
        if (cleanupBatchIds.length)
          await db
            .delete(auditEvents)
            .where(
              and(
                eq(auditEvents.entityType, "finance_import_batch"),
                inArray(auditEvents.entityId, cleanupBatchIds.map(String))
              )
            );
        await db.delete(financeCycles).where(eq(financeCycles.id, cycleId));
      }
    }
  }, 15_000);
});
