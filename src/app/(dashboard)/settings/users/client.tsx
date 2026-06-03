"use client";

import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Shield, Edit2 } from "lucide-react";
import Link from "next/link";

export function UsersTable({ users }: { users: any[] }) {
  const columns: Column<any>[] = [
    {
      key: "name",
      header: "User",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-primary" />
          <span className="text-foreground/80">{row.role?.displayName || "STAFF"}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (row) => row.location?.name || "Global",
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
        <Link href={`/settings/users/${row.id}`}>
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
      data={users}
      emptyMessage="No users found."
    />
  );
}
