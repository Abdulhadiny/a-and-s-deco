"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit2 } from "lucide-react";
import Link from "next/link";

export function LocationsTable({ locations }: { locations: any[] }) {
  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Location Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <MapPin className="h-4 w-4" />
          </div>
          <span className="font-semibold text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "address",
      header: "Address",
      cell: (row) => row.address || "—",
      className: "hidden md:table-cell",
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.isActive ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Link href={`/settings/locations/${row.id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
            <Edit2 className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={locations}
      emptyMessage="No locations found. Add your first warehouse or site."
    />
  );
}
