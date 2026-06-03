"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, ShieldAlert } from "lucide-react";

export function ReportsTables({ topUtilized, stockHealth }: { topUtilized: any[], stockHealth: any[] }) {
  const utilizationColumns: Column<any>[] = [
    { key: "name", header: "Item Name", cell: (r) => <span className="font-semibold text-foreground">{r.name}</span> },
    { key: "tag", header: "Tag", cell: (r) => <span className="text-muted-foreground font-mono text-xs">{r.tag}</span> },
    { key: "qty", header: "Times Rented", cell: (r) => <span className="text-emerald-500 font-medium">{r.rentedQty}</span> },
    { key: "rev", header: "Est. Revenue", cell: (r) => <span className="text-foreground/80">{formatCurrency(r.potentialRevenue)}</span> },
  ];

  const healthColumns: Column<any>[] = [
    { key: "name", header: "Item Name", cell: (r) => <span className="font-semibold text-foreground">{r.name}</span> },
    { key: "tag", header: "Tag", cell: (r) => <span className="text-muted-foreground font-mono text-xs">{r.tag}</span> },
    { key: "issues", header: "Damaged / Missing Qty", cell: (r) => <span className="text-rose-500 font-bold">{r.issuesQty}</span> },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Utilization */}
      <Card className="border-border bg-card flex flex-col h-full">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Top Utilized Items
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Most frequently rented items by total quantity out.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto rounded-xl border border-border">
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
      <Card className="border-border bg-card flex flex-col h-full">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            Stock Health Warnings
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Items frequently returned damaged or missing.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto rounded-xl border border-border">
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
  );
}
