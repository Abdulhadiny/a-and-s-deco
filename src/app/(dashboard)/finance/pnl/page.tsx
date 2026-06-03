import { PageHeader } from "@/components/shared/page-header";
import { FinanceNav } from "@/components/finance/finance-nav";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { calculatePnL } from "@/lib/pnl-calculator";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PnLPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const pnl = await calculatePnL(startOfMonth, endOfMonth);

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Profit & Loss"
        description={`Financial summary for ${monthLabel}`}
      />
      <FinanceNav />

      <Card className="border border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-100">
            Income — {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border-b border-zinc-900 py-3">
            <span className="text-sm text-zinc-300">Total Payments Received</span>
            <span className="text-sm font-medium text-emerald-500">
              {formatCurrency(pnl.breakdown.sales)}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 font-semibold">
            <span className="text-zinc-100">Total Income</span>
            <span className="text-emerald-500">{formatCurrency(pnl.totalIncome)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-zinc-800 bg-zinc-950">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-100">
            Expenses — {monthLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border-b border-zinc-900 py-3">
            <span className="text-sm text-zinc-300">Operational Expenses</span>
            <span className="text-sm font-medium text-rose-500">
              {formatCurrency(pnl.breakdown.expenses)}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 font-semibold">
            <span className="text-zinc-100">Total Expenses</span>
            <span className="text-rose-500">{formatCurrency(pnl.totalExpenses)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-zinc-800 bg-zinc-950">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-zinc-100">Net Profit / Loss</span>
            <span
              className={`text-2xl font-bold ${
                pnl.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {formatCurrency(pnl.netProfit)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
