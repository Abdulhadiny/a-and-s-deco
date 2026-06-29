"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils/currency";

export function UtilizationTable({ data }: { data: any[] }) {
  const columns: Column<any>[] = [
    { key: "name", header: "Item Name", cell: (r) => <span className="font-semibold text-foreground">{r.name}</span> },
    { key: "tag", header: "Tag", cell: (r) => <span className="text-muted-foreground font-mono text-xs">{r.tag}</span> },
    { key: "qty", header: "Times Rented", cell: (r) => <span className="text-emerald-500 font-medium">{r.rentedQty}</span> },
    { key: "rev", header: "Est. Revenue", cell: (r) => <span className="text-foreground/80">{formatCurrency(r.potentialRevenue)}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Not enough rental data yet."
    />
  );
}

export function StockHealthTable({ data }: { data: any[] }) {
  const columns: Column<any>[] = [
    { key: "name", header: "Item Name", cell: (r) => <span className="font-semibold text-foreground">{r.name}</span> },
    { key: "tag", header: "Tag", cell: (r) => <span className="text-muted-foreground font-mono text-xs">{r.tag}</span> },
    { key: "issues", header: "Damaged / Missing Qty", cell: (r) => <span className="text-rose-500 font-bold">{r.issuesQty}</span> },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="All items are in good health."
    />
  );
}
