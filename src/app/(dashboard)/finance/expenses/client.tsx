"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

export function ExpensesTable({ expenses }: { expenses: any[] }) {
  const columns: Column<any>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => formatDate(row.expenseDate),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => row.category.name,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => <span className="text-muted-foreground">{row.description || "—"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => <span className="font-semibold text-rose-500">{formatCurrency(row.amount)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={expenses}
      emptyMessage="No expenses recorded yet."
    />
  );
}
