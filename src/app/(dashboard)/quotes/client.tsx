"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function QuotesTable({ quotes }: { quotes: any[] }) {
  const columns: Column<any>[] = [
    {
      key: "id",
      header: "Quote #",
      cell: (row) => (
        <span className="font-mono text-xs text-muted-foreground uppercase">
          {row.id.substring(row.id.length - 8)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      cell: (row) => formatDate(row.createdAt),
      className: "hidden md:table-cell",
    },
    {
      key: "customer",
      header: "Customer",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.event.customer.name}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">{row.event.title}</span>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      cell: (row) => <span className="font-semibold text-foreground/90">{formatCurrency(row.total)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Link href={`/quotes/${row.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={quotes}
      emptyMessage="No quotes generated yet."
    />
  );
}
