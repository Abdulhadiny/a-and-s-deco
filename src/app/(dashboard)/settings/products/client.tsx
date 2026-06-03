"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { Package } from "lucide-react";

export function ProductsTable({ categories }: { categories: any[] }) {
  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Category Name",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.name}</span>
          {row.description && <span className="text-xs text-muted-foreground line-clamp-1">{row.description}</span>}
        </div>
      ),
    },
    {
      key: "itemCount",
      header: "Total Items",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Package className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground/80">{row._count.items}</span>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={categories}
      emptyMessage="No categories found."
    />
  );
}
