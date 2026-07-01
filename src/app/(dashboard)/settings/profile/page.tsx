import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <PageHeader
        title="My Profile"
        description="Update your name and password"
        backHref="/settings"
      />

      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-fit rounded-lg bg-primary/10 p-2.5 text-primary">
              <UserCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-foreground">{user.name}</CardTitle>
              <CardDescription className="text-muted-foreground">{session.user.role}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ProfileForm initialName={user.name} email={user.email} />
        </CardContent>
      </Card>
    </div>
  );
}
