import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Users, Plus, Edit2, Shield } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await db.user.findMany({
    include: {
      role: true,
      location: true,
    },
    orderBy: { name: "asc" },
  });

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "User",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-100">{row.name}</span>
          <span className="text-xs text-zinc-500">{row.email}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-primary" />
          <span className="text-zinc-300">{row.role?.displayName || "STAFF"}</span>
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
            <Edit2 className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage system access and permissions"
        action={{
          label: "Add User",
          icon: Plus,
          href: "/settings/users/new",
        }}
      />

      <DataTable
        columns={columns}
        data={users}
        emptyMessage="No users found."
      />
    </div>
  );
}
