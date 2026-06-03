import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportsTables } from "./client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // 1. Most Utilized Items (Top 10 items rented)
  const utilizedItemsRaw = await db.eventItem.groupBy({
    by: ["itemId"],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const itemDetails = await db.item.findMany({
    where: { id: { in: utilizedItemsRaw.map(u => u.itemId) } },
    select: { id: true, name: true, tag: true, rentalPrice: true },
  });

  const topUtilized = utilizedItemsRaw.map(u => {
    const detail = itemDetails.find(i => i.id === u.itemId);
    return {
      id: u.itemId,
      name: detail?.name || "Unknown Item",
      tag: detail?.tag || "—",
      rentedQty: u._sum.quantity || 0,
      potentialRevenue: (u._sum.quantity || 0) * Number(detail?.rentalPrice || 0),
    };
  });

  // 2. Stock Health Issues (Items with damage or loss returns)
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
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Inventory Insights"
        description="Analytics on item utilization and stock health."
      />

      <ReportsTables topUtilized={topUtilized} stockHealth={stockHealth} />
    </div>
  );
}
