import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/data-table";
import { PackageOpen, AlertTriangle, TrendingUp, ShieldAlert } from "lucide-react";
import { formatCurrency } from "@/lib/utils/currency";

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

  const utilizationColumns: Column<any>[] = [
    { key: "name", header: "Item Name", cell: (r) => <span className="font-semibold text-zinc-100">{r.name}</span> },
    { key: "tag", header: "Tag", cell: (r) => <span className="text-zinc-500 font-mono text-xs">{r.tag}</span> },
    { key: "qty", header: "Times Rented", cell: (r) => <span className="text-emerald-500 font-medium">{r.rentedQty}</span> },
    { key: "rev", header: "Est. Revenue", cell: (r) => <span className="text-zinc-300">{formatCurrency(r.potentialRevenue)}</span> },
  ];

  const healthColumns: Column<any>[] = [
    { key: "name", header: "Item Name", cell: (r) => <span className="font-semibold text-zinc-100">{r.name}</span> },
    { key: "tag", header: "Tag", cell: (r) => <span className="text-zinc-500 font-mono text-xs">{r.tag}</span> },
    { key: "issues", header: "Damaged / Missing Qty", cell: (r) => <span className="text-rose-500 font-bold">{r.issuesQty}</span> },
  ];

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Inventory Insights"
        description="Analytics on item utilization and stock health."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Utilization */}
        <Card className="border-zinc-800 bg-zinc-950 flex flex-col h-full">
          <CardHeader className="border-b border-zinc-900 pb-4">
            <CardTitle className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top Utilized Items
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Most frequently rented items by total quantity out.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto rounded-xl border border-zinc-800">
              <DataTable
                columns={utilizationColumns}
                data={topUtilized}
                emptyMessage="Not enough rental data yet."
                mobileCardView={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stock Health */}
        <Card className="border-zinc-800 bg-zinc-950 flex flex-col h-full">
          <CardHeader className="border-b border-zinc-900 pb-4">
            <CardTitle className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Stock Health Warnings
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Items frequently returned damaged or missing.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-auto rounded-xl border border-zinc-800">
              <DataTable
                columns={healthColumns}
                data={stockHealth}
                emptyMessage="All items are in good health."
                mobileCardView={false}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
