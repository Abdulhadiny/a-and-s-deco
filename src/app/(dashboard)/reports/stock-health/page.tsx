import { PageHeader } from "@/components/shared/page-header";
import { ReportsNav } from "@/components/reports/reports-nav";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StockHealthTable } from "../client";

export const dynamic = "force-dynamic";

export default async function StockHealthPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const damagedReturns = await db.eventItem.groupBy({
    by: ["itemId"],
    where: { returnCondition: { in: ["DAMAGED", "MISSING"] } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const damageDetails = await db.item.findMany({
    where: { id: { in: damagedReturns.map(d => d.itemId) } },
    select: { id: true, name: true, tag: true },
  });

  const stockHealth = damagedReturns.map(d => {
    const detail = damageDetails.find(i => i.id === d.itemId);
    return {
      id: d.itemId,
      name: detail?.name || "Unknown Item",
      tag: detail?.tag || "—",
      issuesQty: d._sum.quantity || 0,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reports"
        description="Analytics on item utilization and stock health."
      />

      <ReportsNav />

      <div>
        <h2 className="text-base font-semibold mb-1">Stock Health Warnings</h2>
        <p className="text-sm text-muted-foreground mb-4">Items frequently returned damaged or missing.</p>
        <StockHealthTable data={stockHealth} />
      </div>
    </div>
  );
}
