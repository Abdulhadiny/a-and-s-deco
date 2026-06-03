import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { LocationForm } from "@/components/shared/location-form";
import { Card, CardContent } from "@/components/ui/card";

interface EditLocationPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLocationPage({ params }: EditLocationPageProps) {
  const { id } = await params;
  const location = await db.location.findUnique({
    where: { id },
  });

  if (!location) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Edit Location"
        description={`Modify settings for ${location.name}`}
      />

      <Card className="border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
        <CardContent className="pt-8">
          <LocationForm initialData={location} />
        </CardContent>
      </Card>
    </div>
  );
}
