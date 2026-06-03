import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { UserForm } from "@/components/shared/user-form";
import { Card, CardContent } from "@/components/ui/card";

interface EditUserPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params;
  
  const [user, roles, locations] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.role.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Edit User"
        description={`Modify settings for ${user.name}`}
      />

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="pt-8">
          <UserForm initialData={user} roles={roles} locations={locations} />
        </CardContent>
      </Card>
    </div>
  );
}
