import { PageHeader } from "@/components/shared/page-header";
import { LocationForm } from "@/components/shared/location-form";
import { Card, CardContent } from "@/components/ui/card";

export default function NewLocationPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageHeader
        title="Create New Location"
        description="Add a new warehouse, office, or event site to track inventory"
      />

      <Card className="border-zinc-800 bg-zinc-950 shadow-sm overflow-hidden">
        <CardContent className="pt-8">
          <LocationForm />
        </CardContent>
      </Card>
    </div>
  );
}
