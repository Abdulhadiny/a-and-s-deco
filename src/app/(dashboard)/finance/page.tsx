import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { FinanceNav } from "@/components/finance/finance-nav";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { calculatePnL } from "@/lib/pnl-calculator";
import { Wallet, TrendingDown, TrendingUp, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function FinanceOverviewPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    allExpenses,
    pnl,
    categoryCount,
    recentGeneral,
    recentPayments,
  ] = await Promise.all([
    db.expense.aggregate({ _sum: { amount: true } }),
    calculatePnL(startOfMonth, endOfMonth),
    db.expenseCategory.count({ where: { isActive: true } }),
    db.expense.findMany({
      take: 5,
      orderBy: { expenseDate: "desc" },
      include: { category: true },
    }),
    db.customerPayment.findMany({
      take: 5,
      orderBy: { paymentDate: "desc" },
      include: { customer: true },
    }),
  ]);

  const totalCostsAllTime = Number(allExpenses._sum.amount || 0);

  // Merge recent entries from all sources into a unified list
  const recentTransactions = [
    ...recentGeneral.map((e) => ({
      id: `exp-${e.id}`,
      label: e.category.name,
      sublabel: e.description || "General Expense",
      amount: Number(e.amount),
      date: e.expenseDate,
      type: "Expense" as const,
    })),
    ...recentPayments.map((p) => ({
      id: `pay-${p.id}`,
      label: "Customer Payment",
      sublabel: p.customer.name,
      amount: Number(p.amount),
      date: p.paymentDate,
      type: "Income" as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Finance"
        description="Track expenses, income, and monitor profitability."
      />
      <FinanceNav />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Costs"
          value={formatCompactCurrency(totalCostsAllTime)}
          tooltip={formatCurrency(totalCostsAllTime)}
          icon={Wallet}
          color="blue"
          description="All time"
        />
        <StatCard
          title="Costs This Month"
          value={formatCompactCurrency(pnl.totalExpenses)}
          tooltip={formatCurrency(pnl.totalExpenses)}
          icon={TrendingDown}
          color="rose"
          description="Current month"
        />
        <StatCard
          title="Income This Month"
          value={formatCompactCurrency(pnl.totalIncome)}
          tooltip={formatCurrency(pnl.totalIncome)}
          icon={TrendingUp}
          color="teal"
          description="Current month"
        />
        <StatCard
          title="Net Profit This Month"
          value={formatCompactCurrency(pnl.netProfit)}
          tooltip={formatCurrency(pnl.netProfit)}
          icon={pnl.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={pnl.netProfit >= 0 ? "green" : "rose"}
          description={pnl.netProfit >= 0 ? "Profitable" : "Loss"}
        />
      </div>

      <Card className="border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900 pb-4">
          <CardTitle className="text-base font-semibold text-zinc-100">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">No transactions recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between group">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{t.label}</p>
                    <p className="text-xs text-zinc-500">
                      {t.sublabel} — {formatDate(t.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium border ${t.type === "Income" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"}`}>
                      {t.type}
                    </span>
                    <span className="text-sm font-semibold text-zinc-300">
                      {t.type === "Expense" ? "-" : "+"}{formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
