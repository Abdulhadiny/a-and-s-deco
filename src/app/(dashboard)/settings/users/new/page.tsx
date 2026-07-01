import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { UserForm } from "@/components/shared/user-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewUserPage() {
  const [roles, locations] = await Promise.all([
    db.role.findMany({ where: { name: { not: "super_admin" } }, orderBy: { name: "asc" } }),
    db.location.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Create New User"
        description="Add a new staff member and assign their role"
      />

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="pt-8">
          <UserForm roles={roles} locations={locations} />
        </CardContent>
      </Card>
    </div>
  );
}
