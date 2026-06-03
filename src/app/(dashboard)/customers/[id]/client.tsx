"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { format } from "date-fns";

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export function PaymentHistoryTable({ payments }: { payments: any[] }) {
  const paymentColumns: Column<any>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => format(new Date(row.paymentDate), "MMM d, yyyy"),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => <span className="font-semibold text-emerald-500">{formatNGN.format(Number(row.amount))}</span>,
    },
    {
      key: "method",
      header: "Method",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.paymentMethod.replace("_", " ")}</span>,
    },
    {
      key: "ref",
      header: "Ref",
      cell: (row) => <span className="text-xs text-muted-foreground">{row.reference || "—"}</span>,
      className: "hidden md:table-cell",
    },
  ];

  return (
    <DataTable
      columns={paymentColumns}
      data={payments}
      emptyMessage="No payments recorded yet."
    />
  );
}
