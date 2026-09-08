import FinanceLayout from "./FinanceLayout";
import { ContextQuality } from "./FinanceMarketContextQuality";
import { Future } from "./FinanceMarketFuture";
import { Overview } from "./FinanceMarketOverview";
import { Transactions } from "./FinanceMarketTransactions";
import { Variation } from "./FinanceMarketVariation";
import type { View } from "./FinanceMarketUtils";

export default function FinanceMarket({ view }: { view: View }) {
  return (
    <FinanceLayout>
      {view === "overview" ? (
        <Overview />
      ) : view === "variation" ? (
        <Variation />
      ) : view === "transactions" ? (
        <Transactions />
      ) : view === "context" ? (
        <ContextQuality />
      ) : (
        <Future />
      )}
    </FinanceLayout>
  );
}
