import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Plus } from "lucide-react";
import { UsersTable } from "./client";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await db.user.findMany({
    include: {
      role: true,
      location: true,
    },
    orderBy: { name: "asc" },
  });

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

      <UsersTable users={users} />
    </div>
  );
}
